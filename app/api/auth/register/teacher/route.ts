// ============================================================
// app/api/auth/register/teacher/route.ts
// POST — register teacher, create profile, upload CV + photo
// ============================================================
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
 
    // ── Extract fields ──────────────────────────────────────
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const full_name = formData.get("full_name") as string
    const phone = formData.get("phone") as string
    const state = formData.get("state") as string
    const lga = formData.get("lga") as string
    const teaching_levels = JSON.parse(formData.get("teaching_levels") as string || "[]")
    const subjects = JSON.parse(formData.get("subjects") as string || "[]")
    const years_experience = parseInt(formData.get("years_experience") as string || "0")
    const trcn_number = formData.get("trcn_number") as string || null
    const trcn_status = formData.get("trcn_status") as string
    const preferred_states = JSON.parse(formData.get("preferred_states") as string || "[]")
    const willing_to_relocate = formData.get("willing_to_relocate") === "true"
    const accommodation_needed = formData.get("accommodation_needed") === "true"
    const availability = formData.get("availability") as string
    const salary_min = parseInt(formData.get("salary_min") as string || "0") || null
    const bio = formData.get("bio") as string || null
    const cv_file = formData.get("cv_file") as File | null
    const photo_file = formData.get("photo_file") as File | null

    // Full onboarding cache built up across all steps — written to onboarding_data after user creation
    let onboardingCache: Record<string, unknown> = {}
    try {
      const raw = formData.get("onboarding_cache") as string | null
      if (raw) onboardingCache = JSON.parse(raw)
    } catch {
      console.warn("Failed to parse onboarding_cache")
    }
    // ── Validation ──────────────────────────────────────────
    if (!email || !password || !full_name || !phone || !state || !lga) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
 
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }
 
    // ── Create Supabase auth user ───────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "teacher",
          full_name,
        },
      },
    })
 
    if (authError) {
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        )
      }
      throw authError
    }
 
    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }
 
    const userId = authData.user.id
 
    // ── Upload photo ────────────────────────────────────────
    let photo_url: string | null = null
    if (photo_file && photo_file.size > 0) {
      const photoExt = photo_file.name.split(".").pop()
      const photoPath = `${userId}/avatar.${photoExt}`
      const photoBuffer = await photo_file.arrayBuffer()
 
      const { error: photoError } = await supabase.storage
        .from("avatars")
        .upload(photoPath, photoBuffer, {
          contentType: photo_file.type,
          upsert: true,
        })
 
      if (!photoError) {
        const { data: publicUrl } = supabase.storage
          .from("avatars")
          .getPublicUrl(photoPath)
        photo_url = publicUrl.publicUrl
      }
    }
 
    // ── Upload CV ───────────────────────────────────────────
    let cv_url: string | null = null
    if (cv_file && cv_file.size > 0) {
      const cvPath = `${userId}/cv.pdf`
      const cvBuffer = await cv_file.arrayBuffer()
 
      const { error: cvError } = await supabase.storage
        .from("cvs")
        .upload(cvPath, cvBuffer, {
          contentType: "application/pdf",
          upsert: true,
        })
 
      if (!cvError) {
        const { data: signedUrl } = await supabase.storage
          .from("cvs")
          .createSignedUrl(cvPath, 60 * 60 * 24 * 365) // 1 year
 
        cv_url = signedUrl?.signedUrl || null
      }
    }
 
    // ── Create teacher profile ──────────────────────────────
    const { error: profileError } = await supabase
      .from("teacher_profiles")
      .insert({
        user_id: userId,
        full_name,
        phone,
        state,
        lga,
        teaching_levels,
        subjects,
        years_experience,
        trcn_number: trcn_number || null,
        trcn_status,
        preferred_states,
        willing_to_relocate,
        accommodation_needed,
        availability,
        salary_min: salary_min ?? null,
        bio,
        photo_url,
        cv_url,
        is_visible: true,
      })
 
    if (profileError) {
      // Cleanup: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId)
      throw profileError
    }

    // ── Write onboarding_data to Supabase ───────────────────
    // Small delay lets the profiles trigger fire before we insert with user_id FK
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Insert the full rich data cached locally across all registration steps
    if (Object.keys(onboardingCache).length > 0) {
      try {
        await supabase
          .from("onboarding_data")
          .upsert(
            {
              user_id: userId,
              temp_id: null,
              // Basic
              cv_name:     onboardingCache.cv_name     ?? null,
              cv_email:    onboardingCache.cv_email    ?? null,
              cv_phone:    onboardingCache.cv_phone    ?? null,
              cv_location: onboardingCache.cv_location ?? null,
              cv_summary:  onboardingCache.cv_summary  ?? null,
              // Professional
              cv_roles:                    onboardingCache.cv_roles                    ?? null,
              cv_skills:                   onboardingCache.cv_skills                   ?? null,
              cv_experience:               onboardingCache.cv_experience               ?? null,
              years_of_teaching_experience: onboardingCache.years_of_teaching_experience ?? null,
              experience_level:            onboardingCache.experience_level            ?? null,
              // Work & Education
              cv_work_experience:          onboardingCache.cv_work_experience          ?? null,
              cv_education:                onboardingCache.cv_education                ?? null,
              cv_certifications:           onboardingCache.cv_certifications           ?? null,
              cv_awards:                   onboardingCache.cv_awards                   ?? null,
              cv_languages:                onboardingCache.cv_languages                ?? null,
              cv_volunteer_work:           onboardingCache.cv_volunteer_work           ?? null,
              // Academic & Personal
              cv_publications:             onboardingCache.cv_publications             ?? null,
              cv_accomplishments:          onboardingCache.cv_accomplishments          ?? null,
              cv_interests:                onboardingCache.cv_interests                ?? null,
              // Teacher-specific
              teaching_levels:             onboardingCache.teaching_levels             ?? null,
              subjects_taught:             onboardingCache.subjects_taught             ?? null,
              curriculum_experience:       onboardingCache.curriculum_experience       ?? null,
              teaching_style:              onboardingCache.teaching_style              ?? null,
              classroom_management_skills: onboardingCache.classroom_management_skills ?? null,
              lesson_delivery_mode:        onboardingCache.lesson_delivery_mode        ?? null,
              // Credentials
              trcn_number: onboardingCache.trcn_number ?? null,
              trcn_status: onboardingCache.trcn_status ?? null,
              // Preferences
              preferred_locations:  onboardingCache.preferred_locations  ?? null,
              preferred_states:     onboardingCache.preferred_states     ?? null,
              willing_to_relocate:  onboardingCache.willing_to_relocate  ?? null,
              accommodation_needed: onboardingCache.accommodation_needed ?? null,
              availability:         onboardingCache.availability         ?? null,
              job_type:             onboardingCache.job_type             ?? null,
              sector:               onboardingCache.sector               ?? null,
              // Salary
              salary_min: onboardingCache.salary_min ?? null,
              // Social
              cv_linkedin: onboardingCache.cv_linkedin ?? null,
              // Platform
              talent_pool: onboardingCache.talent_pool ?? false,
            },
            { onConflict: "user_id" }
          )
      } catch (onboardingErr) {
        // Non-fatal — user account and profile are already created
        console.error("onboarding_data write failed:", onboardingErr)
      }
    }
 
    return NextResponse.json({
      success: true,
      user: { id: userId, email, role: "teacher" },
      redirectTo: "/dashboard/teacher",
    })
  } catch (err) {
    console.error("Teacher register error:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again.",
      },
      { status: 500 }
    )
  }
}