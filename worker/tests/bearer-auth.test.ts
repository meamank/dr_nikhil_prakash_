// Run independently: the other route suites mock the auth module globally.
import { beforeAll, beforeEach, expect, test } from "bun:test";
import { Database, type SQLQueryBindings } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { URL } from "node:url";
import { createAuth, type Env } from "../src/auth";
import app from "../src/index";

// Exercise the production Drizzle D1 adapter and Better Auth against a disposable
// SQLite database; no remote D1, staff credentials, or patient data are used.
const sqlite = new Database(":memory:");
class Statement {
  constructor(
    private sql: string,
    private values: SQLQueryBindings[] = [],
  ) {}
  bind(...values: SQLQueryBindings[]) {
    return new Statement(this.sql, values);
  }
  async raw() {
    return sqlite.query(this.sql).values(...this.values);
  }
  async all() {
    return {
      success: true,
      results: sqlite.query(this.sql).all(...this.values),
      meta: {},
    };
  }
  async run() {
    const result = sqlite.query(this.sql).run(...this.values);
    return {
      success: true,
      results: [],
      meta: {
        changes: result.changes,
        last_row_id: Number(result.lastInsertRowid),
      },
    };
  }
}
const database = {
  prepare: (sql: string) => new Statement(sql),
  batch: (statements: Statement[]) =>
    sqlite.transaction(() => statements.map((statement) => statement.all()))(),
};
const base = "https://portal.drnikhilprakash.com";
const env: Env = {
  DB: database as unknown as D1Database,
  BETTER_AUTH_URL: base,
  BETTER_AUTH_SECRET: "local-integration-test-secret-0123456789-abcdef",
};
const password = "Local-test-password-8137";
const accounts: Record<string, string> = {};
const request = (path: string, options?: RequestInit) =>
  app.fetch(new Request(base + path, options), env);
const authorization = (token: string) => ({ Authorization: `Bearer ${token}` });
async function signIn(
  username = "native_staff",
  extraHeaders: Record<string, string> = {},
) {
  return request("/api/auth/sign-in/username", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify({ username, password }),
  });
}

beforeAll(async () => {
  const directory = new URL("../drizzle/", import.meta.url);
  for (const file of readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    sqlite.exec(readFileSync(new URL(file, directory), "utf8"));
  }
  const auth = createAuth(env);
  for (const [role, username] of [
    ["staff", "native_staff"],
    ["admin", "native_admin"],
    ["user", "native_patient"],
  ]) {
    const result = await auth.api.signUpEmail({
      body: {
        name: `Test ${role}`,
        email: `${username}@example.test`,
        password,
        username,
      },
    });
    accounts[role!] = result.user.id;
    sqlite
      .query("UPDATE user SET role = ? WHERE id = ?")
      .run(role!, result.user.id);
  }
  sqlite
    .query("UPDATE user SET phone_number = '9000000001' WHERE id = ?")
    .run(accounts.staff!);
});
beforeEach(() => {
  sqlite.exec("DELETE FROM session");
});

test("native username sign-in returns a signed bearer token and a minimal staff session", async () => {
  const response = await signIn();
  expect(response.status).toBe(200);
  const token = response.headers.get("set-auth-token");
  expect(token).toBeTruthy();
  expect(token).toContain(".");
  const session = await request("/api/session", {
    headers: authorization(token!),
  });
  expect(session.status).toBe(200);
  expect(session.headers.get("Cache-Control")).toBe("no-store");
  const body = (await session.json()) as {
    user: { id: string; role: string };
    session: { expiresAt: string };
  };
  expect(body.user.id).toBe(accounts.staff!);
  expect(body.user.role).toBe("staff");
  expect(Number.isFinite(Date.parse(body.session.expiresAt))).toBe(true);
  expect(Object.keys(body.session)).toEqual(["expiresAt"]);
  expect(JSON.stringify(body)).not.toContain(token!);
  expect(
    (
      await request("/api/booking/appointments", {
        headers: authorization(token!),
      })
    ).status,
  ).toBe(200);
  expect(
    (await request("/api/patients", { headers: authorization(token!) })).status,
  ).toBe(200);
});

