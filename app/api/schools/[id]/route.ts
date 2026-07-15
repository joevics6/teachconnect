import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch school profile
    const { data: schoolRows, error } = await supabase
      .from("school_profiles")
      .select(
        `id, school_name, school_type, school_levels,
         state, lga, address, website,
         contact_name, contact_role, contact_phone,
         logo_url, is_verified, created_at,
         about, curriculum, student_population,
         salary_range_min, salary_range_max, benefits,
         school_category`
      )
      .eq("id", id)
      .limit(1)

    const school = (schoolRows ?? [])[0] ?? null

    if (error || !school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // Fetch active jobs for this school
    const { data: jobs } = await supabase
      .from("jobs")
      .select(
        `id, title, subject, teaching_levels, employment_type,
         salary_min, salary_max, accommodation_offered,
         quiz_enabled, deadline, created_at`
      )
      .eq("school_id", id)
      .eq("status", "active")
      .gt("deadline", new Date().toISOString())
      .order("created_at", { ascending: false })

    // Stats
    const [{ count: totalJobs }, { count: activeJobs }] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("school_id", id),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("school_id", id).eq("status", "active"),
    ])

    return NextResponse.json({
      school,
      active_jobs: jobs ?? [],
      stats: {
        total_jobs:  totalJobs  ?? 0,
        active_jobs: activeJobs ?? 0,
        total_hired: 0,
      },
    })
  } catch (err) {
    console.error("GET public school profile error:", err)
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 })
  }
}
