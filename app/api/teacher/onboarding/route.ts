// ============================================================
// app/api/teacher/onboarding/route.ts
// GET — return onboarding_data row for the logged-in teacher
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("onboarding_data")
      .select(`
        cv_name,
        cv_summary,
        cv_skills,
        cv_roles,
        cv_languages,
        cv_certifications,
        cv_linkedin,
        cv_work_experience,
        cv_education,
        cv_awards,
        cv_interests,
        curriculum_experience,
        teaching_style,
        lesson_delivery_mode,
        talent_pool,
        years_of_teaching_experience,
        experience_level,
        preferred_states,
        accommodation_needed,
        sector,
        job_type
      `)
      .eq("user_id", session.user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = row not found — that's fine, just return null
      console.error("onboarding fetch error:", error)
    }

    return NextResponse.json({ data: data ?? null })
  } catch (err) {
    console.error("onboarding route error:", err)
    return NextResponse.json({ error: "Failed to fetch onboarding data" }, { status: 500 })
  }
}