// ============================================================
// lib/external-apply.ts
// A school can point applicants to an external email, phone number
// (WhatsApp), or website instead of using the built-in application
// flow. Rather than making them pick a type from a dropdown, we just
// guess it from what they typed into the one text box.
// ============================================================

export type ExternalApplyType = "email" | "phone" | "url"

export function detectExternalApplyType(value: string): ExternalApplyType {
  const trimmed = value.trim()

  if (trimmed.includes("@")) return "email"

  const digitsOnly = trimmed.replace(/[\s\-()]/g, "")
  if (/^\+?\d{7,15}$/.test(digitsOnly)) return "phone"

  return "url"
}

/** Builds the href/action for the Apply button based on the detected type. */
export function getExternalApplyHref(value: string): string {
  const trimmed = value.trim()
  const type = detectExternalApplyType(trimmed)

  switch (type) {
    case "email":
      return `mailto:${trimmed}`
    case "phone": {
      // wa.me wants digits only (no +, spaces, dashes, brackets)
      const digits = trimmed.replace(/\D/g, "")
      return `https://wa.me/${digits}`
    }
    case "url":
    default:
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }
}

/** Human-readable label so applicants know what clicking Apply will do. */
export function getExternalApplyLabel(value: string): string {
  switch (detectExternalApplyType(value)) {
    case "email":
      return "Apply via Email"
    case "phone":
      return "Apply via WhatsApp"
    case "url":
    default:
      return "Apply on Website"
  }
}
