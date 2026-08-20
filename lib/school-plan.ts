// ============================================================
// lib/school-plan.ts
// Shared helper for looking up a school's active plan(s).
//
// A school can hold multiple concurrently-valid subscriptions at
// once — e.g. a Single Post credit alongside a Monthly subscription,
// or (mid-upgrade) both a Monthly and a Term row until the Monthly
// one naturally expires. Nothing deactivates an old subscription just
// because a new one was purchased (see activateSubscriptionFromPayment
// in lib/paystack.ts) — each plan simply runs its own paid-for
// duration, so upgrading never costs you time or benefits you already
// paid for. "Currently valid" means is_active AND not yet expired.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import type { PlanType } from "@/lib/pricing"

export type { PlanType }

const PLAN_RANK: Record<PlanType, number> = { free: 0, standard: 1, monthly: 2, term: 3 }

/** Every currently-valid (active, not expired) subscription row for this school. */
export async function getValidSubscriptions(supabase: SupabaseClient, schoolId: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("id, plan_type, starts_at, expires_at, featured_listings_included, featured_listings_used")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
  return data ?? []
}

/**
 * Finds a currently-valid subscription with an unused bundled featured-
 * listing credit (Monthly includes 1, Term includes 3). A school can
 * hold several valid subscriptions at once, so this checks all of them
 * rather than assuming "the most recent one" — with multiple plans, the
 * most recent might have none left while an older-but-still-valid one
 * still does.
 */
export async function findSubscriptionWithFeaturedCredit(supabase: SupabaseClient, schoolId: string) {
  const valid = await getValidSubscriptions(supabase, schoolId)
  return valid.find((s) => (s.featured_listings_included || 0) > (s.featured_listings_used || 0)) || null
}

/**
 * The single highest-tier plan currently valid — used for feature
 * gating (isPremiumPlan/hasTalentAccess below), where one "best" plan
 * answers the question. Job posting CAPACITY is additive across every
 * valid plan, not just the best one — see lib/job-limits.ts, which
 * doesn't use this function for that reason.
 */
export async function getActivePlanType(supabase: SupabaseClient, schoolId: string): Promise<PlanType> {
  const valid = await getValidSubscriptions(supabase, schoolId)
  if (valid.length === 0) return "free"
  return valid.reduce(
    (best, s) => (PLAN_RANK[s.plan_type as PlanType] > PLAN_RANK[best] ? (s.plan_type as PlanType) : best),
    "free" as PlanType
  )
}

/** Private postings, applicant notes/alerts, CV/TRCN visibility on talent search — any paid plan. */
export function isPremiumPlan(planType: PlanType): boolean {
  return planType === "standard" || planType === "monthly" || planType === "term"
}

/** Talent-page browsing and Call/WhatsApp contact buttons are Monthly/Term only — NOT the single-post plan. */
export function hasTalentAccess(planType: PlanType): boolean {
  return planType === "monthly" || planType === "term"
}

/** External Application (email/WhatsApp/website in place of the built-in apply flow) — Monthly/Term only, same tier as Talent access. */
export function hasExternalApplyAccess(planType: PlanType): boolean {
  return planType === "monthly" || planType === "term"
}
