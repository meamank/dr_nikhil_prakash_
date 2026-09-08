import { Hono } from "hono"
import { and, desc, eq, gte, like, lt, or, sql } from "drizzle-orm"
import { normalizePhone } from "@repo/shared"
import { createDb } from "../db"
import * as schema from "../db/schema"
import type { Env } from "../auth"

// Booking flow (OTP STUBBED):
//   POST /api/booking/appointments — anyone books with mobile, no OTP check.
//   Queue number is per clinic per day (resets daily).
//   PID is issued only when staff marks Paid (mark-paid endpoint below).
//
// When WhatsApp OTP is wired up: re-enable bookingToken verification
// (see git history for the OTP implementation).

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

// POST /api/booking/otp/request — STUB: always succeeds, no SMS sent.
booking.post("/otp/request", async (c) => {
  const body = await c.req.json<{ mobile?: string }>().catch(() => null)
  const mobile = body?.mobile ? normalizePhone(body.mobile) : null
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return bad(c, "Enter a valid 10-digit mobile number")
  }
  console.log(`[booking:stub] OTP request for ${mobile} — skipped (stubbed)`)
  return c.json({ ok: true, stubbed: true, expiresInSec: 300 })
})

// POST /api/booking/otp/verify — STUB: accepts any 6-digit code.
booking.post("/otp/verify", async (c) => {
  const body = await c.req
    .json<{ mobile?: string; code?: string }>()
    .catch(() => null)
  const mobile = body?.mobile ? normalizePhone(body.mobile) : null
  const code = body?.code?.replace(/\D/g, "") ?? ""
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile) || code.length !== 6) {
    return bad(c, "Enter the 6-digit OTP")
  }
  console.log(`[booking:stub] OTP verify for ${mobile} — accepted (stubbed)`)
  // Stub token: caller must still pass it, but it carries no proof.
  // The create endpoint below does NOT check it while stubbed.
  return c.json({ ok: true, bookingToken: `stub-${mobile}`, mobile, stubbed: true })
})

// POST /api/booking/appointments
// { patientName, address?, mobile, age?, gender?,
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
  if (pickedDay < todayIST) {
    return bad(c, "Date cannot be in the past")
  }
  if (pickedDay > maxIST) {
    return bad(c, "Booking is open only for today and the next 2 days")
  }

  const db = createDb(c.env.DB)

  // Queue number: max existing for this clinic + day, +1.
  // Uses max (not count) so deleted/cancelled slots never cause duplicates.
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
    bookedBy: null,
    scheduledAt,
    status: "not_paid",
    paymentStatus: "unpaid",
  })

  return c.json(
    { ok: true, appointmentId: id, queueNumber, status: "not_paid" },
    201,
  )
})

// GET /api/booking/appointments?clinic=&date=YYYY-MM-DD — staff day view
booking.get("/appointments", async (c) => {
  const clinic = c.req.query("clinic")
  const dateStr = c.req.query("date")
  const searchQ = c.req.query("q")?.trim()

  const db = createDb(c.env.DB)

  // Reception search: name, mobile, or address across recent appointments.
  if (searchQ) {
    const pattern = `%${searchQ}%`
    const rows = await db
      .select()
      .from(schema.appointments)
      .where(
        or(
          like(schema.appointments.patientName, pattern),
          like(schema.appointments.patientMobile, pattern),
          like(schema.appointments.patientAddress, pattern),
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
      status?: "not_paid" | "paid" | "in_progress" | "done" | "cancelled" | "no_show"
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
    const todayIST = startOfDayIST(new Date())
    const maxIST = new Date(todayIST.getTime() + 2 * 24 * 60 * 60 * 1000)
    const picked = new Date(`${body.date}T00:00:00+05:30`)
    if (Number.isNaN(picked.getTime())) return bad(c, "Pick a valid date")
    const pickedDay = startOfDayIST(picked)
    if (pickedDay < todayIST) return bad(c, "Date cannot be in the past")
    if (pickedDay > maxIST) return bad(c, "Booking is open only for today and the next 2 days")
    patch.scheduledAt = new Date(pickedDay.getTime() + 12 * 60 * 60 * 1000)
  }
  if (body.status !== undefined) {
    if (!["not_paid", "paid", "in_progress", "done", "cancelled", "no_show"].includes(body.status)) {
      return bad(c, "Invalid status")
    }
    patch.status = body.status
  }
  if (Object.keys(patch).length === 0) return bad(c, "Nothing to update")

  await db.update(schema.appointments).set(patch).where(eq(schema.appointments.id, id))
  const updated = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, id))
    .limit(1)
  return c.json({ appointment: updated[0] })
})

// POST /api/booking/appointments/:id/mark-paid (staff-only — TODO: require staff session)
// Body: { pid?: string } — if an existing PID is given, link to it (old
// patient). Otherwise generate a new PID + patients row (new patient).
booking.post("/appointments/:id/mark-paid", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json<{ pid?: string }>().catch(() => null)
  const db = createDb(c.env.DB)

  const rows = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, id))
    .limit(1)
  const appt = rows[0]
  if (!appt) return bad(c, "Appointment not found", 404)
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
        status: "paid",
        paymentStatus: "paid",
        paymentMode: "cash",
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
        status: "paid",
        paymentStatus: "paid",
        paymentMode: "cash",
        checkedInAt: new Date(),
      })
      .where(eq(schema.appointments.id, id)),
  ])

  return c.json({ ok: true, pid }, 201)
})

export default booking
