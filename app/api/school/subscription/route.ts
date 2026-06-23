// ============================================================
// app/api/school/subscription/route.ts
// GET /api/school/subscription — fetch current subscription + usage
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

    const { data: school } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // Get active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("school_id", school.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // Get all subscription history
    const { data: history } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("school_id", school.id)
      .order("created_at", { ascending: false })

    // Get usage stats
    const { count: jobsPosted } = await supabase
      .from("jobs")
      .select("id", { count: "exact" })
      .eq("school_id", school.id)
      .gte(
        "created_at",
        subscription?.starts_at || new Date(0).toISOString()
      )

    const { count: totalApplicants } = await supabase
      .from("applications")
      .select("id", { count: "exact" })
      .in(
        "job_id",
        (
          await supabase
            .from("jobs")
            .select("id")
            .eq("school_id", school.id)
        ).data?.map((j) => j.id) || []
      )

    const { count: activeJobs } = await supabase
      .from("jobs")
      .select("id", { count: "exact" })
      .eq("school_id", school.id)
      .eq("status", "active")

    const planType = subscription?.plan_type || "free"

    const usage = [
      {
        label: "Jobs Posted",
        used: jobsPosted || 0,
        limit:
          planType === "term" ? -1 : planType === "standard" ? 1 : 1,
      },
      {
        label: "Active Jobs",
        used: activeJobs || 0,
        limit: planType === "term" ? -1 : null,
      },
      {
        label: "Total Applicants",
        used: totalApplicants || 0,
        limit: null,
      },
    ]

    return NextResponse.json({
      subscription,
      usage,
      history: history || [],
    })
  } catch (err) {
    console.error("GET subscription error:", err)
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    )
  }
}