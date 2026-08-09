// ============================================================
// lib/cv-storage.ts
//
// CVs live in a private storage bucket. Nobody gets a permanent,
// directly-reachable link — every download generates a fresh
// short-lived signed URL at the moment it's actually needed.
//
// Now that CVs can be PDF, DOC/DOCX, or an image (see
// lib/document-extract.ts), the storage path isn't a fixed
// "cv.pdf" anymore — it carries the real extension so the stored
// file's content actually matches its name. teacher_profiles.cv_url
// holds that exact path (not a usable link on its own, just a "has
// uploaded a CV" marker + the path to resolve when a link is
// actually needed).
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"

const SIGNED_URL_EXPIRY_SECONDS = 300 // 5 minutes — plenty for a download click

const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

export function cvStoragePath(teacherUserId: string, mimeType: string): string {
  const ext = EXTENSION_BY_MIME[mimeType] || "pdf"
  return `${teacherUserId}/cv.${ext}`
}

/**
 * teacher_profiles.cv_url should already be a bare storage path
 * ("<userId>/cv.<ext>") for anyone who's (re)uploaded since this file
 * started storing paths instead of URLs. For anyone who hasn't, it's
 * still the old full public URL from before the bucket went private —
 * this pulls the path back out of that so old CVs keep working
 * without requiring everyone to re-upload.
 */
export function resolveCvStoragePath(storedCvUrl: string | null, teacherUserId: string): string {
  if (storedCvUrl && !storedCvUrl.startsWith("http")) return storedCvUrl
  if (storedCvUrl) {
    const match = storedCvUrl.match(/\/cvs\/(.+?)(\?|$)/)
    if (match) return match[1]
  }
  return cvStoragePath(teacherUserId, "application/pdf") // best-effort default for anything unrecognized
}

export async function getSignedCvUrl(
  supabase: SupabaseClient,
  storagePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("cvs")
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS)

  if (error || !data?.signedUrl) {
    // Most common cause: teacher hasn't uploaded a CV yet, so the file
    // doesn't exist — not necessarily a real error.
    return null
  }
  return data.signedUrl
}
