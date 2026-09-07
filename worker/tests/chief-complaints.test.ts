import { beforeEach, expect, mock, test } from "bun:test"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

const client = createClient({ url: ":memory:" })
const db = drizzle(client)
let role: string | null = "staff"
mock.module("../src/db", () => ({ createDb: () => db }))
mock.module("../src/auth", () => ({
  createAuth: () => ({ api: { getSession: async () => role ? { user: { role } } : null } }),
}))
const { default: complaints } = await import("../src/routes/chief-complaints")
await client.execute(await Bun.file(new URL("../drizzle/0007_serious_dorian_gray.sql", import.meta.url)).text())

beforeEach(async () => {
  role = "staff"
  await client.execute("DELETE FROM chief_complaints")
})
const post = (label: unknown) => complaints.request("/", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }),
}, { DB: {} } as never)
const get = () => complaints.request("/", {}, { DB: {} } as never)

test("starts empty and retrieves a created complaint in a subsequent request", async () => {
  expect(await (await get()).json()).toEqual<unknown>({ complaints: [] })
  expect(await (await post("Excessive fatigue")).json()).toEqual<unknown>({ complaint: "EXCESSIVE FATIGUE" })
  expect(await (await get()).json()).toEqual<unknown>({ complaints: ["EXCESSIVE FATIGUE"] })
})
test("normalizes whitespace and reuses case-insensitive duplicates", async () => {
  await post("  Excessive   fatigue  ")
  expect(await (await post("excessive FATIGUE")).json()).toEqual<unknown>({ complaint: "EXCESSIVE FATIGUE" })
  expect(await (await get()).json()).toEqual<unknown>({ complaints: ["EXCESSIVE FATIGUE"] })
})
test("rejects blank, oversized and non-string values", async () => {
  for (const label of ["  ", "x".repeat(201), 123, null]) {
    expect((await post(label)).status).toBe(400)
  }
  expect(await (await get()).json()).toEqual<unknown>({ complaints: [] })
})
test("requires a staff or admin session for reading and writing", async () => {
  for (const [sessionRole, status] of [[null, 401], ["user", 403]] as const) {
    role = sessionRole
    expect((await get()).status).toBe(status)
    expect((await post("Fatigue")).status).toBe(status)
  }
  role = "admin"
  expect((await post("Fatigue")).status).toBe(200)
})
