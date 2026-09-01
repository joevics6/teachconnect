// ============================================================
// lib/external-apply.ts
// A school can point applicants to one or more external contacts —
// email, phone number (WhatsApp), and/or website — instead of using
// the built-in application flow. Schools enter these as a single
// comma-separated field (e.g. "jobs@school.com, 08012345678,
// school.com/careers"), so this parses that into individual contacts
// and auto-detects each one's type independently, rather than
// guessing a single type for the whole string.
// ============================================================

export type ExternalApplyType = "email" | "phone" | "url"

export interface ExternalApplyContact {
  value: string
  type: ExternalApplyType
  href: string
  label: string
}

export function detectExternalApplyType(value: string): ExternalApplyType {
  const trimmed = value.trim()

  if (trimmed.includes("@")) return "email"

  const digitsOnly = trimmed.replace(/[\s\-()]/g, "")
  if (/^\+?\d{7,15}$/.test(digitsOnly)) return "phone"

  return "url"
}

/** Builds the href/action for a single contact value based on its detected type. */
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

/** Human-readable label for a single contact value. */
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

/**
 * Splits the raw comma-separated field into individual, trimmed,
 * non-empty contact strings. A school can list any mix — one email,
 * one phone, one URL, or several of any of them.
 */
export function parseExternalApplyValues(raw: string): string[] {
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
}

/** Parses the raw field into fully-resolved contact descriptors, one per entry. */
export function getExternalApplyContacts(raw: string): ExternalApplyContact[] {
  return parseExternalApplyValues(raw).map((value) => ({
    value,
    type: detectExternalApplyType(value),
    href: getExternalApplyHref(value),
    label: getExternalApplyLabel(value),
  }))
}

/**
 * Short label for badges/summaries where a single line is needed
 * regardless of how many contacts there are — e.g. "Apply via Email"
 * for one contact, "Apply via Email / WhatsApp" for two or more.
 */
export function getExternalApplySummaryLabel(raw: string): string {
  const contacts = getExternalApplyContacts(raw)
  if (contacts.length === 0) return "Apply"
  if (contacts.length === 1) return contacts[0].label

  const shortNames: Record<ExternalApplyType, string> = {
    email: "Email",
    phone: "WhatsApp",
    url: "Website",
  }
  const uniqueTypes = Array.from(new Set(contacts.map((c) => c.type)))
  return `Apply via ${uniqueTypes.map((t) => shortNames[t]).join(" / ")}`
}
