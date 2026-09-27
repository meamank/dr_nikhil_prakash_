import { Hono } from "hono"
import { and, desc, eq, gt, gte, like, lt, ne, or, sql } from "drizzle-orm"
import { normalizePhone } from "@repo/shared"
import { createDb } from "../db"
import * as schema from "../db/schema"
import { createAuth, type Env } from "../auth"
import {
  sendBookingConfirmWhatsApp,
  sendOtpWhatsApp,
} from "../whatsapp"

// Public booking flow: request OTP, verify it, then submit the appointment
// with the short-lived one-use booking token returned by verification.
//   Queue number is per clinic per day (resets daily).
//   PID is issued only when staff marks Paid (mark-paid endpoint below).

const booking = new Hono<{ Bindings: Env }>()

function newId(): string {
  return crypto.randomUUID()
}

function bad(
  c: { json: (b: unknown, s?: number) => Response },
  msg: string,
  status = 400,
) {
  return c.json({ error: msg }, status)
}

function startOfDayIST(d: Date): Date {
  // IST = UTC+5:30. Compute the UTC instant of 00:00 IST on d's IST date.
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  const y = ist.getUTCFullYear()
  const m = ist.getUTCMonth()
  const day = ist.getUTCDate()
  return new Date(Date.UTC(y, m, day) - 5.5 * 60 * 60 * 1000)
}

function startOfMonthIST(d: Date, monthOffset = 0): Date {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  return new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() + monthOffset, 1) -
      5.5 * 60 * 60 * 1000,
  )
}

const OTP_EXPIRY_MS = 5 * 60 * 1000
const OTP_RESEND_MS = 60 * 1000
const OTP_MAX_ATTEMPTS = 5
const APPOINTMENT_FEE_INR = 500
const ONLINE_BOOKING_PAUSED = true
const ONLINE_BOOKING_PAUSED_MESSAGE =
  "Online appointment booking is temporarily unavailable. Please contact the clinic."

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

function generateOtp(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz"
  const unbiasedLimit = Math.floor(256 / alphabet.length) * alphabet.length
  let code = ""
  while (code.length < 6) {
    const values = crypto.getRandomValues(new Uint8Array(6 - code.length))
    for (const value of values) {
      if (value < unbiasedLimit) code += alphabet[value % alphabet.length]
    }
  }
  return code
}

// POST /api/booking/otp/request
booking.post("/otp/request", async (c) => {
  if (ONLINE_BOOKING_PAUSED) {
    return bad(c, ONLINE_BOOKING_PAUSED_MESSAGE, 503)
  }
  const body = await c.req
    .json<{ mobile?: string; patientName?: string }>()
    .catch(() => null)
  const mobile = body?.mobile ? normalizePhone(body.mobile) : null
  const patientName = body?.patientName?.trim() ?? ""
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return bad(c, "Enter a valid 10-digit mobile number")
  }
  if (patientName.length < 2 || patientName.length > 100) {
    return bad(c, "Enter the patient's full name")
  }
  const db = createDb(c.env.DB)
  const now = new Date()
  const [latest] = await db
    .select({ createdAt: schema.bookingOtps.createdAt })
    .from(schema.bookingOtps)
    .where(eq(schema.bookingOtps.mobile, mobile))
    .orderBy(desc(schema.bookingOtps.createdAt))
    .limit(1)

  if (latest && now.getTime() - latest.createdAt.getTime() < OTP_RESEND_MS) {
    const retryAfter = Math.ceil(
      (OTP_RESEND_MS - (now.getTime() - latest.createdAt.getTime())) / 1000,
    )
    c.header("Retry-After", String(retryAfter))
    return c.json(
      { error: `Please wait ${retryAfter} seconds before requesting another OTP` },
      429,
    )
  }

  const id = newId()
  const code = generateOtp()
  await db.insert(schema.bookingOtps).values({
    id,
    mobile,
    codeHash: await sha256(`${id}:${code}`),
    attempts: 0,
    verified: false,
    expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
  })

  const sent = await sendOtpWhatsApp(c.env, mobile, code, patientName)
  if (!sent.ok) {
    await db.delete(schema.bookingOtps).where(eq(schema.bookingOtps.id, id))
    console.error("WhatsApp OTP send failed", sent.error)
    return bad(c, "Could not send the WhatsApp OTP. Please try again.", 502)
  }

  return c.json({ ok: true, expiresInSec: OTP_EXPIRY_MS / 1000 })
})

// POST /api/booking/otp/verify
booking.post("/otp/verify", async (c) => {
  if (ONLINE_BOOKING_PAUSED) {
    return bad(c, ONLINE_BOOKING_PAUSED_MESSAGE, 503)
  }
  const body = await c.req
    .json<{ mobile?: string; code?: string }>()
    .catch(() => null)
  const mobile = body?.mobile ? normalizePhone(body.mobile) : null
  const code = body?.code?.trim().toLowerCase() ?? ""
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile) || !/^[a-z]{6}$/.test(code)) {
    return bad(c, "Enter the 6-letter verification code")
  }
  const db = createDb(c.env.DB)
  const [otp] = await db
    .select()
    .from(schema.bookingOtps)
    .where(eq(schema.bookingOtps.mobile, mobile))
    .orderBy(desc(schema.bookingOtps.createdAt))
    .limit(1)

  if (!otp || otp.expiresAt.getTime() <= Date.now()) {
    return bad(c, "OTP has expired. Request a new one.")
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return bad(c, "Too many incorrect attempts. Request a new OTP.", 429)
  }
  if (otp.verified) {
    return c.json({ ok: true, bookingToken: otp.id, mobile })
  }

  const submittedHash = await sha256(`${otp.id}:${code}`)
  if (submittedHash !== otp.codeHash) {
    const attempts = otp.attempts + 1
    await db
      .update(schema.bookingOtps)
      .set({ attempts })
      .where(eq(schema.bookingOtps.id, otp.id))
    const remaining = OTP_MAX_ATTEMPTS - attempts
    return bad(
      c,
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Too many incorrect attempts. Request a new OTP.",
      remaining > 0 ? 400 : 429,
    )
  }

  await db
    .update(schema.bookingOtps)
    .set({ verified: true })
    .where(eq(schema.bookingOtps.id, otp.id))

  return c.json({ ok: true, bookingToken: otp.id, mobile })
})

