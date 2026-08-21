import { Hono } from "hono"
import { cors } from "hono/cors"
import { createAuth, type Env } from "./auth"

type Variables = {
  patchedRequest: Request
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ---------------------------------------------------------------------------
// CORS — credentials:true is required for better-auth session cookies
// ---------------------------------------------------------------------------
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
)

// ---------------------------------------------------------------------------
// Role guard — strip any client-supplied `role` on public sign-up paths and
// hard-code it to "user". Admin and staff accounts are created server-side only.
// ---------------------------------------------------------------------------
const PUBLIC_SIGNUP_PATHS = new Set([
  "/api/auth/sign-up/email",
  "/api/auth/sign-up/phone-number",
])

app.use("/api/auth/sign-up/*", async (c, next) => {
  if (c.req.method === "POST" && PUBLIC_SIGNUP_PATHS.has(c.req.path)) {
    const body = await c.req.json<Record<string, unknown>>().catch(() => null)
    if (body) {
      body.role = "user" // always override — never trust the client
      // c.req is read-only, so store the patched request in context instead
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

// ---------------------------------------------------------------------------
// better-auth — handles all /api/auth/* routes
//
// Three sign-in flows:
//   POST /api/auth/sign-in/email           → email + password
//   POST /api/auth/sign-in/phone-number    → phone + password (providerId="credential")
//   POST /api/auth/sign-in/username        → PID/username + password
// ---------------------------------------------------------------------------
app.all("/api/auth/*", (c) => {
  const auth = createAuth(c.env)
  // Use the role-patched request if the sign-up middleware produced one
  const req = c.get("patchedRequest") ?? c.req.raw
  return auth.handler(req)
})

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/api/health", (c) => c.json({ ok: true }))

// ---------------------------------------------------------------------------
// Domain routes (to be filled in)
// ---------------------------------------------------------------------------
// app.route("/api/patients", patients)
// app.route("/api/appointments", appointments)

export default app
