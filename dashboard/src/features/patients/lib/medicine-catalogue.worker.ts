import {
  finishCatalogue,
  getProgress,
  isCatalogueReady,
  searchCatalogue,
  writeChunk,
} from "./medicine-local-db"
import type { CatalogueManifest, CatalogueMedicine } from "./medicine-local-db"

type Incoming = {
  id: number
  type: "ensure" | "search"
  root: string
  version: string
  input?: string
}
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Incoming>) => void) | null
  postMessage: (message: unknown) => void
}
let preparing: Promise<void> | undefined
async function ensure(root: string, version: string) {
  if (await isCatalogueReady(version)) {
    scope.postMessage({ type: "status", status: "ready", downloaded: false })
    return
  }
  const response = await fetch(`${root}/manifest.json`, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error("Catalogue download unavailable")
  const manifest = (await response.json()) as CatalogueManifest
  if (manifest.version !== version || !manifest.chunks?.length)
    throw new Error("Invalid catalogue manifest")
  const saved = await getProgress(manifest)
  if (saved.ready) {
    scope.postMessage({ type: "status", status: "ready", downloaded: false })
    return
  }
  scope.postMessage({ type: "status", status: "downloading" })
  for (let index = saved.nextChunk; index < manifest.chunks.length; index++) {
    const chunk = manifest.chunks[index]
    const res = await fetch(`${root}/${chunk.file}`, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error("Catalogue download interrupted")
    const bytes = await res.arrayBuffer()
    const digest = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      (byte) => byte.toString(16).padStart(2, "0")
    ).join("")
    if (digest !== chunk.sha256)
      throw new Error("Catalogue download failed verification")
    const rows = JSON.parse(
      new TextDecoder().decode(bytes)
    ) as CatalogueMedicine[]
    if (!Array.isArray(rows) || rows.length !== chunk.count)
      throw new Error("Incomplete catalogue chunk")
    await writeChunk(manifest, index, rows)
    scope.postMessage({
      type: "progress",
      completed: index + 1,
      total: manifest.chunks.length,
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  await finishCatalogue(manifest)
  scope.postMessage({ type: "status", status: "ready", downloaded: true })
}
scope.onmessage = ({ data }) => {
  if (data.type === "ensure") {
    if (!preparing) {
      const download = () => ensure(data.root, data.version)
      // Coordinate tabs/windows sharing the same browser storage.
      preparing = (
        navigator.locks
          ? navigator.locks.request("clinic-medicine-catalogue", download)
          : download()
      )
        .catch(() => {
          scope.postMessage({ type: "status", status: "unavailable" })
        })
        .finally(() => {
          preparing = undefined
        })
    }
  } else {
    void searchCatalogue(data.version, data.input ?? "")
      .then((result) => scope.postMessage({ id: data.id, result }))
      .catch(() => {
        scope.postMessage({ id: data.id, error: "Local catalogue unavailable" })
        scope.postMessage({ type: "status", status: "unavailable" })
      })
  }
}