// POST /api/booking/appointments
// { bookingToken, patientName, address?, mobile, age?, gender?,
//   clinic, date } — date is YYYY-MM-DD, booking allowed for today + next 2 days.
booking.post("/appointments", async (c) => {
  const body = await c.req
    .json<{
      patientName?: string
      address?: string
      mobile?: string
      patientAgeYears?: number
      patientGender?: "male" | "female" | "other"
      clinic?: "juran_chhapra" | "bhagwanpur"
      date?: string // YYYY-MM-DD
      bookingToken?: string
    }>()
    .catch(() => null)

  const patientName = body?.patientName?.trim()
  if (!patientName || patientName.length < 2) {
    return bad(c, "Enter the patient's full name")
  }
  const patientMobile = body?.mobile ? normalizePhone(body.mobile) : null
  if (!patientMobile || !/^[6-9]\d{9}$/.test(patientMobile)) {
    return bad(c, "Enter a valid 10-digit mobile number")
  }
  if (
    body?.patientGender &&
    !["male", "female", "other"].includes(body.patientGender)
  ) {
    return bad(c, "Invalid gender")
  }
  const age =
    typeof body?.patientAgeYears === "number"
      ? Math.trunc(body.patientAgeYears)
      : null
  if (age !== null && (age < 0 || age > 130)) {
    return bad(c, "Enter a valid age")
  }
  const clinic = body?.clinic ?? "juran_chhapra"
  if (!["juran_chhapra", "bhagwanpur"].includes(clinic)) {
    return bad(c, "Pick a clinic")
  }

  // Date picker: only today + 2 days advance (T+2)
  const dateStr = body?.date?.trim()
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return bad(c, "Pick a date")
  }
  const todayIST = startOfDayIST(new Date())
  const maxIST = new Date(todayIST.getTime() + 2 * 24 * 60 * 60 * 1000)
  const picked = new Date(`${dateStr}T00:00:00+05:30`)
  if (Number.isNaN(picked.getTime())) {
    return bad(c, "Pick a valid date")
  }
  const pickedDay = startOfDayIST(picked)
  const weekday = new Date(`${dateStr}T00:00:00Z`).getUTCDay()
  if (clinic === "juran_chhapra" && weekday === 6) {
    return bad(c, "Juran Chhapra clinic is closed on Saturdays")
  }
  if (clinic === "bhagwanpur" && weekday === 0) {
    return bad(c, "Bhagwanpur clinic is closed on Sundays")
  }
  if (pickedDay < todayIST) {
    return bad(c, "Date cannot be in the past")
  }
  if (pickedDay > maxIST) {
    return bad(c, "Booking is open only for today and the next 2 days")
  }

  const db = createDb(c.env.DB)

  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })
  const staffUser =
    session && (session.user.role === "staff" || session.user.role === "admin")
      ? session.user
      : null
  const bookingToken = body?.bookingToken?.trim()

  // Dashboard staff can book on a patient's behalf. Public callers, including
  // signed-in patient accounts, must prove control of the submitted mobile.
  if (!staffUser) {
    if (ONLINE_BOOKING_PAUSED) {
      return bad(c, ONLINE_BOOKING_PAUSED_MESSAGE, 503)
    }
    if (!bookingToken) {
      return bad(c, "Verify the mobile number before booking", 401)
    }
    const [verifiedOtp] = await db
      .select({ id: schema.bookingOtps.id })
      .from(schema.bookingOtps)
      .where(
        and(
          eq(schema.bookingOtps.id, bookingToken),
          eq(schema.bookingOtps.mobile, patientMobile),
          eq(schema.bookingOtps.verified, true),
          gt(schema.bookingOtps.expiresAt, new Date()),
        ),
      )
      .limit(1)
    if (!verifiedOtp) {
      return bad(c, "Mobile verification expired. Request a new OTP.", 401)
    }
  }

  // Queue number: max existing for this clinic + day, +1.
  // Uses max (not count) so deleted/no-show slots never cause duplicates.
  // scheduledAt is stored as the IST noon of the picked day (slot time TBD at clinic).
  const scheduledAt = new Date(pickedDay.getTime() + 12 * 60 * 60 * 1000)
  const dayStart = pickedDay
  const dayEnd = new Date(pickedDay.getTime() + 24 * 60 * 60 * 1000)
  const maxRow = await db
    .select({ max: sql<number | null>`max(${schema.appointments.queueNumber})` })
    .from(schema.appointments)
    .where(
      and(
        eq(schema.appointments.clinic, clinic),
        gte(schema.appointments.scheduledAt, dayStart),
        lt(schema.appointments.scheduledAt, dayEnd),
      ),
    )
  const queueNumber = (maxRow[0]?.max ?? 0) + 1

  // One mobile can book many patients — no dedup, always a new request row.
  const id = newId()
  if (!staffUser) {
    const claimed = await c.env.DB
      .prepare(
        "DELETE FROM booking_otps WHERE id = ? AND mobile = ? AND verified = 1 AND expires_at > ? RETURNING id",
      )
      .bind(bookingToken, patientMobile, Math.floor(Date.now() / 1000))
      .first<{ id: string }>()
    if (!claimed) {
      return bad(c, "Mobile verification was already used or has expired", 401)
    }
  }

  await db.insert(schema.appointments).values({
    id,
    patientPid: null,
    patientName,
    patientMobile,
    patientAddress: body?.address?.trim() || null,
    patientGender: body?.patientGender ?? null,
    patientAgeYears: age,
    clinic,
    queueNumber,
    bookedBy: staffUser?.id ?? null,
    scheduledAt,
    status: "not_paid",
    paymentStatus: "unpaid",
  })

  if (!staffUser) {
    const [year, month, day] = dateStr.split("-")
    c.executionCtx.waitUntil(
      sendBookingConfirmWhatsApp(c.env, patientMobile, id, {
        patientName,
        appointmentDate: `${day}-${month}-${year}`,
        queueNumber,
      }),
    )
  }

  return c.json(
    { ok: true, appointmentId: id, queueNumber, status: "not_paid" },
    201,
  )
})

