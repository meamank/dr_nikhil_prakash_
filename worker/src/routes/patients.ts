import { Hono } from "hono"
import { and, desc, eq, like, or, sql } from "drizzle-orm"
import { createDb } from "../db"
import * as schema from "../db/schema"
import type { Env } from "../auth"

// Staff patient directory. Every row here has a PID. Auth: TODO staff session
// — open for now like booking.

const patients = new Hono<{ Bindings: Env }>()

function bad(
  c: { json: (b: unknown, s?: number) => Response },
  msg: string,
  status = 400,
) {
  return c.json({ error: msg }, status)
}

// GET /api/patients?q=&limit=&offset= — list all PID holders, newest first.
// q matches pid, name, or mobile (partial).
patients.get("/", async (c) => {
  const q = c.req.query("q")?.trim() ?? ""
  const limit = Math.min(
    Math.max(Number(c.req.query("limit") ?? 50) || 50, 1),
    200,
  )
  const offset = Math.max(Number(c.req.query("offset") ?? 0) || 0, 0)

  const db = createDb(c.env.DB)
  const where = q
    ? or(
        like(schema.patients.pid, `%${q}%`),
        like(schema.patients.fullName, `%${q}%`),
        like(schema.patients.mobile, `%${q}%`),
      )
    : undefined

  const rows = await db
    .select()
    .from(schema.patients)
    .where(where)
    .orderBy(desc(schema.patients.createdAt))
    .limit(limit)
    .offset(offset)

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.patients)
    .where(where)

  return c.json({ patients: rows, total: total[0]?.count ?? rows.length })
})

// POST /api/patients — manually register a legacy patient and issue a PID.
patients.post("/", async (c) => {
  const body = await c.req
    .json<{
      fullName?: string
      mobile?: string
      address?: string
      ageYears?: number
      gender?: "male" | "female" | "other"
    }>()
    .catch(() => null)
  if (!body) return bad(c, "Invalid body")

  const fullName = body.fullName?.trim() ?? ""
  if (fullName.length < 2) return bad(c, "Enter the patient's full name")

  const digits = (body.mobile ?? "").replace(/\D/g, "")
  const mobile =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return bad(c, "Enter a valid 10-digit mobile number")
  }

  const ageYears = Math.trunc(body.ageYears ?? NaN)
  if (!Number.isFinite(ageYears) || ageYears < 0 || ageYears > 130) {
    return bad(c, "Enter a valid age")
  }
  if (!body.gender || !["male", "female", "other"].includes(body.gender)) {
    return bad(c, "Select a gender")
  }

  const db = createDb(c.env.DB)
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
      userId: null,
      fullName,
      mobile,
      address: body.address?.trim() || null,
      ageYears,
      gender: body.gender,
      isFirstLogin: true,
    }),
  ])

  const [patient] = await db
    .select()
    .from(schema.patients)
    .where(eq(schema.patients.pid, pid))
    .limit(1)
  return c.json({ patient }, 201)
})

// GET /api/patients/:pid — single patient + their appointments (newest first).
patients.get("/:pid", async (c) => {
  const pid = c.req.param("pid").trim().toUpperCase()
  if (!pid) return bad(c, "Missing PID")

  const db = createDb(c.env.DB)
  const rows = await db
    .select()
    .from(schema.patients)
    .where(eq(schema.patients.pid, pid))
    .limit(1)
  const patient = rows[0]
  if (!patient) return bad(c, "Patient not found", 404)

  const visits = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.patientPid, pid))
    .orderBy(desc(schema.appointments.scheduledAt))

  return c.json({ patient, appointments: visits })
})

// PATCH /api/patients/:pid — update demographics (name, mobile, age, gender).
patients.patch("/:pid", async (c) => {
  const pid = c.req.param("pid").trim().toUpperCase()
  const body = await c.req
    .json<{
      fullName?: string
      mobile?: string
      address?: string | null
      ageYears?: number | null
      gender?: "male" | "female" | "other" | null
    }>()
    .catch(() => null)
  if (!body) return bad(c, "Invalid body")

  const patch: Partial<typeof schema.patients.$inferInsert> = {}
  if (body.fullName !== undefined) {
    const name = body.fullName.trim()
    if (name.length < 2) return bad(c, "Enter the patient's full name")
    patch.fullName = name
  }
  if (body.mobile !== undefined) {
    const digits = body.mobile.replace(/\D/g, "")
    const mobile =
      digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits.length === 11 && digits.startsWith("0")
          ? digits.slice(1)
          : digits
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return bad(c, "Enter a valid 10-digit mobile number")
    }
    patch.mobile = mobile
  }
  if (body.address !== undefined) {
    patch.address = body.address?.trim() || null
  }
  if (body.ageYears !== undefined) {
    if (body.ageYears === null) {
      patch.ageYears = null
    } else {
      const age = Math.trunc(body.ageYears)
      if (!Number.isFinite(age) || age < 0 || age > 130) {
        return bad(c, "Enter a valid age")
      }
      patch.ageYears = age
    }
  }
  if (body.gender !== undefined) {
    if (body.gender !== null && !["male", "female", "other"].includes(body.gender)) {
      return bad(c, "Invalid gender")
    }
    patch.gender = body.gender
  }
  if (Object.keys(patch).length === 0) return bad(c, "Nothing to update")

  const db = createDb(c.env.DB)
  const existing = await db
    .select({ pid: schema.patients.pid })
    .from(schema.patients)
    .where(eq(schema.patients.pid, pid))
    .limit(1)
  if (!existing[0]) return bad(c, "Patient not found", 404)

  await db
    .update(schema.patients)
    .set(patch)
    .where(eq(schema.patients.pid, pid))

  const updated = await db
    .select()
    .from(schema.patients)
    .where(eq(schema.patients.pid, pid))
    .limit(1)
  return c.json({ patient: updated[0] })
})

// DELETE /api/patients/:pid — removes the patient and their appointments
// (appointments cascade via FK). Unlinks the portal user if one claimed it.
patients.delete("/:pid", async (c) => {
  const pid = c.req.param("pid").trim().toUpperCase()
  if (!pid) return bad(c, "Missing PID")

  const db = createDb(c.env.DB)
  const existing = await db
    .select()
    .from(schema.patients)
    .where(eq(schema.patients.pid, pid))
    .limit(1)
  if (!existing[0]) return bad(c, "Patient not found", 404)

  await db.delete(schema.patients).where(eq(schema.patients.pid, pid))
  return c.json({ ok: true, pid })
})

export default patients
