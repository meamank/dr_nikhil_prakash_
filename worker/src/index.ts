import { Hono } from "hono"
import { cors } from "hono/cors"
import { eq } from "drizzle-orm"
import { normalizePhone } from "@repo/shared"
import { createDb } from "./db"
import * as schema from "./db/schema"
import { createAuth, getAllowedOrigins, type Env } from "./auth"
import booking from "./routes/booking"
import patients from "./routes/patients"
import chiefComplaints from "./routes/chief-complaints"
import clinicalOptions from "./routes/clinical-options"

type Variables = {
  patchedRequest: Request
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()


app.use(
  "*",
  cors({
    // Reflect the request Origin only when it's in the allowlist
    // (localhost + any origins from DEV_ORIGINS, e.g. the LAN IP).
    origin: (origin, c) =>
      getAllowedOrigins(c.env).includes(origin) ? origin : undefined,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
)


const PUBLIC_SIGNUP_PATHS = new Set([
  "/api/auth/sign-up/email",
  "/api/auth/sign-up/phone-number",
])

app.use("/api/auth/sign-up/*", async (c, next) => {
  if (c.req.method === "POST" && PUBLIC_SIGNUP_PATHS.has(c.req.path)) {
    const body = await c.req.json<Record<string, unknown>>().catch(() => null)
    if (body) {

      if (typeof body.phoneNumber === "string" && body.phoneNumber.trim() !== "") {
        const normalized = normalizePhone(body.phoneNumber as string)
        if (normalized && /^\d{10}$/.test(normalized)) {

          try {
            const db = createDb(c.env.DB)
            const existing = await db
              .select({ id: schema.user.id })
              .from(schema.user)
              .where(eq(schema.user.phoneNumber, normalized))
              .limit(1)
            if (existing.length > 0) {
              return c.json({ error: "Mobile number already registered" }, 409)
            }
          } catch (e) {
            console.error("phone check failed", e)
          }
          body.phoneNumber = normalized 
        }
      }

      body.role = "user" // always override — never trust the client
      c.set(
        "patchedRequest",
        new Request(c.req.url, {
          method: c.req.method,
          body: JSON.stringify(body),
          headers: c.req.raw.headers,
        }),
      )
    }
  }
  await next()
})


app.all("/api/auth/*", (c) => {
  const auth = createAuth(c.env)
  const req = c.get("patchedRequest") ?? c.req.raw
  return auth.handler(req)
})


// Health check

app.get("/api/health", (c) => c.json({ ok: true }))


// Domain routes

app.route("/api/booking", booking)
app.route("/api/patients", patients)
app.route("/api/chief-complaints", chiefComplaints)
app.route("/api/clinical-options", clinicalOptions)

export default app