// GET /api/booking/appointments?clinic=&date=YYYY-MM-DD — staff day view
// Current all-time dashboard totals. Revenue follows the appointment's current
// status, so a formerly paid appointment stops contributing after a change.
booking.get("/dashboard-summary", async (c) => {
  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })
  if (!session) return bad(c, "Sign in to view dashboard totals", 401)
  if (session.user.role !== "staff" && session.user.role !== "admin") {
    return bad(c, "Staff access required", 403)
  }

  const db = createDb(c.env.DB)
  const requestedPeriod = c.req.query("period")
  const requestedFrom = c.req.query("from")
  const requestedTo = c.req.query("to")
  const hasCustomRange =
    /^\d{4}-\d{2}-\d{2}$/.test(requestedFrom ?? "") &&
    /^\d{4}-\d{2}-\d{2}$/.test(requestedTo ?? "")
  const period = ["1d", "7d", "30d", "90d"].includes(requestedPeriod ?? "")
    ? (requestedPeriod as "1d" | "7d" | "30d" | "90d")
    : hasCustomRange
      ? "custom"
      : "total"
  const periodDays =
    period === "1d"
      ? 1
      : period === "7d"
        ? 7
        : period === "30d"
          ? 30
          : period === "90d"
            ? 90
            : null
  const todayStart = startOfDayIST(new Date())
  const customStart = hasCustomRange
    ? startOfDayIST(new Date(`${requestedFrom}T00:00:00+05:30`))
    : null
  const customLastDay = hasCustomRange
    ? startOfDayIST(new Date(`${requestedTo}T00:00:00+05:30`))
    : null
  if (
    hasCustomRange &&
    (!customStart ||
      !customLastDay ||
      Number.isNaN(customStart.getTime()) ||
      Number.isNaN(customLastDay.getTime()) ||
      customLastDay < customStart)
  ) {
    return bad(c, "Invalid dashboard date range")
  }
  const currentEnd = customLastDay
    ? new Date(customLastDay.getTime() + 24 * 60 * 60 * 1000)
    : new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const periodStart = customStart
    ? customStart
    : periodDays
      ? new Date(
          todayStart.getTime() -
            (periodDays - 1) * 24 * 60 * 60 * 1000,
        )
      : null
  const comparisonDays = periodStart
    ? Math.round(
        (currentEnd.getTime() - periodStart.getTime()) /
          (24 * 60 * 60 * 1000),
      )
    : null
  const aggregate = async (start?: Date, end?: Date) => {
    const [row] = await db
      .select({
        totalAppointments: sql<number>`count(*)`,
        paidAppointments: sql<number>`sum(case when ${schema.appointments.status} = 'paid' then 1 else 0 end)`,
        focAppointments: sql<number>`sum(case when ${schema.appointments.status} = 'foc' then 1 else 0 end)`,
        refundedAppointments: sql<number>`sum(case when ${schema.appointments.status} = 'refunded' then 1 else 0 end)`,
      })
      .from(schema.appointments)
      .where(
        start && end
          ? and(
              gte(schema.appointments.scheduledAt, start),
              lt(schema.appointments.scheduledAt, end),
            )
          : undefined,
      )
    return row
  }

  const result = await aggregate(periodStart ?? undefined, periodStart ? currentEnd : undefined)
  const paidAppointments = Number(result?.paidAppointments ?? 0)
  const comparisonStart = periodStart ?? startOfMonthIST(new Date())
  const comparisonEnd = currentEnd
  const previousStart = comparisonDays
    ? new Date(
        comparisonStart.getTime() -
          comparisonDays * 24 * 60 * 60 * 1000,
      )
    : startOfMonthIST(new Date(), -1)
  const previousEnd = comparisonStart
  const [comparisonCurrent, comparisonPrevious] = await Promise.all([
    aggregate(comparisonStart, comparisonEnd),
    aggregate(previousStart, previousEnd),
  ])
  const patientAggregate = async (start?: Date, end?: Date) => {
    const [row] = await db
      .select({
        totalPatients: sql<number>`count(*)`,
        malePatients: sql<number>`sum(case when ${schema.patients.gender} = 'male' then 1 else 0 end)`,
        femalePatients: sql<number>`sum(case when ${schema.patients.gender} = 'female' then 1 else 0 end)`,
      })
      .from(schema.patients)
      .where(
        start && end
          ? and(
              gte(schema.patients.createdAt, start),
              lt(schema.patients.createdAt, end),
            )
          : undefined,
      )
    return row
  }
  const patientComparisonStart = periodStart ?? startOfMonthIST(new Date())
  const patientPreviousStart = comparisonDays
    ? new Date(
        patientComparisonStart.getTime() -
          comparisonDays * 24 * 60 * 60 * 1000,
      )
    : startOfMonthIST(new Date(), -1)
  const [patientResult, currentPatientTrend, previousPatientResult] = await Promise.all([
    patientAggregate(periodStart ?? undefined, periodStart ? currentEnd : undefined),
    patientAggregate(patientComparisonStart, currentEnd),
    patientAggregate(patientPreviousStart, patientComparisonStart),
  ])

  return c.json({
    totalAppointments: Number(result?.totalAppointments ?? 0),
    paidAppointments,
    focAppointments: Number(result?.focAppointments ?? 0),
    refundedAppointments: Number(result?.refundedAppointments ?? 0),
    appointmentFee: APPOINTMENT_FEE_INR,
    totalRevenue: paidAppointments * APPOINTMENT_FEE_INR,
    totalPatients: Number(patientResult?.totalPatients ?? 0),
    genderDistribution: {
      male: Number(patientResult?.malePatients ?? 0),
      female: Number(patientResult?.femalePatients ?? 0),
    },
    patientTrend: {
      currentPatients: Number(currentPatientTrend?.totalPatients ?? 0),
      previousPatients: Number(previousPatientResult?.totalPatients ?? 0),
    },
    period,
    trend: {
      currentRevenue:
        Number(comparisonCurrent?.paidAppointments ?? 0) * APPOINTMENT_FEE_INR,
      previousRevenue:
        Number(comparisonPrevious?.paidAppointments ?? 0) * APPOINTMENT_FEE_INR,
      currentAppointments: Number(comparisonCurrent?.totalAppointments ?? 0),
      previousAppointments: Number(comparisonPrevious?.totalAppointments ?? 0),
      comparison:
        comparisonDays === 1
          ? "day"
          : comparisonDays === 7
            ? "week"
            : comparisonDays !== null && comparisonDays >= 28 && comparisonDays <= 31
              ? "month"
              : comparisonDays === null
                ? "month"
                : "period",
    },
  })
})

