import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasTalentAccess, isPremiumPlan, getActivePlanType } from "@/lib/school-plan"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Determine viewer role from auth metadata — avoids users table lookup
    let viewerRole: "teacher" | "school" | "guest" = "guest"
    // CV/TRCN: any paid plan (Single Post, Monthly, or Term) — matches the
    // CV-download gate for talent-search discovery in cv-signed-url/route.ts.
    let viewerIsPremiumSchool = false
    // Phone + Call/WhatsApp buttons: Monthly/Term only — this is the paid
    // "contact" tier, not just "posted a job once" (see hasTalentAccess).
    let viewerHasContactAccess = false
    // Which of the viewing school's own jobs this teacher has already been
    // invited to, or has already applied for — lets the "Invite to Apply"
    // button reflect real state instead of always being clickable.
    let invitedJobIds: string[] = []
    let appliedJobIds: string[] = []
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Individual profiles require sign-in — unlike the talent list
      // (which now shows a preview to guests), a specific teacher's
      // profile is exactly the "who is this person" detail a school
      // should sign up to see, not browse anonymously.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (user) {
      const role = user.user_metadata?.role
      if (role === "school" || role === "teacher") viewerRole = role

      if (viewerRole === "school") {
        const { data: schoolRows } = await supabase
          .from("school_profiles").select("id").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(1)
        const school = (schoolRows ?? [])[0] ?? null
        if (school) {
          const planType = await getActivePlanType(supabase, school.id)
          viewerIsPremiumSchool = isPremiumPlan(planType)
          viewerHasContactAccess = hasTalentAccess(planType)

          const { data: ownJobs } = await supabase
            .from("jobs").select("id").eq("school_id", school.id)
          const jobIds = (ownJobs ?? []).map((j) => j.id)

          if (jobIds.length > 0) {
            const [{ data: invites }, { data: applications }] = await Promise.all([
              supabase.from("school_invites").select("job_id")
                .eq("school_id", school.id).eq("teacher_id", id).in("job_id", jobIds),
              supabase.from("applications").select("job_id")
                .eq("teacher_id", id).in("job_id", jobIds),
            ])
            invitedJobIds = (invites ?? []).map((i) => i.job_id)
            appliedJobIds = (applications ?? []).map((a) => a.job_id)
          }
        }
      }
    }

    // Fetch profile — use limit(1) not single(), remove is_visible filter
    // so schools can view profiles even if teacher toggled visibility off
    const { data: profileRows, error } = await supabase
      .from("teacher_profiles")
      .select(
        `id, full_name, state, lga, subjects, teaching_levels, level_subjects,
         years_experience, trcn_status, trcn_number, preferred_states,
         willing_to_relocate, accommodation_needed, availability,
         salary_min, salary_max, bio, photo_url, profile_completion,
         is_visible, created_at,
         cv_url, phone, phone_calls_enabled, whatsapp_enabled`
      )
      .eq("id", id)
      .order("created_at", { ascending: false })
      .limit(1)

    const profile = (profileRows ?? [])[0] ?? null

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    // Hide CV/TRCN number from non-premium-school viewers — any paid plan
    // gets these, matching the talent-page CV-download paywall.
    if (!viewerIsPremiumSchool) {
      delete (profile as Record<string, unknown>).cv_url
      delete (profile as Record<string, unknown>).trcn_number
    }

    // Phone number + Call/WhatsApp buttons are a Monthly/Term-only perk —
    // stricter than the CV/TRCN gate above.
    if (!viewerHasContactAccess) {
      delete (profile as Record<string, unknown>).phone
      delete (profile as Record<string, unknown>).phone_calls_enabled
      delete (profile as Record<string, unknown>).whatsapp_enabled
    }

    // Quiz results — show to schools
    let quizResults: unknown[] = []
    if (viewerRole === "school") {
      const { data: results } = await supabase
        .from("quiz_attempts")
        .select("id, score, passed, mode, created_at, jobs(subject)")
        .eq("teacher_id", id)
        .order("created_at", { ascending: false })
        .limit(5)

      quizResults = (results || []).map((r) => ({
        id:         r.id,
        subject:    ((Array.isArray(r.jobs) ? r.jobs[0] : r.jobs) as unknown as { subject: string } | null)?.subject || "Unknown",
        score:      r.score,
        passed:     r.passed,
        mode:       r.mode,
        created_at: r.created_at,
      }))
    }

    // Subject Mastery quiz results — scoped to the profile being viewed
    // (not the viewer). Previously the frontend called a separate
    // endpoint that always returned the LOGGED-IN caller's own results
    // regardless of which profile page they were on — so it only ever
    // worked by coincidence for a teacher viewing their own profile
    // while actively logged in, and never for schools or guests.
    const { data: specResults } = await supabase
      .from("specialization_quiz_results")
      .select("id, subject, level, score, correct_answers, total_questions, time_taken_seconds, percentile, created_at")
      .eq("teacher_id", id)
      .order("created_at", { ascending: false })

    // Invite/application status was already computed above, alongside
    // viewer role resolution.

    return NextResponse.json({
      profile,
      quiz_results: quizResults,
      specialization_results: specResults || [],
      viewer_role:  viewerRole,
      viewer_is_premium: viewerIsPremiumSchool,
      viewer_has_contact_access: viewerHasContactAccess,
      invited_job_ids: invitedJobIds,
      applied_job_ids: appliedJobIds,
    })
  } catch (err) {
    console.error("GET public teacher profile error:", err)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
