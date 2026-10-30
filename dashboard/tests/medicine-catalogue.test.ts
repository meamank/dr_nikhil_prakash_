import { test, expect } from "bun:test"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { gunzipSync } from "node:zlib"
import {
  medicinePrefix,
  medicinePrefixFilename,
  medicineSearchKey,
} from "../src/features/patients/lib/medicine-catalogue.mjs"
import { medicineCatalogueVersion } from "../src/features/patients/lib/medicine-catalogue-version"

const assetRoot = new URL(
  `../public/medicine-catalogue/${medicineCatalogueVersion}/`,
  import.meta.url
)
const manifest = JSON.parse(
  readFileSync(new URL("manifest.json", assetRoot), "utf8")
) as { prefixes: string[]; recordCount: number }

test("lookup normalization is case-insensitive and filenames cannot escape the asset directory", () => {
  expect(medicineSearchKey("  ＺＥＲ  500mg ")).toBe("zer 500mg")
  expect(medicinePrefix("ＺＥＲodOL")).toBe("zer")
  expect(medicinePrefixFilename("zer")).toBe("7a6572.json")
  for (const prefix of ["../", "a/b", "a?b", "a#b", "💊ab"]) {
    expect(medicinePrefixFilename(prefix)).toMatch(/^[0-9a-f]+\.json$/)
  }
})

test("all active seed records are included exactly once in their correct prefix file", () => {
  const seed = JSON.parse(
    gunzipSync(
      readFileSync(
        new URL("../data/medicine-catalogue.json.gz", import.meta.url)
      )
    ).toString("utf8")
  ) as { id: string; name: string }[]
  const seedIds = new Set(seed.map((row) => row.id))
  const foundIds = new Set<string>()
  for (const prefix of manifest.prefixes) {
    const rows = JSON.parse(
      readFileSync(new URL(medicinePrefixFilename(prefix), assetRoot), "utf8")
    ) as { id: string; name: string }[]
    for (const row of rows) {
      if (
        medicinePrefix(row.name) !== prefix ||
        !seedIds.has(row.id) ||
        foundIds.has(row.id)
      )
        throw new Error(`Incorrect or duplicate record ${row.id}`)
      foundIds.add(row.id)
    }
  }
  expect(manifest.recordCount).toBe(246068)
  expect(foundIds.size).toBe(seed.length)
})

test("a complete prefix permits longer searches and retains distinct records with duplicate names", () => {
  const rows = JSON.parse(
    readFileSync(new URL(medicinePrefixFilename("zer"), assetRoot), "utf8")
  ) as { id: string; name: string }[]
  expect(rows.length).toBe(206)
  expect(
    rows.filter((row) => medicineSearchKey(row.name).startsWith("zerod")).length
  ).toBe(18)
  expect(
    rows
      .filter((row) => medicineSearchKey(row.name).startsWith("zerod"))
      .slice(0, 10).length
  ).toBe(10)
  expect(
    rows.some((row, index) =>
      rows.some(
        (other, otherIndex) =>
          index !== otherIndex && row.name === other.name && row.id !== other.id
      )
    )
  ).toBe(true)
  expect(manifest.prefixes.includes("zzz")).toBe(false)
})

test("bulk chunks are complete, verifiable, and under the static asset size limit", () => {
  const bulk = JSON.parse(
    readFileSync(new URL("manifest.json", assetRoot), "utf8")
  ) as { chunks: { file: string; count: number; sha256: string }[] }
  const ids = new Set<string>()
  for (const chunk of bulk.chunks) {
    const bytes = readFileSync(new URL(chunk.file, assetRoot))
    expect(bytes.length).toBeLessThan(25 * 1024 * 1024)
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(chunk.sha256)
    const records = JSON.parse(bytes.toString("utf8")) as { id: string }[]
    expect(records.length).toBe(chunk.count)
    for (const row of records) {
      if (ids.has(row.id)) throw new Error("Duplicate bulk record")
      ids.add(row.id)
    }
  }
  expect(ids.size).toBe(manifest.recordCount)
})