booking.get("/dashboard-chart", async (c) => {
  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })
  if (!session) return bad(c, "Sign in to view dashboard analytics", 401)
  if (session.user.role !== "staff" && session.user.role !== "admin") {
    return bad(c, "Staff access required", 403)
  }

  const requestedPeriod = c.req.query("period")
  const requestedFrom = c.req.query("from")
  const requestedTo = c.req.query("to")
  const hasCustomRange =
    /^\d{4}-\d{2}-\d{2}$/.test(requestedFrom ?? "") &&
    /^\d{4}-\d{2}-\d{2}$/.test(requestedTo ?? "")
  const periodDays =
    requestedPeriod === "7d"
      ? 7
      : requestedPeriod === "30d"
        ? 30
        : requestedPeriod === "90d"
          ? 90
          : null
  const todayStart = startOfDayIST(new Date())
  const start = hasCustomRange
    ? startOfDayIST(new Date(`${requestedFrom}T00:00:00+05:30`))
    : periodDays
      ? new Date(
          todayStart.getTime() -
            (periodDays - 1) * 24 * 60 * 60 * 1000,
        )
      : null
  const lastDay = hasCustomRange
    ? startOfDayIST(new Date(`${requestedTo}T00:00:00+05:30`))
    : todayStart
  if (
    start &&
    (Number.isNaN(start.getTime()) ||
      Number.isNaN(lastDay.getTime()) ||
      lastDay < start)
  ) {
    return bad(c, "Invalid dashboard date range")
  }
  const end = start
    ? new Date(lastDay.getTime() + 24 * 60 * 60 * 1000)
    : null
  const dateExpression =
    "date(%COLUMN%, 'unixepoch', '+5 hours', '+30 minutes')"
  const appointmentDate = dateExpression.replace("%COLUMN%", "scheduled_at")
  const patientDate = dateExpression.replace("%COLUMN%", "created_at")
  const appointmentSql = `
    SELECT ${appointmentDate} AS date,
      count(*) AS appointments,
      sum(case when status = 'paid' then ${APPOINTMENT_FEE_INR} else 0 end) AS revenue
    FROM appointments
    ${start && end ? "WHERE scheduled_at >= ? AND scheduled_at < ?" : ""}
    GROUP BY ${appointmentDate}
  `
  const patientSql = `
    SELECT ${patientDate} AS date, count(*) AS patients
    FROM patients
    ${start && end ? "WHERE created_at >= ? AND created_at < ?" : ""}
    GROUP BY ${patientDate}
  `
  const appointmentStatement = c.env.DB.prepare(appointmentSql)
  const patientStatement = c.env.DB.prepare(patientSql)
  const startUnix = start ? Math.floor(start.getTime() / 1000) : null
  const endUnix = end ? Math.floor(end.getTime() / 1000) : null
  const [appointmentRows, patientRows] = await Promise.all([
    (startUnix !== null && endUnix !== null
      ? appointmentStatement.bind(startUnix, endUnix)
      : appointmentStatement
    ).all<{ date: string; appointments: number; revenue: number }>(),
    (startUnix !== null && endUnix !== null
      ? patientStatement.bind(startUnix, endUnix)
      : patientStatement
    ).all<{ date: string; patients: number }>(),
  ])

  const points = new Map<
    string,
    { date: string; revenue: number; patients: number; appointments: number }
  >()
  for (const row of appointmentRows.results) {
    points.set(row.date, {
      date: row.date,
      revenue: Number(row.revenue ?? 0),
      patients: 0,
      appointments: Number(row.appointments ?? 0),
    })
  }
  for (const row of patientRows.results) {
    const point = points.get(row.date) ?? {
      date: row.date,
      revenue: 0,
      patients: 0,
      appointments: 0,
    }
    point.patients = Number(row.patients ?? 0)
    points.set(row.date, point)
  }

  return c.json({
    points: [...points.values()].sort((a, b) => a.date.localeCompare(b.date)),
  })
})

