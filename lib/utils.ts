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

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
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