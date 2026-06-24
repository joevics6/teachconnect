// ============================================================
// app/api/teacher/profile/[id]/route.ts
// GET — public teacher profile (school or guest viewing)
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    let viewerRole: "teacher" | "school" | "guest" = "guest"
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()
      viewerRole = (userRecord?.role as "teacher" | "school") || "guest"
    }

    const { data: profile, error } = await supabase
      .from("teacher_profiles")
      .select(
        `id, full_name, state, lga, subjects, teaching_levels,
         years_experience, trcn_status, trcn_number, preferred_states,
         willing_to_relocate, accommodation_needed, availability,
         salary_min, salary_max, bio, photo_url, profile_completion,
         is_visible, created_at,
         ${viewerRole === "school" ? "cv_url, phone," : ""}
         `
      )
      .eq("id", id)
      .eq("is_visible", true)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profile not found or not visible" },
        { status: 404 }
      )
    }

    let quizResults: unknown[] = []
    if (viewerRole === "school") {
      const { data: results } = await supabase
        .from("quiz_attempts")
        .select("id, score, passed, mode, created_at, jobs(subject)")
        .eq("teacher_id", id)
        .order("created_at", { ascending: false })
        .limit(5)

      quizResults = (results || []).map((r) => ({
        id: r.id,
        subject: (r.jobs as { subject: string } | null)?.subject || "Unknown",
        score: r.score,
        passed: r.passed,
        mode: r.mode,
        created_at: r.created_at,
      }))
    }

    return NextResponse.json({
      profile,
      quiz_results: quizResults,
      viewer_role: viewerRole,
    })
  } catch (err) {
    console.error("GET public teacher profile error:", err)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