// GET /api/booking/reports?period=1d|7d|30d|90d|180d&from=&to=&clinic=
// Operational appointment and payment report for staff reconciliation.
booking.get("/reports", async (c) => {
  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })
  if (!session) return bad(c, "Sign in to view reports", 401)
  if (session.user.role !== "staff" && session.user.role !== "admin") {
    return bad(c, "Staff access required", 403)
  }

  const requestedPeriod = c.req.query("period")
  const period = ["1d", "7d", "30d", "90d", "180d"].includes(
    requestedPeriod ?? "",
  )
    ? (requestedPeriod as "1d" | "7d" | "30d" | "90d" | "180d")
    : "1d"
  const periodDays = Number(period.slice(0, -1))
  const requestedFrom = c.req.query("from")
  const requestedTo = c.req.query("to")
  const customRequested =
    requestedFrom !== undefined || requestedTo !== undefined
  const validCustomRange =
    /^\d{4}-\d{2}-\d{2}$/.test(requestedFrom ?? "") &&
    /^\d{4}-\d{2}-\d{2}$/.test(requestedTo ?? "")
  if (customRequested && !validCustomRange) {
    return bad(c, "Select a valid report date range")
  }

  const today = startOfDayIST(new Date())
  const start = validCustomRange
    ? startOfDayIST(new Date(`${requestedFrom}T00:00:00+05:30`))
    : new Date(today.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000)
  const lastDay = validCustomRange
    ? startOfDayIST(new Date(`${requestedTo}T00:00:00+05:30`))
    : today
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(lastDay.getTime()) ||
    lastDay < start
  ) {
    return bad(c, "Select a valid report date range")
  }
  const end = new Date(lastDay.getTime() + 24 * 60 * 60 * 1000)
  const clinicQuery = c.req.query("clinic")
  const clinic =
    clinicQuery === "juran_chhapra" || clinicQuery === "bhagwanpur"
      ? clinicQuery
      : null

  const conditions = [
    gte(schema.appointments.scheduledAt, start),
    lt(schema.appointments.scheduledAt, end),
  ]
  if (clinic) conditions.push(eq(schema.appointments.clinic, clinic))

  const rows = await createDb(c.env.DB)
    .select({
      id: schema.appointments.id,
      patientPid: schema.appointments.patientPid,
      patientName: schema.appointments.patientName,
      patientMobile: schema.appointments.patientMobile,
      clinic: schema.appointments.clinic,
      queueNumber: schema.appointments.queueNumber,
      scheduledAt: schema.appointments.scheduledAt,
      status: schema.appointments.status,
      paymentStatus: schema.appointments.paymentStatus,
      paymentMode: schema.appointments.paymentMode,
    })
    .from(schema.appointments)
    .where(and(...conditions))
    .orderBy(
      desc(schema.appointments.scheduledAt),
      desc(schema.appointments.queueNumber),
    )

  type DailyReport = {
    date: string
    total: number
    paid: number
    foc: number
    refunded: number
    notPaid: number
    cashRevenue: number
    upiRevenue: number
    unallocatedRevenue: number
    revenue: number
  }
  const summary = {
    totalAppointments: rows.length,
    paidAppointments: 0,
    focAppointments: 0,
    refundedAppointments: 0,
    notPaidAppointments: 0,
    cashPaidAppointments: 0,
    upiPaidAppointments: 0,
    unallocatedPaidAppointments: 0,
    cashRefundedAppointments: 0,
    upiRefundedAppointments: 0,
    unallocatedRefundedAppointments: 0,
  }
  const days = new Map<string, DailyReport>()
  const dateInIst = (date: Date) =>
    new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)

  for (const row of rows) {
    const dayKey = dateInIst(row.scheduledAt)
    const day = days.get(dayKey) ?? {
      date: dayKey,
      total: 0,
      paid: 0,
      foc: 0,
      refunded: 0,
      notPaid: 0,
      cashRevenue: 0,
      upiRevenue: 0,
      unallocatedRevenue: 0,
      revenue: 0,
    }
    day.total += 1

    if (row.paymentStatus === "paid") {
      summary.paidAppointments += 1
      day.paid += 1
      day.revenue += APPOINTMENT_FEE_INR
      if (row.paymentMode === "cash") {
        summary.cashPaidAppointments += 1
        day.cashRevenue += APPOINTMENT_FEE_INR
      } else if (row.paymentMode === "upi") {
        summary.upiPaidAppointments += 1
        day.upiRevenue += APPOINTMENT_FEE_INR
      } else {
        summary.unallocatedPaidAppointments += 1
        day.unallocatedRevenue += APPOINTMENT_FEE_INR
      }
    } else if (row.paymentStatus === "foc") {
      summary.focAppointments += 1
      day.foc += 1
    } else if (row.paymentStatus === "refunded") {
      summary.refundedAppointments += 1
      day.refunded += 1
      if (row.paymentMode === "cash") summary.cashRefundedAppointments += 1
      else if (row.paymentMode === "upi") summary.upiRefundedAppointments += 1
      else summary.unallocatedRefundedAppointments += 1
    } else {
      summary.notPaidAppointments += 1
      day.notPaid += 1
    }
    days.set(dayKey, day)
  }

  const paidTotal = summary.paidAppointments * APPOINTMENT_FEE_INR
  const refundTotal = summary.refundedAppointments * APPOINTMENT_FEE_INR
  const cashPaidTotal = summary.cashPaidAppointments * APPOINTMENT_FEE_INR
  const upiPaidTotal = summary.upiPaidAppointments * APPOINTMENT_FEE_INR
  const unallocatedPaidTotal =
    summary.unallocatedPaidAppointments * APPOINTMENT_FEE_INR
  const cashRefundTotal = summary.cashRefundedAppointments * APPOINTMENT_FEE_INR
  const upiRefundTotal = summary.upiRefundedAppointments * APPOINTMENT_FEE_INR
  const unallocatedRefundTotal =
    summary.unallocatedRefundedAppointments * APPOINTMENT_FEE_INR

  return c.json({
    period: validCustomRange ? "custom" : period,
    from: dateInIst(start),
    to: dateInIst(lastDay),
    clinic: clinic ?? "all",
    appointmentFee: APPOINTMENT_FEE_INR,
    summary: {
      ...summary,
      grossRecordedCollections: paidTotal + refundTotal,
      refunds: refundTotal,
      netRevenue: paidTotal,
      cashCollected: cashPaidTotal + cashRefundTotal,
      cashRefunded: cashRefundTotal,
      expectedCash: cashPaidTotal,
      upiCollected: upiPaidTotal + upiRefundTotal,
      upiRefunded: upiRefundTotal,
      expectedUpi: upiPaidTotal,
      unallocatedCollected: unallocatedPaidTotal + unallocatedRefundTotal,
      unallocatedRefunded: unallocatedRefundTotal,
      unallocatedNet: unallocatedPaidTotal,
    },
    daily: [...days.values()].sort((a, b) => b.date.localeCompare(a.date)),
    appointments: rows.map((row) => ({
      ...row,
      reportDate: dateInIst(row.scheduledAt),
      netAmount:
        row.paymentStatus === "paid"
          ? APPOINTMENT_FEE_INR
          : row.paymentStatus === "refunded"
            ? -APPOINTMENT_FEE_INR
            : 0,
    })),
  })
})

