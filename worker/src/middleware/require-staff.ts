import { createMiddleware } from "hono/factory";
import { createAuth, type Auth, type Env } from "../auth";

type StaffSession = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;

export type StaffVariables = { staffSession: StaffSession };
export type StaffEnv = { Bindings: Env; Variables: StaffVariables };

export const requireStaff = createMiddleware<StaffEnv>(async (c, next) => {
  c.header("Cache-Control", "no-store");
  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) return c.json({ error: "Sign in required" }, 401);
  if (session.user.role !== "admin" && session.user.role !== "staff") {
    return c.json({ error: "Staff access required" }, 403);
  }
  c.set("staffSession", session);
  await next();
});
