// ============================================================
// app/api/talent/route.ts
// GET /api/talent — browse teacher profiles (school facing)
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Auth check — only schools can browse talent
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userRecord?.role !== "school") {
      return NextResponse.json({ error: "Only schools can browse talent" }, { status: 403 })
    }

    // Check if school has premium subscription
    const { data: school } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    let isPremium = false
    if (school) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("id, plan_type, expires_at")
        .eq("school_id", school.id)
        .eq("is_active", true)
        .in("plan_type", ["standard", "term"])
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      isPremium = !!subscription
    }

    // Parse filters
    const keyword = searchParams.get("keyword") || ""
    const subject = searchParams.get("subject") || ""
    const level = searchParams.get("level") || ""
    const state = searchParams.get("state") || ""
    const trcn_only = searchParams.get("trcn_only") === "true"
    const relocate = searchParams.get("relocate") === "true"
    const accommodation = searchParams.get("accommodation") === "true"
    const experience_min = searchParams.get("experience_min") || ""

    // Build query
    let query = supabase
      .from("teacher_profiles")
      .select(
        `id, full_name, state, lga, subjects, teaching_levels,
         years_experience, trcn_status, willing_to_relocate,
         accommodation_needed, salary_min, salary_max, photo_url,
         bio, profile_completion, availability`,
        { count: "exact" }
      )
      .eq("is_visible", true)

    // Keyword search on name
    if (keyword) {
      query = query.ilike("full_name", `%${keyword}%`)
    }

    // Subject filter
    if (subject) {
      query = query.contains("subjects", [subject])
    }

    // Level filter
    if (level) {
      query = query.contains("teaching_levels", [level])
    }

    // State filter
    if (state) {
      query = query.eq("state", state)
    }

    // TRCN filter
    if (trcn_only) {
      query = query.eq("trcn_status", "registered")
    }

    // Relocate filter
    if (relocate) {
      query = query.eq("willing_to_relocate", true)
    }

    // Accommodation filter
    if (accommodation) {
      query = query.eq("accommodation_needed", true)
    }

    // Experience filter
    if (experience_min) {
      query = query.gte("years_experience", parseInt(experience_min))
    }

    // Order by profile completion desc
    query = query
      .order("profile_completion", { ascending: false })
      .order("created_at", { ascending: false })

    // For free tier, still fetch all for count but limit returned data
    const { data: teachers, count, error } = await query

    if (error) throw error

    return NextResponse.json({
      teachers: teachers || [],
      total: count || 0,
      is_premium: isPremium,
    })
  } catch (err) {
    console.error("GET /api/talent error:", err)
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    )
  }
}
