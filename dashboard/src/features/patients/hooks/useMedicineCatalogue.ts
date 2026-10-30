import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useQuery } from "@tanstack/react-query"
import { medicineCatalogueVersion } from "../lib/medicine-catalogue-version"
import {
  medicinePrefix,
  medicinePrefixFilename,
  medicineSearchKey,
} from "../lib/medicine-catalogue.mjs"

import {
  catalogueStatus,
  medicineAssetRoot,
  searchLocalCatalogue,
  subscribeCatalogue,
} from "../lib/medicine-local-client"
import type { CatalogueMedicine } from "../lib/medicine-local-db"
export type { CatalogueMedicine } from "../lib/medicine-local-db"

type Manifest = { version: string; recordCount: number; prefixes: string[] }
const assetRoot = medicineAssetRoot

async function loadAsset<T>(file: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${assetRoot}/${file}`, { signal })
  if (!response.ok) throw new Error("Couldn’t load medicine suggestions")
  return response.json() as Promise<T>
}

export function useMedicineCatalogue(input: string) {
  const localStatus = useSyncExternalStore(subscribeCatalogue, catalogueStatus)
  const key = medicineSearchKey(input)
  const prefix = medicinePrefix(input)
  const hasPrefix = Array.from(key).length >= 3
  const [debouncedPrefix, setDebouncedPrefix] = useState("")
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedPrefix(hasPrefix ? prefix : ""),
      150
    )
    return () => clearTimeout(timer)
  }, [prefix, hasPrefix])

  const ready = hasPrefix && prefix === debouncedPrefix
  const [debouncedKey, setDebouncedKey] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKey(key), 150)
    return () => clearTimeout(timer)
  }, [key])
  const local = useQuery({
    queryKey: [
      "medicine-catalogue",
      medicineCatalogueVersion,
      "local",
      debouncedKey,
    ],
    queryFn: () => searchLocalCatalogue(debouncedKey),
    enabled: localStatus === "ready" && hasPrefix && debouncedKey === key,
    staleTime: Infinity,
    retry: false,
  })
  const useLocal = localStatus === "ready" && !local.error
  const manifest = useQuery({
    queryKey: ["medicine-catalogue", medicineCatalogueVersion, "manifest"],
    queryFn: ({ signal }) => loadAsset<Manifest>("manifest.json", signal),
    enabled: ready && !useLocal,
    staleTime: Infinity,
  })
  const prefixes = useMemo(
    () => new Set(manifest.data?.prefixes),
    [manifest.data]
  )
  const exists = prefixes.has(prefix)
  const group = useQuery({
    queryKey: [
      "medicine-catalogue",
      medicineCatalogueVersion,
      "prefix",
      prefix,
    ],
    queryFn: ({ signal }) =>
      loadAsset<CatalogueMedicine[]>(medicinePrefixFilename(prefix), signal),
    enabled: ready && exists && !useLocal,
    staleTime: Infinity,
  })
  const entries = useMemo(
    () =>
      (group.data ?? []).map((record) => ({
        record,
        key: medicineSearchKey(record.name),
      })),
    [group.data]
  )
  const matches =
    ready && exists ? entries.filter((entry) => entry.key.startsWith(key)) : []
  return {
    localReady: useLocal,
    suggestions: useLocal
      ? key === debouncedKey
        ? (local.data?.suggestions ?? [])
        : []
      : matches.slice(0, 10).map((entry) => entry.record),
    exactMatch: useLocal
      ? key === debouncedKey
        ? local.data?.exactMatch
        : undefined
      : matches.find((entry) => entry.key === key)?.record,
    loading:
      hasPrefix &&
      (useLocal
        ? key !== debouncedKey || local.isLoading
        : !ready || manifest.isLoading || (exists && group.isLoading)),
    error:
      ready && !useLocal
        ? (manifest.error ?? (exists ? group.error : null))
        : null,
    retry: () => (manifest.error ? manifest.refetch() : group.refetch()),
  }
}
