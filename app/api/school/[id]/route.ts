// ============================================================
// app/api/schools/[id]/route.ts
// GET — public school profile with active jobs + stats
// ============================================================

// Create at: app/api/schools/[id]/route.ts

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Fetch school profile
    const { data: school, error } = await supabase
      .from("school_profiles")
      .select(
        `id, school_name, school_type, school_levels, state, lga,
         address, website, contact_name, contact_role, contact_phone,
         logo_url, is_verified, created_at`
      )
      .eq("id", id)
      .single()

    if (error || !school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      )
    }

    // Fetch active jobs
    const { data: activeJobs } = await supabase
      .from("jobs")
      .select(
        `id, title, subject, teaching_levels, employment_type,
         salary_min, salary_max, accommodation_offered, quiz_enabled,
         deadline, created_at`
      )
      .eq("school_id", id)
      .eq("status", "active")
      .eq("is_private", false)
      .gte("deadline", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false })

    // Fetch stats
    const { count: totalJobs } = await supabase
      .from("jobs")
      .select("id", { count: "exact" })
      .eq("school_id", id)

    const { count: activeJobCount } = await supabase
      .from("jobs")
      .select("id", { count: "exact" })
      .eq("school_id", id)
      .eq("status", "active")

    const { count: totalHired } = await supabase
      .from("applications")
      .select("id", { count: "exact" })
      .eq("pipeline_stage", "hired")
      .in(
        "job_id",
        (
          await supabase
            .from("jobs")
            .select("id")
            .eq("school_id", id)
        ).data?.map((j) => j.id) || []
      )

    return NextResponse.json({
      school,
      active_jobs: activeJobs || [],
      stats: {
        total_jobs: totalJobs || 0,
        active_jobs: activeJobCount || 0,
        total_hired: totalHired || 0,
      },
    })
  } catch (err) {
    console.error("GET school profile error:", err)
    return NextResponse.json(
      { error: "Failed to fetch school" },
      { status: 500 }
    )
  }
}
