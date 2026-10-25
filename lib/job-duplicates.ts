// ============================================================
// lib/job-duplicates.ts
// Duplicate-job checker against the `jobs` table.
// Two jobs are duplicates when they have the same TITLE and the same
// CONTACT (phone, email or URL), compared after normalising the contact
// so "0815 112 5199", "+234 815 112 5199" and "wa.me/2348151125199"
// all match. Only jobs that are still live (or waiting for approval)
// count, so a genuinely re-posted vacancy after the old one expired
// is allowed.
// ============================================================

import type { createAdminClient } from "@/lib/supabase/admin"

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

/** Reduces an email / phone / URL to a comparable key (null if empty). */
export function normalizeContact(value: string | null | undefined): string | null {
  const s = (value ?? "").trim().toLowerCase()
  if (!s) return null

  const email = s.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/)
  if (email) return email[0]

  // wa.me/2348151125199, api.whatsapp.com/send?phone=2348151125199
  const wa = s.match(/(?:wa\.me\/|whatsapp\.com\/send\/?\?phone=)\+?(\d{7,})/)
  if (wa) return wa[1].slice(-10)

  const digits = s.replace(/\D/g, "")
  const looksLikeUrl = /https?:|www\.|\.[a-z]{2,}(\/|$)/.test(s)
  if (!looksLikeUrl && digits.length >= 7) return digits.slice(-10) // 0815… and +234815… match

  return s
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
}

/**
 * Finds an existing live/pending job with the same title and contact.
 * Returns its id, or null when there is no duplicate (or no contact to compare).
 */
export async function findDuplicateJob(
  db: ReturnType<typeof createAdminClient>,
  title: string,
  contact: string | null | undefined
): Promise<string | null> {
  const key = normalizeContact(contact)
  if (!key || !title.trim()) return null

  const { data } = await db
    .from("jobs")
    .select("id, status, deadline, external_apply_value")
    .ilike("title", escapeLike(title.trim()))
    .in("status", ["active", "pending_approval"])
    .limit(100)

  const today = new Date().toISOString().slice(0, 10)
  const match = (data ?? []).find(
    (j) =>
      normalizeContact(j.external_apply_value) === key &&
      (j.status === "pending_approval" || (j.deadline ?? "").slice(0, 10) >= today)
  )
  return match?.id ?? null
}
