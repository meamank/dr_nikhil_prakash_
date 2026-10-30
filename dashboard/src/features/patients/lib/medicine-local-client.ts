import { toast } from "sonner"
import { medicineCatalogueVersion } from "./medicine-catalogue-version"
import type { CatalogueMedicine } from "./medicine-local-db"
export const medicineAssetRoot = `${import.meta.env.BASE_URL}medicine-catalogue/${medicineCatalogueVersion}`
type Status = "idle" | "downloading" | "ready" | "unavailable"
type SearchResult = {
  suggestions: CatalogueMedicine[]
  exactMatch?: CatalogueMedicine
}
let status: Status = "idle"
let worker: Worker | undefined
let sequence = 0
let requestedPersistence = false
let notifiedUnavailable = false
const subscribers = new Set<() => void>()
const pending = new Map<
  number,
  {
    resolve: (result: SearchResult) => void
    reject: (error: Error) => void
    timeout: ReturnType<typeof setTimeout>
  }
>()
export const subscribeCatalogue = (listener: () => void) => {
  subscribers.add(listener)
  return () => {
    subscribers.delete(listener)
  }
}
export const catalogueStatus = () => status
function update(next: Status) {
  status = next
  subscribers.forEach((listener) => listener())
}
function fail() {
  worker?.terminate()
  worker = undefined
  for (const entry of pending.values()) {
    clearTimeout(entry.timeout)
    entry.reject(new Error("Local catalogue unavailable"))
  }
  pending.clear()
  update("unavailable")
}
export function checkLocalCatalogue() {
  if (!globalThis.indexedDB || !globalThis.Worker) {
    update("unavailable")
    return
  }
  try {
    if (!worker) {
      worker = new Worker(
        new URL("./medicine-catalogue.worker.ts", import.meta.url),
        { type: "module" }
      )
      worker.onerror = fail
      worker.onmessage = ({ data }) => {
        if (data.type === "status") {
          const previous = status
          update(data.status)
          if (data.status === "ready") notifiedUnavailable = false
          if (
            data.status === "ready" &&
            (!requestedPersistence || data.downloaded)
          ) {
            requestedPersistence = true
            if (data.downloaded)
              toast.success("Medicine catalogue ready", {
                description: "Saved locally for name and composition search.",
              })
            void (async () => {
              try {
                await navigator.storage?.persist?.()
              } catch {
                /* Best-effort storage still works. */
              }
            })()
          } else if (
            data.status === "unavailable" &&
            previous !== "unavailable"
          ) {
            if (!notifiedUnavailable) {
              notifiedUnavailable = true
              toast.warning("Local medicine catalogue unavailable", {
                description:
                  "Online name search is still available. Download will retry when you reopen the portal or reconnect.",
              })
            }
            if (previous === "ready") checkLocalCatalogue()
          }
        } else if (data.id) {
          const entry = pending.get(data.id)
          if (entry) {
            clearTimeout(entry.timeout)
            pending.delete(data.id)
            if (data.error) entry.reject(new Error(data.error))
            else entry.resolve(data.result)
          }
        }
      }
    }
    worker.postMessage({
      id: ++sequence,
      type: "ensure",
      root: medicineAssetRoot,
      version: medicineCatalogueVersion,
    })
  } catch {
    fail()
  }
}
export function searchLocalCatalogue(input: string): Promise<SearchResult> {
  return new Promise((resolve, reject) => {
    if (!worker || status !== "ready") {
      reject(new Error("Local catalogue not ready"))
      return
    }
    const id = ++sequence
    const timeout = setTimeout(() => {
      pending.delete(id)
      reject(new Error("Local medicine search timed out"))
      checkLocalCatalogue()
    }, 10000)
    pending.set(id, { resolve, reject, timeout })
    worker.postMessage({
      id,
      type: "search",
      root: medicineAssetRoot,
      version: medicineCatalogueVersion,
      input,
    })
  })
}
