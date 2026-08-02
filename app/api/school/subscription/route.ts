// ============================================================
// app/api/school/subscription/route.ts
// GET /api/school/subscription — fetch current subscription + usage
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { FREE_PLAN_JOB_LIMIT, PLANS } from "@/lib/pricing"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: schoolRows } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const school = (schoolRows ?? [])[0] ?? null

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // Get active subscription
    const { data: subRows } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("school_id", school.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
    const subscription = (subRows ?? [])[0] ?? null

    // Get all subscription history
    const { data: history } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("school_id", school.id)
      .order("created_at", { ascending: false })

    const planType = subscription?.plan_type || "free"

    // Get usage stats — window matches the actual enforcement logic in
    // lib/job-limits.ts: Free is a concurrent cap (no time window),
    // Standard is scoped to the current purchase (starts_at), Monthly
    // is a concurrent cap, Term is unlimited.
    const jobsWindowStart =
      planType === "free" || planType === "monthly"
        ? new Date(0).toISOString()
        : subscription?.starts_at || new Date(0).toISOString()

    const { count: jobsPosted } = await supabase
      .from("jobs")
      .select("id", { count: "exact" })
      .eq("school_id", school.id)
      .eq("status", "active")
      .gte("created_at", jobsWindowStart)

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

    // Which count/limit pair is the actual binding constraint differs by
    // plan — see lib/job-limits.ts for the enforcement this mirrors:
    // Free = lifetime total (any status), Standard = active-since-purchase,
    // Monthly/Term = concurrent active cap.
    const usage =
      planType === "monthly" || planType === "term"
        ? [
            {
              label: "Active Jobs",
              used: activeJobs || 0,
              limit: planType === "monthly" ? (PLANS.monthly.job_limit as number) : (PLANS.term.job_limit as number),
            },
            { label: "Jobs Posted (all time)", used: jobsPosted || 0, limit: null },
            { label: "Total Applicants", used: totalApplicants || 0, limit: null },
          ]
        : [
            {
              label: "Jobs Posted",
              used: jobsPosted || 0,
              limit: planType === "standard" ? (PLANS.standard.job_limit as number) : FREE_PLAN_JOB_LIMIT,
            },
            { label: "Active Jobs", used: activeJobs || 0, limit: null },
            { label: "Total Applicants", used: totalApplicants || 0, limit: null },
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