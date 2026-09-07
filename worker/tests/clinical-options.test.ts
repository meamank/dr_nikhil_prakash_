import { beforeEach, expect, mock, test } from "bun:test"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

const client = createClient({ url: ":memory:" })
const db = drizzle(client)
let role: string | null = "staff"

mock.module("../src/db", () => ({ createDb: () => db }))
mock.module("../src/auth", () => ({
  createAuth: () => ({
    api: { getSession: async () => (role ? { user: { role } } : null) },
  }),
}))

const { default: options } = await import("../src/routes/clinical-options")
await client.execute(`
  CREATE TABLE clinical_options (
    category text NOT NULL,
    normalized_label text NOT NULL,
    label text NOT NULL,
    PRIMARY KEY (category, normalized_label)
  )
`)

beforeEach(async () => {
  role = "staff"
  await client.execute("DELETE FROM clinical_options")
})

const request = (category: string, label?: unknown) =>
  options.request(
    `/${category}`,
    label === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        },
    { DB: {} } as never,
  )

test("stores and retrieves options independently for each category", async () => {
  expect(
    await (await request("lab-reports", "Complete blood count")).json(),
  ).toEqual<unknown>({ option: "COMPLETE BLOOD COUNT" })
  expect(await (await request("lab-reports")).json()).toEqual<unknown>({
    options: ["COMPLETE BLOOD COUNT"],
  })
  expect(await (await request("medicines-prescribed")).json()).toEqual<unknown>({
    options: [],
  })
})

test("stores general diagnoses", async () => {
  expect(await (await request("diagnosis", "Typhoid")).json()).toEqual<unknown>({
    option: "TYPHOID",
  })
  expect(await (await request("diagnosis")).json()).toEqual<unknown>({
    options: ["TYPHOID"],
  })
})

test("normalizes duplicates within a category", async () => {
  await request("previous-medical-history", "  Type 2   diabetes ")
  expect(
    await (await request("previous-medical-history", "type 2 diabetes")).json(),
  ).toEqual<unknown>({ option: "TYPE 2 DIABETES" })
})

test("rejects invalid categories and labels", async () => {
  expect((await request("unknown")).status).toBe(404)
  for (const label of ["  ", "x".repeat(201), 123, null]) {
    expect((await request("lab-reports", label)).status).toBe(400)
  }
})

test("requires staff or admin access", async () => {
  for (const [sessionRole, status] of [[null, 401], ["user", 403]] as const) {
    role = sessionRole
    expect((await request("lab-reports")).status).toBe(status)
    expect((await request("lab-reports", "CBC")).status).toBe(status)
  }
})
