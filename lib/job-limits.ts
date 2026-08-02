// ============================================================
// lib/job-limits.ts
// Shared plan-limit check for job postings. Used both when a job
// is created directly as active, and when a draft (e.g. a
// duplicated job) is switched to active — both are ways a job
// becomes a live, counted posting, so both need the same gate.
//
// (see lib/pricing.ts for the numbers)
// - Free:     3 job posts total, EVER — a lifetime cap, not a
//             concurrent one. Closing a job doesn't free up a slot;
//             upgrading is the only way to post more. Deliberately
//             tight at launch to push conversion once a school is
//             actually engaged enough to have posted 3 jobs.
// - Standard: 1 job per purchase (each purchase is its own
//             subscription row — the window is "since that row's
//             starts_at", since it's a single-use posting credit)
// - Monthly:  5 active jobs at a time (concurrent, resets as jobs
//             close — not a purchase-window credit)
// - Term:     10 active jobs at a time (concurrent, same as Monthly
//             but a higher cap)
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

  if (planType === "monthly" || planType === "term") {
    const limit = PLANS[planType as "monthly" | "term"].job_limit
    const { count: activeJobs } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "active")

    if ((activeJobs || 0) >= limit) {
      return {
        allowed: false as const,
        error:
          planType === "monthly"
            ? `You've reached your Monthly plan's limit of ${limit} active job postings. Close one, or upgrade to the Term Plan for more.`
            : `You've reached your Term Plan's limit of ${limit} active job postings. Close one to post another.`,
      }
    }
    return { allowed: true as const }
  }

  if (planType === "free") {
    // Lifetime cap — counts ALL jobs ever created (any status), not just
    // active ones, so closing a job doesn't free up a slot.
    const { count: jobsEverPosted } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)

    if ((jobsEverPosted || 0) >= FREE_PLAN_JOB_LIMIT) {
      return {
        allowed: false as const,
        error: `Free accounts can post ${FREE_PLAN_JOB_LIMIT} jobs total. Upgrade to Single Post, Monthly, or Term to post more.`,
      }
    }
    return { allowed: true as const }
  }

  // standard: single-use credit, windowed to this specific purchase
  const windowStart = subscription?.starts_at || new Date(0).toISOString()
  const { count: jobsPosted } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("status", "active")
    .gte("created_at", windowStart)

  if ((jobsPosted || 0) >= PLANS.standard.job_limit) {
    return {
      allowed: false as const,
      error: "You've used the job posting included in your Single Post plan. Purchase another posting, or upgrade to Monthly or the Term Plan for more.",
    }
  }

  return { allowed: true as const }
}
