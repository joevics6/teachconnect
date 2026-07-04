// ============================================================
// app/api/school/profile/route.ts
// GET — own school profile (authenticated school)
// ============================================================

// Create at: app/api/school/profile/route.ts


import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: schoolRows, error } = await supabase
      .from("school_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    const school = (schoolRows ?? [])[0] ?? null

    if (error || !school) {
      return NextResponse.json(
        { error: "School profile not found" },
        { status: 404 }
      )
    }

    // Active jobs
    const { data: activeJobs } = await supabase
      .from("jobs")
      .select(
        `id, title, subject, teaching_levels, employment_type,
         salary_min, salary_max, accommodation_offered,
         quiz_enabled, deadline, created_at`
      )
      .eq("school_id", school.id)
      .eq("status", "active")
      .gte("deadline", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false })

    const { count: totalJobs } = await supabase
      .from("jobs")
      .select("id", { count: "exact" })
      .eq("school_id", school.id)

    const { count: activeJobCount } = await supabase
      .from("jobs")
      .select("id", { count: "exact" })
      .eq("school_id", school.id)
      .eq("status", "active")

    return NextResponse.json({
      school,
      active_jobs: activeJobs || [],
      stats: {
        total_jobs: totalJobs || 0,
        active_jobs: activeJobCount || 0,
        total_hired: 0,
      },
      viewer_role: "school",
    })
  } catch (err) {
    console.error("GET own school profile error:", err)
    return NextResponse.json(
      { error: "Failed to fetch school profile" },
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

    const allowedFields = [
      "school_name", "school_type", "school_levels",
      "state", "lga", "address", "website",
      "contact_name", "contact_role", "contact_phone",
      "contact_phone_alt",
    ]

    const updates: Record<string, unknown> = {}
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) updates[field] = body[field]
    })

    const { data, error } = await supabase
      .from("school_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()

    if (error) throw error

    return NextResponse.json({ school: (data ?? [])[0] ?? null })
  } catch (err) {
    console.error("PATCH school profile error:", err)
    return NextResponse.json(
      { error: "Failed to update school profile" },
      { status: 500 }
    )
  }
}