// Shared by catalogue generation and browser lookup; filenames never contain raw prefixes.
export function medicineSearchKey(value) {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase()
}

export function medicinePrefix(value) {
  return Array.from(medicineSearchKey(value)).slice(0, 3).join("")
}

export function medicinePrefixFilename(prefix) {
  return Array.from(new TextEncoder().encode(prefix), (byte) => byte.toString(16).padStart(2, "0")).join("") + ".json"
}
