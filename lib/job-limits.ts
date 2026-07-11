// ============================================================
// lib/job-limits.ts
// Shared plan-limit check for job postings. Used both when a job
// is created directly as active, and when a draft (e.g. a
// duplicated job) is switched to active — both are ways a job
// becomes a live, counted posting, so both need the same gate.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"

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

  const { count: jobsPosted } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("status", "active")
    .gte("created_at", subscription?.starts_at || new Date(0).toISOString())

  if ((jobsPosted || 0) >= 1) {
    return {
      allowed: false as const,
      error:
        planType === "standard"
          ? "You've used the job posting included in your Standard plan. Purchase another posting or upgrade to the Term Plan for unlimited postings."
          : "Free accounts can post 1 job. Upgrade to Standard or the Term Plan to post more.",
    }
  }

  return { allowed: true as const }
}
