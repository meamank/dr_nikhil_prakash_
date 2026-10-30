import { medicineSearchKey } from "./medicine-catalogue.mjs"

export type CatalogueMedicine = {
  id: string
  name: string
  manufacturer: string
  composition1: string
  composition2: string
}
export type CatalogueManifest = {
  version: string
  recordCount: number
  prefixes: string[]
  chunks: { file: string; count: number; sha256: string }[]
}
type StoredMedicine = CatalogueMedicine & {
  version: string
  searchName: string
  compositionKeys: string[]
}
type Progress = {
  version: string
  nextChunk: number
  count: number
  ready: boolean
}
const databaseName = "clinic-medicine-catalogue"

export function compositionWords(value: string): string[] {
  return medicineSearchKey(value).match(/[\p{L}\p{N}]+/gu) ?? []
}
function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
function complete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onabort = () =>
      reject(tx.error ?? new Error("Storage transaction aborted"))
    tx.onerror = () => {
      /* onabort reports the error */
    }
  })
}
async function open(): Promise<IDBDatabase> {
  const req = indexedDB.open(databaseName, 1)
  req.onupgradeneeded = () => {
    const rows = req.result.createObjectStore("medicines", {
      keyPath: ["version", "id"],
    })
    rows.createIndex("name", ["version", "searchName"])
    rows.createIndex("version", "version")
    rows.createIndex("composition", "compositionKeys", { multiEntry: true })
    req.result.createObjectStore("progress", { keyPath: "version" })
  }
  const db = await request(req)
  db.onversionchange = () => db.close()
  return db
}
export async function isCatalogueReady(version: string): Promise<boolean> {
  const db = await open()
  try {
    const tx = db.transaction(["medicines", "progress"], "readonly")
    const finished = complete(tx)
    const [saved, count] = await Promise.all([
      request(tx.objectStore("progress").get(version)) as Promise<
        Progress | undefined
      >,
      request(tx.objectStore("medicines").index("version").count(version)),
    ])
    await finished
    return Boolean(saved?.ready && saved.count === count && count > 0)
  } finally {
    db.close()
  }
}
export async function getProgress(
  manifest: CatalogueManifest
): Promise<Progress> {
  const db = await open()
  try {
    const tx = db.transaction(["medicines", "progress"], "readonly")
    const finished = complete(tx)
    const [saved, count] = await Promise.all([
      request(tx.objectStore("progress").get(manifest.version)) as Promise<
        Progress | undefined
      >,
      request(
        tx.objectStore("medicines").index("version").count(manifest.version)
      ),
    ])
    await finished
    if (
      saved &&
      saved.count === count &&
      saved.nextChunk <= manifest.chunks.length &&
      (!saved.ready || count === manifest.recordCount)
    )
      return saved
    return { version: manifest.version, nextChunk: 0, count: 0, ready: false }
  } finally {
    db.close()
  }
}
export async function writeChunk(
  manifest: CatalogueManifest,
  chunkIndex: number,
  rows: CatalogueMedicine[]
): Promise<void> {
  const db = await open()
  try {
    const tx = db.transaction(["medicines", "progress"], "readwrite")
    const finished = complete(tx)
    const store = tx.objectStore("medicines")
    if (chunkIndex === 0)
      store.delete(
        IDBKeyRange.bound([manifest.version], [manifest.version, []])
      )
    for (const row of rows) {
      const stored: StoredMedicine = {
        ...row,
        version: manifest.version,
        searchName: medicineSearchKey(row.name),
        compositionKeys: [
          ...new Set(
            compositionWords(`${row.composition1} ${row.composition2}`)
          ),
        ].map((word) => `${manifest.version}|${word}`),
      }
      store.put(stored)
    }
    const count = manifest.chunks
      .slice(0, chunkIndex + 1)
      .reduce((sum, chunk) => sum + chunk.count, 0)
    tx.objectStore("progress").put({
      version: manifest.version,
      nextChunk: chunkIndex + 1,
      count,
      ready: false,
    } satisfies Progress)
    await finished
  } finally {
    db.close()
  }
}
export async function finishCatalogue(
  manifest: CatalogueManifest
): Promise<void> {
  const db = await open()
  try {
    const tx = db.transaction(["medicines", "progress"], "readwrite")
    const finished = complete(tx)
    const count = await request(
      tx.objectStore("medicines").index("version").count(manifest.version)
    )
    if (count !== manifest.recordCount) {
      tx.abort()
      await finished
      return
    }
    tx.objectStore("progress").put({
      version: manifest.version,
      nextChunk: manifest.chunks.length,
      count,
      ready: true,
    } satisfies Progress)
    // Commit the ready marker and retire older generations together.
    const old = tx.objectStore("progress").openCursor()
    old.onsuccess = () => {
      const row = old.result
      if (row) {
        if (row.key !== manifest.version) {
          tx.objectStore("medicines").delete(
            IDBKeyRange.bound([row.key], [row.key, []])
          )
          row.delete()
        }
        row.continue()
      }
    }
    await finished
  } finally {
    db.close()
  }
}
export async function searchCatalogue(version: string, input: string) {
  const db = await open()
  try {
    const key = medicineSearchKey(input)
    const words = compositionWords(key)
    const suggestions: CatalogueMedicine[] = []
    const ids = new Set<string>()
    const tx = db.transaction(["medicines", "progress"], "readonly")
    const finished = complete(tx)
    const progress = (await request(
      tx.objectStore("progress").get(version)
    )) as Progress | undefined
    if (!progress?.ready) {
      await finished
      throw new Error("Local catalogue was cleared")
    }
    const store = tx.objectStore("medicines")
    const exactRequest = request(
      store.index("name").get([version, key])
    ) as Promise<StoredMedicine | undefined>
    const collect = (
      index: IDBIndex,
      range: IDBKeyRange,
      composition: boolean
    ) =>
      new Promise<void>((resolve, reject) => {
        const cursor = index.openCursor(range)
        cursor.onerror = () => reject(cursor.error)
        cursor.onsuccess = () => {
          const entry = cursor.result
          if (!entry || suggestions.length >= 10) {
            resolve()
            return
          }
          const row = entry.value as StoredMedicine
          if (
            !ids.has(row.id) &&
            (!composition ||
              words.every((word) =>
                compositionWords(
                  `${row.composition1} ${row.composition2}`
                ).some((token) => token.startsWith(word))
              ))
          ) {
            const { id, name, manufacturer, composition1, composition2 } = row
            suggestions.push({
              id,
              name,
              manufacturer,
              composition1,
              composition2,
            })
            ids.add(id)
          }
          entry.continue()
        }
      })
    await collect(
      store.index("name"),
      IDBKeyRange.bound([version, key], [version, key + "\uffff"]),
      false
    )
    if (suggestions.length < 10 && words.length) {
      const token = [...words].sort((a, b) => b.length - a.length)[0]
      const start = `${version}|${token}`
      await collect(
        store.index("composition"),
        IDBKeyRange.bound(start, start + "\uffff"),
        true
      )
    }
    const exact = await exactRequest
    await finished
    return {
      suggestions,
      exactMatch: exact
        ? {
            id: exact.id,
            name: exact.name,
            manufacturer: exact.manufacturer,
            composition1: exact.composition1,
            composition2: exact.composition2,
          }
        : undefined,
    }
  } finally {
    db.close()
  }
}
