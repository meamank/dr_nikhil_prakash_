import { formatClinicalText } from "@repo/shared"

/** Keep the cursor in place when normalizing text edited in the middle. */
export function formatClinicalInput(
  input: HTMLInputElement | HTMLTextAreaElement
): string {
  const { value, selectionStart, selectionEnd } = input
  const formatted = formatClinicalText(value)
  if (formatted !== value) {
    input.value = formatted
    if (selectionStart !== null && selectionEnd !== null) {
      input.setSelectionRange(
        formatClinicalText(value.slice(0, selectionStart)).length,
        formatClinicalText(value.slice(0, selectionEnd)).length
      )
    }
  }
  return formatted
}
