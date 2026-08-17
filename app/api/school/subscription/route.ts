// ============================================================
// app/api/school/subscription/route.ts
// GET /api/school/subscription — fetch current subscription(s) + usage
//
// A school can hold multiple concurrently-valid plans (see
// lib/school-plan.ts) — this returns all of them, plus a single
// "primary" (highest-tier) one for simple UI display, and the
// combined job-posting capacity across all of them.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { FREE_PLAN_JOB_LIMIT, PLANS } from "@/lib/pricing"
import { getValidSubscriptions, getActivePlanType } from "@/lib/school-plan"

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

    // Every currently-valid plan (active + not expired) — a school can
    // hold more than one at once (e.g. Monthly + a Single Post credit).
    const validSubs = await getValidSubscriptions(supabase, school.id)
    const planType = await getActivePlanType(supabase, school.id)

    // "subscription" (singular) is kept for backward compatibility with
    // anything still reading it — the highest-tier currently-valid plan,
    // same value getActivePlanType uses for feature gating.
    const { data: allRows } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("school_id", school.id)
      .order("created_at", { ascending: false })
    const subscription = (allRows ?? []).find((s) => s.plan_type === planType && validSubs.some((v) => v.id === s.id)) || null

    const hasTerm = validSubs.some((s) => s.plan_type === "term")
    const hasMonthly = validSubs.some((s) => s.plan_type === "monthly")
    const standardCredits = validSubs.filter((s) => s.plan_type === "standard").length
    const concurrentCap =
      (hasTerm ? PLANS.term.job_limit : hasMonthly ? PLANS.monthly.job_limit : 0) +
      standardCredits * PLANS.standard.job_limit

    const { count: activeJobs } = await supabase
      .from("jobs")
      .select("id", { count: "exact" })
      .eq("school_id", school.id)
      .in("status", ["active", "pending_approval"])

    const { data: allJobIds } = await supabase.from("jobs").select("id").eq("school_id", school.id)
    const { count: totalApplicants } = await supabase
      .from("applications")
      .select("id", { count: "exact" })
      .in("job_id", allJobIds?.map((j) => j.id) || [])

    let usage
    if (concurrentCap > 0) {
      const { count: jobsAllTime } = await supabase
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("school_id", school.id)

      usage = [
        { label: "Active Jobs", used: activeJobs || 0, limit: concurrentCap },
        { label: "Jobs Posted (all time)", used: jobsAllTime || 0, limit: null },
        { label: "Total Applicants", used: totalApplicants || 0, limit: null },
      ]
    } else {
      const now = new Date()
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
      const { count: jobsThisMonth } = await supabase
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("school_id", school.id)
        .in("status", ["active", "closed", "pending_approval"])
        .gte("created_at", monthStart)

      usage = [
        { label: "Jobs Posted This Month", used: jobsThisMonth || 0, limit: FREE_PLAN_JOB_LIMIT },
        { label: "Active Jobs", used: activeJobs || 0, limit: null },
        { label: "Total Applicants", used: totalApplicants || 0, limit: null },
      ]
    }

    return NextResponse.json({
      subscription,
      active_plans: validSubs,
      usage,
      history: allRows || [],
    })
  } catch (err) {
    console.error("GET subscription error:", err)
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    )
  }
}
