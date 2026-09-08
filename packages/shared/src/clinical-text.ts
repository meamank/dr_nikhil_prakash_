/** Standardize clinical entry text while retaining the requested unit notation. */
export function formatClinicalText(value: string): string {
  return value.toUpperCase().replace(
    /(^|[^\p{L}])(MG|ML)(?!\p{L})/gu,
    (_, prefix: string, unit: string) => `${prefix}${unit === "MG" ? "mg" : "mL"}`,
  )
}
