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
// School prefs: new_applicant, sub_expiry, platform_news
// (quiz_passed was removed — a passed quiz always results in an
// application being created, which already fires new_applicant. A
// separate quiz_passed alert would just be a second email for the
// same event.)
export type NotificationPrefKey =
  | "application_updates" | "new_jobs" | "invites" | "newsletter"
  | "new_applicant" | "sub_expiry" | "platform_news"

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

// ------------------------------------------------------------
// notifyMatchingTeachersOfNewJob — NOT CALLED ANYWHERE YET.
//
// Fully implemented and ready to wire in, but intentionally dormant:
// fanning this out through Resend at teacher-list scale (every
// matching teacher, every approved job) will burn through Resend's
// per-day send limits/pricing fast. Enable this once sending moves
// to Amazon SES (or Resend's higher-volume tier), by uncommenting
// the call site in app/api/admin/jobs/[id]/route.ts (right after a
// job is approved — see the comment there).
//
// Matches on subject + teaching level overlap; state/lga can be
// added the same way once school_profiles.state is joined in below.
// ------------------------------------------------------------
export async function notifyMatchingTeachersOfNewJob(params: {
  jobId: string
  title: string
  subject: string
  teachingLevels: string[]
}) {
  const adminDb = createAdminClient()

  const { data: teachers, error } = await adminDb
    .from("teacher_profiles")
    .select("user_id, subjects, teaching_levels")
    .contains("subjects", [params.subject])

  if (error) {
    console.error("notifyMatchingTeachersOfNewJob query error:", error)
    return { notified: 0 }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  let notified = 0

  for (const teacher of teachers ?? []) {
    const levelsOverlap = (teacher.teaching_levels ?? []).some((l: string) =>
      params.teachingLevels.includes(l)
    )
    if (!levelsOverlap) continue

    const result = await notifyUser(adminDb, {
      userId: teacher.user_id,
      role: "teacher",
      type: "new_jobs",
      title: `New ${params.subject} job posted`,
      message: `A new job matching your subjects is open: "${params.title}". Check it out on ${appUrl}/jobs/${params.jobId}.`,
      metadata: { job_id: params.jobId },
      prefKey: "new_jobs",
    })
    if (!result.skipped) notified++
  }

  return { notified }
}