test("web cookie login and session access continue working", async () => {
  const response = await signIn("native_staff", { Origin: base });
  expect(response.status).toBe(200);
  const sessionCookie = response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("__Secure-better-auth.session_token="))
    ?.split(";")[0];
  expect(sessionCookie).toBeTruthy();
  const session = await request("/api/session", {
    headers: { Cookie: sessionCookie! },
  });
  expect(session.status).toBe(200);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe(base);
  expect(response.headers.get("Access-Control-Expose-Headers")).toContain(
    "set-auth-token",
  );
});

test("email and phone/password sign-in also issue usable bearer sessions", async () => {
  for (const [path, body] of [
    ["email", { email: "native_staff@example.test", password }],
    ["phone-number", { phoneNumber: "9000000001", password }],
  ] as const) {
    const response = await request(`/api/auth/sign-in/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(200);
    const token = response.headers.get("set-auth-token");
    expect(token).toBeTruthy();
    expect(
      (await request("/api/session", { headers: authorization(token!) }))
        .status,
    ).toBe(200);
  }
});

test("untrusted web origins remain rejected for cookie-authenticated requests", async () => {
  const login = await signIn();
  const cookie = login.headers
    .getSetCookie()
    .find((value) => value.startsWith("__Secure-better-auth.session_token="))!
    .split(";")[0]!;
  const response = await signIn("native_staff", {
    Origin: "https://untrusted.example",
    Cookie: cookie,
  });
  expect(response.status).toBe(403);
  expect(response.headers.get("set-auth-token")).toBeNull();
});

test("missing, forged, raw unsigned, expired and revoked bearer sessions are rejected", async () => {
  expect((await request("/api/session")).status).toBe(401);
  expect(
    (
      await request("/api/session", {
        headers: authorization("forged.invalid"),
      })
    ).status,
  ).toBe(401);
  const response = await signIn();
  const token = response.headers.get("set-auth-token")!;
  const rawToken = ((await response.json()) as { token: string }).token;
  expect(
    (await request("/api/session", { headers: authorization(rawToken) }))
      .status,
  ).toBe(401);
  sqlite.query("UPDATE session SET expires_at = 1").run();
  expect(
    (await request("/api/session", { headers: authorization(token) })).status,
  ).toBe(401);
  const active = await signIn();
  const activeToken = active.headers.get("set-auth-token")!;
  const logout = await request("/api/auth/sign-out", {
    method: "POST",
    headers: {
      ...authorization(activeToken),
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  expect(logout.status).toBe(200);
  expect(
    (await request("/api/session", { headers: authorization(activeToken) }))
      .status,
  ).toBe(401);
});

test("patients cannot access staff session, clinical records or appointment mutations", async () => {
  const response = await signIn("native_patient");
  expect(response.status).toBe(200);
  const headers = {
    ...authorization(response.headers.get("set-auth-token")!),
    "Content-Type": "application/json",
  };
  const routes = [
    ["GET", "/api/session"],
    ["GET", "/api/patients"],
    ["POST", "/api/patients"],
    ["GET", "/api/patients/DEMO/visits"],
    ["POST", "/api/patients/DEMO/visits"],
    ["PATCH", "/api/patients/DEMO"],
    ["DELETE", "/api/patients/DEMO"],
    ["GET", "/api/booking/appointments"],
    ["PATCH", "/api/booking/appointments/demo"],
    ["DELETE", "/api/booking/appointments/demo"],
    ["POST", "/api/booking/appointments/demo/mark-paid"],
  ];
  for (const [method, path] of routes) {
    expect((await request(path!, { method: method!, headers })).status).toBe(
      403,
    );
    expect(
      (
        await request(path!, {
          method: method!,
          headers: { "Content-Type": "application/json" },
        })
      ).status,
    ).toBe(401);
  }
});

test("admin access works; failed passwords do not issue a bearer token", async () => {
  const admin = await signIn("native_admin");
  expect(
    (
      await request("/api/session", {
        headers: authorization(admin.headers.get("set-auth-token")!),
      })
    ).status,
  ).toBe(200);
  const failed = await request("/api/auth/sign-in/username", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "native_staff",
      password: "wrong-password",
    }),
  });
  expect(failed.status).toBe(401);
  expect(failed.headers.get("set-auth-token")).toBeNull();
});