booking.get("/appointments", async (c) => {
  const clinic = c.req.query("clinic")
  const dateStr = c.req.query("date")
  const searchQ = c.req.query("q")?.trim()

  const db = createDb(c.env.DB)

  // Reception search: name prefix, mobile, or PID across recent appointments.
  if (searchQ) {
    const pattern = `%${searchQ}%`
    const rows = await db
      .select()
      .from(schema.appointments)
      .where(
        or(
          like(schema.appointments.patientName, `${searchQ}%`),
          like(schema.appointments.patientMobile, pattern),
          like(schema.appointments.patientPid, pattern),
        ),
      )
      .orderBy(desc(schema.appointments.createdAt))
      .limit(20)
    return c.json({ appointments: rows })
  }

  // Day view: filter by clinic + date, ordered by queue
  const where = []
  if (clinic && ["juran_chhapra", "bhagwanpur"].includes(clinic)) {
    where.push(eq(schema.appointments.clinic, clinic as "juran_chhapra" | "bhagwanpur"))
  }
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const day = startOfDayIST(new Date(`${dateStr}T00:00:00+05:30`))
    where.push(gte(schema.appointments.scheduledAt, day))
    where.push(lt(schema.appointments.scheduledAt, new Date(day.getTime() + 24 * 60 * 60 * 1000)))
  }
  const rows = await db
    .select()
    .from(schema.appointments)
    .where(where.length ? and(...where) : undefined)
    .orderBy(schema.appointments.queueNumber)
    .limit(100)
  return c.json({ appointments: rows })
})

