// ============================================================
// lib/notifications.ts
// SINGLE SOURCE OF TRUTH for notifying a user — every place that
// wants to tell a teacher or school something should call
// notifyUser() rather than inserting into `notifications` directly,
// so in-app + email always stay in sync (a caller can't accidentally
// add one and forget the other).
//
// When prefKey is provided, checks the recipient's notification_prefs
// (teacher_profiles or school_profiles, per `role`) first and skips
// BOTH in-app and email if they've turned that category off. Omit
// prefKey for transactional notifications that should always send
// (e.g. "your payment succeeded") regardless of preference toggles.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail, renderNotificationEmail } from "@/lib/email"

// Teacher prefs: application_updates, new_jobs, invites, newsletter
// School prefs: new_applicant, quiz_passed, sub_expiry, platform_news
export type NotificationPrefKey =
  | "application_updates" | "new_jobs" | "invites" | "newsletter"
  | "new_applicant" | "quiz_passed" | "sub_expiry" | "platform_news"

interface NotifyParams {
  userId: string
  /** Which profile table to check notification_prefs against. Defaults to "teacher" to match existing call sites. */
  role?: "teacher" | "school"
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
  /** If set, skipped entirely (in-app AND email) when the recipient has this preference turned off. */
  prefKey?: NotificationPrefKey
  /** Skip the email for this call — in-app notification still sent. */
  skipEmail?: boolean
}

export async function notifyUser(
  // Kept for backward compatibility with every existing call site — no
  // longer used internally (see adminDb below), but changing the
  // signature would mean touching every caller for no behavior change.
  supabase: SupabaseClient,
  params: NotifyParams
) {
  const { userId, role = "teacher", type, title, message, metadata, prefKey, skipEmail } = params
  const table = role === "school" ? "school_profiles" : "teacher_profiles"

  // Service-role client for the actual writes/pref-check below — the
  // caller's `supabase` may be a webhook context with no session at all
  // (e.g. the Paystack webhook), and even with a session, this is
  // fundamentally "the system notifying a DIFFERENT user" (a school's
  // action notifying a teacher, etc.), so auth.uid() essentially never
  // equals the recipient's user_id. notifications has no INSERT policy
  // for exactly that reason — every notifyUser() call needs this.
  const adminDb = createAdminClient()

  if (prefKey) {
    const { data: rows } = await adminDb
      .from(table)
      .select("notification_prefs")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
    const prefs = (rows ?? [])[0]?.notification_prefs as Record<string, boolean> | undefined
    // Default to sending if there's no row/prefs yet (opted-in by default)
    if (prefs && prefs[prefKey] === false) return { skipped: true }
  }

  const { error } = await adminDb.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    metadata: metadata ?? {},
  })
  if (error) console.error("notifyUser insert error:", error)

  if (!skipEmail) {
    // Email failures should never break the calling request (a payment,
    // an application, etc.) — log and move on.
    try {
      const { data: userData } = await adminDb.auth.admin.getUserById(userId)
      const email = userData?.user?.email
      if (email) {
        const dashboardPath = role === "school" ? "/dashboard/school" : "/dashboard/teacher"
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
        await sendEmail({
          to: email,
          subject: title,
          html: renderNotificationEmail({ title, message, ctaUrl: `${appUrl}${dashboardPath}` }),
        })
      }
    } catch (err) {
      console.error("notifyUser email error:", err)
    }
  }

  return { skipped: false }
}
