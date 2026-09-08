import { eq, or } from "drizzle-orm"
import { Hono } from "hono"
import { normalizePhone } from "@repo/shared"
import { createAuth, type Env } from "../auth"
import { createDb } from "../db"
import * as schema from "../db/schema"

const staff = new Hono<{ Bindings: Env }>()

staff.use("*", async (c, next) => {
  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })
  if (!session) return c.json({ error: "Sign in required" }, 401)
  if (session.user.role !== "admin") {
    return c.json({ error: "Administrator access required" }, 403)
  }
  await next()
})

staff.post("/", async (c) => {
  const body = await c.req
    .json<{
      username?: string
      mobile?: string
      role?: "staff" | "admin"
      password?: string
    }>()
    .catch(() => null)
  if (!body) return c.json({ error: "Invalid body" }, 400)

  const username = body.username?.trim().toLowerCase() ?? ""
  const mobile = normalizePhone(body.mobile ?? "")
  const role = body.role
  const password = body.password ?? ""
  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    return c.json({ error: "Username must be 3–32 letters, numbers, or underscores" }, 400)
  }
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return c.json({ error: "Enter a valid 10-digit mobile number" }, 400)
  }
  if (role !== "staff" && role !== "admin") {
    return c.json({ error: "Select Staff or Admin" }, 400)
  }
  if (password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400)
  }

  const db = createDb(c.env.DB)
  const [existing] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(or(eq(schema.user.username, username), eq(schema.user.phoneNumber, mobile)))
    .limit(1)
  if (existing) return c.json({ error: "Username or mobile is already in use" }, 409)

  try {
    const auth = createAuth(c.env)
    const result = await auth.api.signUpEmail({
      body: {
        name: username,
        email: username + "@staff.local",
        password,
        username,
        phoneNumber: mobile,
      },
    })
    await db
      .update(schema.user)
      .set({ role, phoneNumber: mobile })
      .where(eq(schema.user.id, result.user.id))
    return c.json({
      staff: {
        id: result.user.id,
        username,
        mobile,
        role,
      },
    }, 201)
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Could not create staff account" },
      400,
    )
  }
})

export default staff
