/**
 * Single source of truth for Indian mobile normalization.
 * Used by worker (Hono) and dashboard/portal + future web (Astro).
 *
 * Canonical form: 10 digits, no prefix, /^[6-9]\d{9}$/
 */

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "")
  // +91XXXXXXXXXX (12 digits, 91 prefix)
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2)
  // 0XXXXXXXXXX (11 digits, leading 0)
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1)
  if (digits.length === 10) return digits
  return null
}

export function isValidPhone(input: string): boolean {
  const n = normalizePhone(input)
  return !!n && /^\d{10}$/.test(n) && /^[6-9]\d{9}$/.test(n)
}

export function formatPhoneForDisplay(phone10: string): string {
  // 91234 56789
  if (/^\d{10}$/.test(phone10)) return `${phone10.slice(0, 5)} ${phone10.slice(5)}`
  return phone10
}

export function toTempEmail(phone10: string): string {
  return `${phone10}@phone.local`
}

export type IdentifierType = "phone" | "email" | "username"

export function detectIdentifierType(input: string): IdentifierType {
  const trimmed = input.trim()
  if (trimmed.includes("@")) return "email"
  const digits = trimmed.replace(/\D/g, "")
  // 10 digits or 12 with 91 prefix counts as phone; also handle 0-prefix via normalize
  const normalized = normalizePhone(trimmed)
  if (normalized && /^\d{10}$/.test(normalized)) return "phone"
  if (digits.length === 10 || (digits.length === 12 && digits.startsWith("91"))) return "phone"
  return "username"
}
