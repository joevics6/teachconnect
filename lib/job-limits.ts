// ============================================================
// lib/job-limits.ts
// Shared plan-limit check for job postings. Used both when a job
// is created directly as active, and when a draft (e.g. a
// duplicated job) is switched to active — both are ways a job
// becomes a live, counted posting, so both need the same gate.
//
// Concurrent active-job caps (see lib/pricing.ts for the numbers):
// - Free:     1 active job at a time
// - Standard: 1 job per purchase (each purchase is its own
//             subscription row — the window is "since that row's
//             starts_at", since it's a single-use posting credit,
//             not a concurrent cap)
// - Monthly:  5 active jobs at a time (concurrent, resets as jobs
//             close — not a purchase-window credit)
// - Term:     unlimited
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { FREE_PLAN_JOB_LIMIT, PLANS } from "@/lib/pricing"

export async function checkJobPostingLimit(supabase: SupabaseClient, schoolId: string) {
  const { data: subRows } = await supabase
    .from("subscriptions")
    .select("id, plan_type, starts_at")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
  const subscription = (subRows ?? [])[0] ?? null
  const planType = subscription?.plan_type || "free"

  if (planType === "term") return { allowed: true as const }

  if (planType === "monthly") {
    const limit = PLANS.monthly.job_limit as number
    const { count: activeJobs } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "active")

    if ((activeJobs || 0) >= limit) {
      return {
        allowed: false as const,
        error: `You've reached your Monthly plan's limit of ${limit} active job postings. Close one, or upgrade to the Term Plan for unlimited postings.`,
      }
    }
    return { allowed: true as const }
  }

  // free / standard: single-use credit, windowed
  const windowStart =
    planType === "free"
      ? new Date(0).toISOString() // "1 active at a time" — no time window, just a concurrent cap
      : subscription?.starts_at || new Date(0).toISOString()

  const { count: jobsPosted } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("status", "active")
    .gte("created_at", windowStart)

  const limit = planType === "free" ? FREE_PLAN_JOB_LIMIT : (PLANS.standard.job_limit as number)

  if ((jobsPosted || 0) >= limit) {
    return {
      allowed: false as const,
      error:
        planType === "standard"
          ? "You've used the job posting included in your Single Post plan. Purchase another posting, or upgrade to Monthly or the Term Plan for more."
          : "Free accounts can have 1 active job posting at a time. Close your current job, or upgrade to post more right away.",
    }
  }

  return { allowed: true as const }
}
