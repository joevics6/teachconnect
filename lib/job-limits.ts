// ============================================================
// lib/job-limits.ts
// Shared plan-limit check for job postings. Used both when a job
// is created directly as active, and when a draft (e.g. a
// duplicated job) is switched to active — both are ways a job
// becomes a live, counted posting, so both need the same gate.
//
// A school's posting capacity is the SUM of every currently-valid
// plan it holds, not just its "best" one — a Single Post credit
// alongside a Monthly subscription gives 5 + 1 = 6 concurrent slots,
// not just 5. See lib/school-plan.ts for why nothing ever deactivates
// an old plan just because a new one was bought: each plan simply
// contributes its own capacity for as long as it's valid.
//
// (see lib/pricing.ts for the numbers)
// - Free:     3 job posts per calendar month — resets on the 1st.
//             Only applies when NO paid plan is currently valid at
//             all. Counts jobs that have been active or closed since
//             the start of the current month (not drafts).
// - Standard: each currently-valid Single Post credit adds +1 to the
//             concurrent-active cap (see below) — buy two, get +2.
// - Monthly:  5 concurrent active jobs.
// - Term:     10 concurrent active jobs.
// A school with any currently-valid Monthly/Term/Standard plan is
// capped by CONCURRENT active (+ pending approval) jobs — closing one
// frees a slot immediately. Only pure Free has no paid plan at all
// uses the per-calendar-month cap instead.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { FREE_PLAN_JOB_LIMIT, PLANS } from "@/lib/pricing"
import { getValidSubscriptions } from "@/lib/school-plan"

export async function checkJobPostingLimit(supabase: SupabaseClient, schoolId: string) {
  const validSubs = await getValidSubscriptions(supabase, schoolId)

  const hasTerm = validSubs.some((s) => s.plan_type === "term")
  const hasMonthly = validSubs.some((s) => s.plan_type === "monthly")
  const standardCredits = validSubs.filter((s) => s.plan_type === "standard").length

  const concurrentCap =
    (hasTerm ? PLANS.term.job_limit : hasMonthly ? PLANS.monthly.job_limit : 0) +
    standardCredits * PLANS.standard.job_limit

  if (concurrentCap > 0) {
    const { count: activeJobs } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .in("status", ["active", "pending_approval"])

    if ((activeJobs || 0) >= concurrentCap) {
      const parts: string[] = []
      if (hasTerm) parts.push("Term Plan (10)")
      else if (hasMonthly) parts.push("Monthly plan (5)")
      if (standardCredits > 0) parts.push(`${standardCredits} Single Post credit${standardCredits > 1 ? "s" : ""} (+${standardCredits})`)
      return {
        allowed: false as const,
        error: `You've reached your posting limit of ${concurrentCap} concurrent job${concurrentCap !== 1 ? "s" : ""} (${parts.join(" + ")}). Close one, buy another Single Post, or upgrade your plan.`,
      }
    }
    return { allowed: true as const }
  }

  // No currently-valid paid plan at all — Free tier's per-calendar-month cap.
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const { count: jobsThisMonth } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .in("status", ["active", "closed", "pending_approval"])
    .gte("created_at", monthStart)

  if ((jobsThisMonth || 0) >= FREE_PLAN_JOB_LIMIT) {
    return {
      allowed: false as const,
      error: `Free accounts can post ${FREE_PLAN_JOB_LIMIT} jobs per month. Upgrade to Single Post, Monthly, or Term to post more now, or wait until next month.`,
    }
  }
  return { allowed: true as const }
}
