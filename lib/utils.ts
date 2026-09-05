import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats a job's salary range for display, handling the case where
 * neither bound was given (both 0 — the DB default for jobs posted
 * without a disclosed salary, e.g. via the admin quick-post flow).
 */
export function formatSalaryRange(min: number, max: number): string {
  if (!min && !max) return "Salary not disclosed"
  if (!min) return `Up to ${formatCurrency(max)}`
  if (!max) return `${formatCurrency(min)}+`
  return `${formatCurrency(min)} – ${formatCurrency(max)}`
}

/**
 * Abbreviates a full name to first name + initials — e.g.
 * "Oriahi Ebere Naomi" -> "Oriahi E. N." Used to anonymize teacher
 * identities in the guest-facing talent preview.
 */
export function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return fullName.trim()
  const [first, ...rest] = parts
  return `${first} ${rest.map((p) => `${p[0].toUpperCase()}.`).join(" ")}`
}

/**
 * Buckets exact years of experience into a range label, so a guest
 * preview can show "qualitative" experience without the exact number
 * (which, combined with other visible fields, could help re-identify
 * a specific known teacher).
 */
export function getExperienceBucket(years: number): string {
  if (years <= 1) return "0-1 yrs"
  if (years <= 3) return "2-3 yrs"
  if (years <= 6) return "4-6 yrs"
  if (years <= 10) return "7-10 yrs"
  return "10+ yrs"
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  return initials || "?"
}

/**
 * Normalizes a Nigerian phone number to E.164 (+234...) for tel:/wa.me
 * links. Handles the common input shapes: local "080...", "+234...",
 * "234...", and anything with spaces/dashes. Returns null if the
 * number doesn't look like a valid 10-digit Nigerian subscriber number
 * once normalized, rather than producing a broken link.
 */
export function toE164Nigeria(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  let national: string | null = null
  if (digits.startsWith("234") && digits.length === 13) national = digits.slice(3)
  else if (digits.startsWith("0") && digits.length === 11) national = digits.slice(1)
  else if (digits.length === 10) national = digits
  if (!national || national.length !== 10) return null
  return `+234${national}`
}

export function calculateProfileCompletion(
  profile: Record<string, unknown>
): number {
  const requiredFields = [
    "full_name", "phone", "state", "teaching_levels",
    "subjects", "years_experience", "trcn_status",
    "bio", "photo_url", "cv_url"
  ]
  const filled = requiredFields.filter(
    (field) => profile[field] !== null &&
    profile[field] !== undefined &&
    profile[field] !== ""
  )
  return Math.round((filled.length / requiredFields.length) * 100)
}