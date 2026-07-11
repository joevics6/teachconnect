// ============================================================
// lib/notifications.ts
// Shared helper for inserting notifications. When prefKey is
// provided, checks the recipient's teacher_profiles.notification_prefs
// first and skips the insert if they've turned that category off.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export type NotificationPrefKey = "application_updates" | "new_jobs" | "invites" | "newsletter"

interface NotifyParams {
  userId: string
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
  /** If set, the notification is only sent if the teacher has this preference enabled. */
  prefKey?: NotificationPrefKey
}

export async function notifyUser(supabase: SupabaseClient, params: NotifyParams) {
  const { userId, type, title, message, metadata, prefKey } = params

  if (prefKey) {
    const { data: rows } = await supabase
      .from("teacher_profiles")
      .select("notification_prefs")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
    const prefs = (rows ?? [])[0]?.notification_prefs as Record<string, boolean> | undefined
    // Default to sending if the teacher has no row/prefs yet (opted-in by default)
    if (prefs && prefs[prefKey] === false) return { skipped: true }
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    metadata: metadata ?? {},
  })
  if (error) console.error("notifyUser insert error:", error)
  return { skipped: false }
}
