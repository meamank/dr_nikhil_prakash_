import "fake-indexeddb/auto"
import { beforeEach, expect, test } from "bun:test"
import {
  finishCatalogue,
  getProgress,
  isCatalogueReady,
  searchCatalogue,
  writeChunk,
} from "../src/features/patients/lib/medicine-local-db"
import type {
  CatalogueManifest,
  CatalogueMedicine,
} from "../src/features/patients/lib/medicine-local-db"
const rows: CatalogueMedicine[] = [
  {
    id: "1",
    name: "Augmentin 625",
    manufacturer: "A",
    composition1: "Amoxycillin (500mg)",
    composition2: "Clavulanic Acid (125mg)",
  },
  {
    id: "2",
    name: "Zerodol",
    manufacturer: "B",
    composition1: "Aceclofenac (100mg)",
    composition2: "",
  },
  {
    id: "3",
    name: "Zerodol",
    manufacturer: "C",
    composition1: "Paracetamol (500mg)",
    composition2: "",
  },
]
const manifest: CatalogueManifest = {
  version: "test-v1",
  recordCount: 3,
  prefixes: [],
  chunks: [
    { file: "0.json", count: 2, sha256: "" },
    { file: "1.json", count: 1, sha256: "" },
  ],
}
const deleteDatabase = () =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("clinic-medicine-catalogue")
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error("Database connection left open"))
  })
beforeEach(deleteDatabase)
test("interrupted downloads resume and partial catalogues are never searchable", async () => {
  await writeChunk(manifest, 0, rows.slice(0, 2))
  expect(await getProgress(manifest)).toMatchObject({
    nextChunk: 1,
    count: 2,
    ready: false,
  })
  expect(await isCatalogueReady(manifest.version)).toBe(false)
  await expect(searchCatalogue(manifest.version, "zer")).rejects.toThrow(
    "cleared"
  )
  await writeChunk(manifest, 1, rows.slice(2))
  await finishCatalogue(manifest)
  expect(await isCatalogueReady(manifest.version)).toBe(true)
  expect(
    (await searchCatalogue(manifest.version, "ＺＥＲ")).suggestions.map(
      (row) => row.id
    )
  ).toEqual(["2", "3"])
  expect(
    (await searchCatalogue(manifest.version, "zerodol")).exactMatch?.id
  ).toBe("2")
  expect(
    (await searchCatalogue(manifest.version, "amox clav")).suggestions[0]?.name
  ).toBe("Augmentin 625")
})
test("browser clearing is detected and redownload restores local search", async () => {
  await writeChunk(manifest, 0, rows.slice(0, 2))
  await writeChunk(manifest, 1, rows.slice(2))
  await finishCatalogue(manifest)
  await deleteDatabase()
  expect(await isCatalogueReady(manifest.version)).toBe(false)
  expect((await getProgress(manifest)).nextChunk).toBe(0)
  await expect(searchCatalogue(manifest.version, "zer")).rejects.toThrow()
  await writeChunk(manifest, 0, rows.slice(0, 2))
  await writeChunk(manifest, 1, rows.slice(2))
  await finishCatalogue(manifest)
  expect(
    (await searchCatalogue(manifest.version, "amox")).suggestions
  ).toHaveLength(1)
})
test("new versions replace the old catalogue only after they are complete", async () => {
  await writeChunk(manifest, 0, rows.slice(0, 2))
  await writeChunk(manifest, 1, rows.slice(2))
  await finishCatalogue(manifest)
  const next = { ...manifest, version: "test-v2" }
  await writeChunk(next, 0, rows.slice(0, 2))
  expect(await isCatalogueReady(manifest.version)).toBe(true)
  expect(await isCatalogueReady(next.version)).toBe(false)
  await writeChunk(next, 1, rows.slice(2))
  await finishCatalogue(next)
  expect(await isCatalogueReady(next.version)).toBe(true)
  expect(await isCatalogueReady(manifest.version)).toBe(false)
})
