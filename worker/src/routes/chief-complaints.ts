import { formatClinicalText } from "@repo/shared"
import { Hono } from "hono"
import { asc, eq } from "drizzle-orm"
import { createAuth, type Env } from "../auth"
import { createDb } from "../db"
import { chiefComplaints } from "../db/schema"

const complaints = new Hono<{ Bindings: Env }>()

complaints.use("*", async (c, next) => {
  const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: "Sign in to access chief complaints" }, 401)
  if (session.user.role !== "admin" && session.user.role !== "staff") {
    return c.json({ error: "Staff access required" }, 403)
  }
  await next()
})

complaints.get("/", async (c) => {
  const rows = await createDb(c.env.DB)
    .select({ label: chiefComplaints.label })
    .from(chiefComplaints)
    .orderBy(asc(chiefComplaints.normalizedLabel))
  return c.json({ complaints: rows.map((row) => formatClinicalText(row.label)) })
})

complaints.post("/", async (c) => {
  const body = await c.req.json<unknown>().catch(() => null)
  if (!body || typeof body !== "object" || !("label" in body) || typeof body.label !== "string") {
    return c.json({ error: "Enter a chief complaint" }, 400)
  }
  const label = formatClinicalText(body.label.trim().replace(/\s+/g, " "))
  if (!label || label.length > 200) {
    return c.json({ error: "Chief complaint must be between 1 and 200 characters" }, 400)
  }
  const normalizedLabel = label.toLowerCase()
  const db = createDb(c.env.DB)
  // The unique key also handles simultaneous creation by different staff members.
  await db.insert(chiefComplaints).values({ label, normalizedLabel }).onConflictDoNothing()
  const [complaint] = await db.select({ label: chiefComplaints.label })
    .from(chiefComplaints).where(eq(chiefComplaints.normalizedLabel, normalizedLabel))
  return c.json({ complaint: formatClinicalText(complaint!.label) })
})

export default complaints
