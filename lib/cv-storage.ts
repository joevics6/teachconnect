// ============================================================
// lib/cv-storage.ts
//
// CVs live in a private storage bucket. Nobody gets a permanent,
// directly-reachable link — every download generates a fresh
// short-lived signed URL at the moment it's actually needed. The
// storage path is always deterministic (`${userId}/cv.pdf`), so it
// never needs to be read back out of whatever's stored in
// teacher_profiles.cv_url (that column is only a "has uploaded a CV"
// marker at this point, not a usable link).
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"

const SIGNED_URL_EXPIRY_SECONDS = 300 // 5 minutes — plenty for a download click

export function cvStoragePath(teacherUserId: string): string {
  return `${teacherUserId}/cv.pdf`
}

export async function getSignedCvUrl(
  supabase: SupabaseClient,
  teacherUserId: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("cvs")
    .createSignedUrl(cvStoragePath(teacherUserId), SIGNED_URL_EXPIRY_SECONDS)

  if (error || !data?.signedUrl) {
    // Most common cause: teacher hasn't uploaded a CV yet, so the file
    // doesn't exist — not necessarily a real error.
    return null
  }
  return data.signedUrl
}
