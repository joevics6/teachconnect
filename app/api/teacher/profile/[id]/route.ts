import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Determine viewer role from auth metadata — avoids users table lookup
    let viewerRole: "teacher" | "school" | "guest" = "guest"
    let viewerIsPremiumSchool = false
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const role = user.user_metadata?.role
      if (role === "school" || role === "teacher") viewerRole = role

      if (viewerRole === "school") {
        const { data: schoolRows } = await supabase
          .from("school_profiles").select("id").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(1)
        const school = (schoolRows ?? [])[0] ?? null
        if (school) {
          const { data: subRows } = await supabase
            .from("subscriptions").select("id")
            .eq("school_id", school.id).eq("is_active", true)
            .in("plan_type", ["standard", "term"])
            .gte("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false }).limit(1)
          viewerIsPremiumSchool = !!((subRows ?? [])[0])
        }
      }
    }

    // Fetch profile — use limit(1) not single(), remove is_visible filter
    // so schools can view profiles even if teacher toggled visibility off
    const { data: profileRows, error } = await supabase
      .from("teacher_profiles")
      .select(
        `id, full_name, state, lga, subjects, teaching_levels,
         years_experience, trcn_status, trcn_number, preferred_states,
         willing_to_relocate, accommodation_needed, availability,
         salary_min, salary_max, bio, photo_url, profile_completion,
         is_visible, created_at,
         cv_url, phone`
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

    // Hide phone/cv/TRCN number from non-premium-school viewers — only
    // paying schools (Standard or Term plan) get contact details, matching
    // the paywall already shown on the talent browse page.
    if (!viewerIsPremiumSchool) {
      delete (profile as Record<string, unknown>).cv_url
      delete (profile as Record<string, unknown>).phone
      delete (profile as Record<string, unknown>).trcn_number
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

    return NextResponse.json({
      profile,
      quiz_results: quizResults,
      viewer_role:  viewerRole,
      viewer_is_premium: viewerIsPremiumSchool,
    })
  } catch (err) {
    console.error("GET public teacher profile error:", err)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
