import { useEffect } from "react"
import { checkLocalCatalogue } from "../lib/medicine-local-client"

export function useMedicineCatalogueDownload() {
  useEffect(() => {
    // Let the staff's initial screen and its data load first.
    let idle: number | undefined
    const start = setTimeout(() => {
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(checkLocalCatalogue, {
          timeout: 10000,
        })
      else checkLocalCatalogue()
    }, 5000)
    const recheck = () => {
      if (document.visibilityState === "visible") checkLocalCatalogue()
    }
    const interval = setInterval(recheck, 60000)
    document.addEventListener("visibilitychange", recheck)
    window.addEventListener("online", recheck)
    return () => {
      clearTimeout(start)
      clearInterval(interval)
      if (idle !== undefined) window.cancelIdleCallback(idle)
      document.removeEventListener("visibilitychange", recheck)
      window.removeEventListener("online", recheck)
    }
  }, [])
}