// PATCH /api/booking/appointments/:id (staff-only — TODO: require staff session)
// Edit booking details: name, address, mobiles, age, gender, clinic, date, status.
booking.patch("/appointments/:id", async (c) => {
  const id = c.req.param("id")
  const body = await c.req
    .json<{
      patientName?: string
      patientAddress?: string | null
      patientMobile?: string
      patientAgeYears?: number | null
      patientGender?: "male" | "female" | "other" | null
      clinic?: "juran_chhapra" | "bhagwanpur"
      date?: string
      status?: "not_paid" | "paid" | "foc" | "refunded" | "in_progress" | "done" | "no_show"
      paymentMode?: "cash" | "upi"
    }>()
    .catch(() => null)
  if (!body) return bad(c, "Invalid body")

  const db = createDb(c.env.DB)
  const rows = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, id))
    .limit(1)
  const appt = rows[0]
  if (!appt) return bad(c, "Appointment not found", 404)

  const patch: Partial<typeof schema.appointments.$inferInsert> = {}
  if (
    body.paymentMode !== undefined &&
    body.paymentMode !== "cash" &&
    body.paymentMode !== "upi"
  ) {
    return bad(c, "Invalid payment mode")
  }
  if (body.patientName !== undefined) {
    const name = body.patientName.trim()
    if (name.length < 2) return bad(c, "Enter the patient's full name")
    patch.patientName = name
  }
  if (body.patientAddress !== undefined) {
    patch.patientAddress = body.patientAddress?.trim() || null
  }
  if (body.patientMobile !== undefined) {
    const m = normalizePhone(body.patientMobile)
    if (!m || !/^[6-9]\d{9}$/.test(m)) return bad(c, "Enter a valid patient mobile number")
    patch.patientMobile = m
  }
  if (body.patientAgeYears !== undefined) {
    if (body.patientAgeYears === null) {
      patch.patientAgeYears = null
    } else {
      const age = Math.trunc(body.patientAgeYears)
      if (!Number.isFinite(age) || age < 0 || age > 130) return bad(c, "Enter a valid age")
      patch.patientAgeYears = age
    }
  }
  if (body.patientGender !== undefined) {
    if (body.patientGender !== null && !["male", "female", "other"].includes(body.patientGender)) {
      return bad(c, "Invalid gender")
    }
    patch.patientGender = body.patientGender
  }
  if (body.clinic !== undefined) {
    if (!["juran_chhapra", "bhagwanpur"].includes(body.clinic)) return bad(c, "Pick a clinic")
    patch.clinic = body.clinic
  }
  if (body.date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return bad(c, "Pick a valid date")
    const picked = new Date(`${body.date}T00:00:00+05:30`)
    if (Number.isNaN(picked.getTime())) return bad(c, "Pick a valid date")
    const pickedDay = startOfDayIST(picked)
    // Historical bookings may need correction, so edit requests are not
    // limited to the current booking window.
    patch.scheduledAt = new Date(pickedDay.getTime() + 12 * 60 * 60 * 1000)
  }
  if (body.status !== undefined) {
    if (!["not_paid", "paid", "foc", "refunded", "in_progress", "done", "no_show"].includes(body.status)) {
      return bad(c, "Invalid status")
    }
    if ((body.status === "paid" || body.status === "foc") && !appt.patientPid) {
      return bad(c, "Issue or link a PID before marking an appointment Paid or FOC")
    }
    if (body.status === "refunded" && appt.paymentStatus !== "paid") {
      return bad(c, "Only a paid appointment can be refunded")
    }
    patch.status = body.status
    // Reverting to Not Paid is an explicit payment undo. Keep the prior PID
    // reference and origin for audit/possible guarded cleanup, but remove the
    // active appointment-to-patient link and all payment/check-in state.
    if (body.status === "not_paid" && appt.patientPid) {
      patch.patientPid = null
      patch.paymentPatientPid = appt.patientPid
      patch.paymentStatus = "unpaid"
      patch.paymentMode = null
      patch.checkedInBy = null
      patch.checkedInAt = null
    }
    if (body.status === "paid" && appt.patientPid) {
      patch.paymentStatus = "paid"
      patch.paymentMode =
        body.paymentMode ??
        (appt.paymentStatus === "paid" ? appt.paymentMode : null) ??
        "cash"
    }
    if (body.status === "foc" && appt.patientPid) {
      patch.paymentStatus = "foc"
      patch.paymentMode = null
    }
    // Keep the appointment, PID, and all clinical records intact on refund.
    if (body.status === "refunded") {
      patch.paymentStatus = "refunded"
    }
  } else if (body.paymentMode !== undefined) {
    if (appt.paymentStatus !== "paid") {
      return bad(c, "Payment mode can only be set on a paid appointment")
    }
    patch.paymentMode = body.paymentMode
  }
  if (Object.keys(patch).length === 0) return bad(c, "Nothing to update")

  const destinationClinic = patch.clinic ?? appt.clinic
  const destinationScheduledAt = patch.scheduledAt ?? appt.scheduledAt
  const currentDay = startOfDayIST(appt.scheduledAt)
  const destinationDay = startOfDayIST(destinationScheduledAt)
  const movedQueueScope =
    destinationClinic !== appt.clinic ||
    destinationDay.getTime() !== currentDay.getTime()

  // Queue numbers belong to a specific clinic and date. A rescheduled booking
  // joins the end of its new day's queue instead of carrying its old number.
  if (movedQueueScope) {
    const destinationEnd = new Date(
      destinationDay.getTime() + 24 * 60 * 60 * 1000
    )
    const maxRow = await db
      .select({ max: sql<number | null>`max(${schema.appointments.queueNumber})` })
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.clinic, destinationClinic),
          gte(schema.appointments.scheduledAt, destinationDay),
          lt(schema.appointments.scheduledAt, destinationEnd),
          ne(schema.appointments.id, id),
        )
      )
    patch.queueNumber = (maxRow[0]?.max ?? 0) + 1
  }

  if (movedQueueScope) {
    const sourceEnd = new Date(currentDay.getTime() + 24 * 60 * 60 * 1000)
    await db.batch([
      db.update(schema.appointments).set(patch).where(eq(schema.appointments.id, id)),
      // Close the source day's gap: 11 becomes 10, 12 becomes 11, and so on.
      db
        .update(schema.appointments)
        .set({ queueNumber: sql`${schema.appointments.queueNumber} - 1` })
        .where(
          and(
            eq(schema.appointments.clinic, appt.clinic),
            gte(schema.appointments.scheduledAt, currentDay),
            lt(schema.appointments.scheduledAt, sourceEnd),
            gt(schema.appointments.queueNumber, appt.queueNumber),
          )
        ),
    ])
  } else {
    await db.update(schema.appointments).set(patch).where(eq(schema.appointments.id, id))
  }
  const updated = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, id))
    .limit(1)
  return c.json({ appointment: updated[0] })
})

