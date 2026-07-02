// ============================================================
// app/api/teacher/profile/route.ts
// GET  — own profile (authenticated teacher)
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from("teacher_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    // Fetch onboarding_data in parallel with quiz results
    const [quizRes, onboardingRes] = await Promise.all([
      supabase
        .from("quiz_attempts")
        .select("id, score, passed, mode, created_at, jobs(subject)")
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("onboarding_data")
        .select(`
          cv_summary, cv_skills, cv_roles, cv_languages,
          cv_certifications, cv_linkedin, cv_work_experience,
          cv_education, cv_awards, cv_interests,
          curriculum_experience, teaching_style, lesson_delivery_mode,
          talent_pool, years_of_teaching_experience, experience_level,
          preferred_states, preferred_locations, accommodation_needed,
          sector, job_type, willing_to_relocate, availability, salary_min
        `)
        .eq("user_id", user.id)
        .single()
    ])

    const formattedResults = (quizRes.data || []).map((r) => ({
      id: r.id,
      subject: ((Array.isArray(r.jobs) ? r.jobs[0] : r.jobs) as unknown as { subject: string } | null)?.subject || "Unknown",
      score: r.score,
      passed: r.passed,
      mode: r.mode,
      created_at: r.created_at,
    }))

    // Merge onboarding fields into profile so dashboard gets everything in one call
    // Fields in teacher_profiles take priority; onboarding fills the gaps
    const onboarding = (onboardingRes.data || {}) as Record<string, unknown>
    const mergedProfile = {
      ...profile,
      // Fill from onboarding if not set on profile
      availability:        profile.availability        ?? onboarding.availability        ?? null,
      salary_min:          profile.salary_min          ?? onboarding.salary_min          ?? null,
      willing_to_relocate: profile.willing_to_relocate ?? onboarding.willing_to_relocate ?? null,
      accommodation_needed: profile.accommodation_needed ?? onboarding.accommodation_needed ?? null,
      // Rich CV fields from onboarding
      cv_summary:              onboarding.cv_summary              ?? null,
      cv_skills:               onboarding.cv_skills               ?? [],
      cv_roles:                onboarding.cv_roles                ?? [],
      cv_languages:            onboarding.cv_languages            ?? [],
      cv_certifications:       onboarding.cv_certifications       ?? [],
      cv_linkedin:             onboarding.cv_linkedin             ?? null,
      cv_work_experience:      onboarding.cv_work_experience      ?? [],
      cv_education:            onboarding.cv_education            ?? [],
      cv_awards:               onboarding.cv_awards               ?? [],
      cv_interests:            onboarding.cv_interests            ?? [],
      curriculum_experience:   onboarding.curriculum_experience   ?? [],
      teaching_style:          onboarding.teaching_style          ?? [],
      lesson_delivery_mode:    onboarding.lesson_delivery_mode    ?? [],
      talent_pool:             onboarding.talent_pool             ?? false,
      years_of_teaching_experience: onboarding.years_of_teaching_experience ?? null,
      experience_level:        onboarding.experience_level        ?? null,
      preferred_states:        profile.preferred_states?.length
                                 ? profile.preferred_states
                                 : (onboarding.preferred_states   ?? []),
    }

    return NextResponse.json({
      profile: mergedProfile,
      quiz_results: formattedResults,
      viewer_role: "teacher",
    })
  } catch (err) {
    console.error("GET teacher profile error:", err)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Whitelist updatable fields
    const allowedFields = [
      "full_name", "phone", "state", "lga",
      "teaching_levels", "subjects", "years_experience",
      "trcn_number", "trcn_status", "preferred_states",
      "willing_to_relocate", "accommodation_needed",
      "availability", "salary_min", "salary_max", "bio", "photo_url",
    ]

    const updates: Record<string, unknown> = {}
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) updates[field] = body[field]
    })

    const { data, error } = await supabase
      .from("teacher_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ profile: data })
  } catch (err) {
    console.error("PATCH teacher profile error:", err)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}