// DELETE /api/booking/appointments/:id — remove an appointment and close its
// queue gap. A patient is deleted only when this appointment created the PID,
// and that patient has no visits, other linked appointments, or portal account.
booking.delete("/appointments/:id", async (c) => {
  const id = c.req.param("id")
  const db = createDb(c.env.DB)
  const rows = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, id))
    .limit(1)
  const appt = rows[0]
  if (!appt) return bad(c, "Appointment not found", 404)

  const cleanupPid =
    appt.patientPidOrigin === "created"
      ? appt.paymentPatientPid ?? appt.patientPid
      : null
  let deletedPatient = false

  if (cleanupPid) {
    const [patient] = await db
      .select({ pid: schema.patients.pid, userId: schema.patients.userId })
      .from(schema.patients)
      .where(eq(schema.patients.pid, cleanupPid))
      .limit(1)
    const [visit] = await db
      .select({ id: schema.patientVisits.id })
      .from(schema.patientVisits)
      .where(eq(schema.patientVisits.patientPid, cleanupPid))
      .limit(1)
    const [otherAppointment] = await db
      .select({ id: schema.appointments.id })
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.patientPid, cleanupPid),
          ne(schema.appointments.id, id),
        )
      )
      .limit(1)
    deletedPatient = !!patient && !patient.userId && !visit && !otherAppointment
  }

  const dayStart = startOfDayIST(appt.scheduledAt)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const deleteAppointment = db
    .delete(schema.appointments)
    .where(eq(schema.appointments.id, id))
  const closeQueueGap = db
    .update(schema.appointments)
    .set({ queueNumber: sql`${schema.appointments.queueNumber} - 1` })
    .where(
      and(
        eq(schema.appointments.clinic, appt.clinic),
        gte(schema.appointments.scheduledAt, dayStart),
        lt(schema.appointments.scheduledAt, dayEnd),
        gt(schema.appointments.queueNumber, appt.queueNumber),
      )
    )
  if (deletedPatient && cleanupPid) {
    await db.batch([
      deleteAppointment,
      closeQueueGap,
      db.delete(schema.patients).where(eq(schema.patients.pid, cleanupPid)),
    ])
  } else {
    await db.batch([deleteAppointment, closeQueueGap])
  }

  return c.json({ ok: true, deletedPatient })
})

// POST /api/booking/appointments/:id/mark-paid (staff-only — TODO: require staff session)
// Body: { pid?: string, paymentStatus?: "paid" | "foc",
//         paymentMode?: "cash" | "upi" } — if an existing
// PID is given, link to it (old patient). Otherwise generate a new PID +
// patients row (new patient).
booking.post("/appointments/:id/mark-paid", async (c) => {
  const id = c.req.param("id")
  const body = await c.req
    .json<{
      pid?: string
      paymentStatus?: "paid" | "foc"
      paymentMode?: "cash" | "upi"
    }>()
    .catch(() => null)
  const paymentStatus = body?.paymentStatus ?? "paid"
  if (paymentStatus !== "paid" && paymentStatus !== "foc") {
    return bad(c, "Invalid payment status")
  }
  const appointmentStatus = paymentStatus === "foc" ? "foc" : "paid"
  const requestedPaymentMode = body?.paymentMode ?? "cash"
  if (
    paymentStatus === "paid" &&
    requestedPaymentMode !== "cash" &&
    requestedPaymentMode !== "upi"
  ) {
    return bad(c, "Invalid payment mode")
  }
  const paymentMode = paymentStatus === "paid" ? requestedPaymentMode : null
  const db = createDb(c.env.DB)

  const rows = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, id))
    .limit(1)
  const appt = rows[0]
  if (!appt) return bad(c, "Appointment not found", 404)
  if (appt.status !== "not_paid") {
    return bad(c, "Only not-paid appointments can be marked paid", 409)
  }
  if (appt.patientPid) {
    return c.json({ ok: true, pid: appt.patientPid, already: true })
  }

  // Old patient: link the existing PID, no new row, no counter bump.
  const linkPid = body?.pid?.trim().toUpperCase()
  if (linkPid) {
    const existing = await db
      .select({ pid: schema.patients.pid })
      .from(schema.patients)
      .where(eq(schema.patients.pid, linkPid))
      .limit(1)
    if (!existing[0]) return bad(c, `Patient ${linkPid} not found`, 404)
    await db
      .update(schema.appointments)
      .set({
        patientPid: linkPid,
        patientPidOrigin: "linked",
        paymentPatientPid: linkPid,
        status: appointmentStatus,
        paymentStatus,
        paymentMode,
        checkedInAt: new Date(),
      })
      .where(eq(schema.appointments.id, id))
    return c.json({ ok: true, pid: linkPid, linked: true })
  }

  // New patient: PID generation via the counter row.
  // NOTE: D1 has no SQL transactions (no BEGIN), so we use db.batch() which
  // D1 executes atomically.
  const counter = await db
    .select()
    .from(schema.pidCounter)
    .where(eq(schema.pidCounter.id, 1))
    .limit(1)
  const next = (counter[0]?.value ?? 0) + 1
  const pid = `PID${String(next).padStart(6, "0")}`

  const counterWrite = counter[0]
    ? db
        .update(schema.pidCounter)
        .set({ value: next })
        .where(eq(schema.pidCounter.id, 1))
    : db.insert(schema.pidCounter).values({ id: 1, value: next })

  await db.batch([
    counterWrite,
    db.insert(schema.patients).values({
      pid,
      userId: null, // linked when the patient first logs in with PID+OTP
      fullName: appt.patientName,
      mobile: appt.patientMobile,
      ageYears: appt.patientAgeYears,
      gender: appt.patientGender,
      isFirstLogin: true,
    }),
    db
      .update(schema.appointments)
      .set({
        patientPid: pid,
        patientPidOrigin: "created",
        paymentPatientPid: pid,
        status: appointmentStatus,
        paymentStatus,
        paymentMode,
        checkedInAt: new Date(),
      })
      .where(eq(schema.appointments.id, id)),
  ])

  return c.json({ ok: true, pid }, 201)
})

export default booking
