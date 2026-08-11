// ============================================================
// lib/school-plan.ts
// Shared helper for looking up a school's active plan type.
// Used to gate premium-only fields (quiz screening, private
// postings, featured listings, CV downloads) consistently.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import type { PlanType } from "@/lib/pricing"

export type { PlanType }

export async function getActivePlanType(supabase: SupabaseClient, schoolId: string): Promise<PlanType> {
  const { data: subRows } = await supabase
    .from("subscriptions")
    .select("plan_type")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
  return ((subRows ?? [])[0]?.plan_type as PlanType) || "free"
}

/** Private postings, applicant notes/alerts, CV/TRCN visibility on talent search — any paid plan. */
export function isPremiumPlan(planType: PlanType): boolean {
  return planType === "standard" || planType === "monthly" || planType === "term"
}

/** Talent-page browsing and Call/WhatsApp contact buttons are Monthly/Term only — NOT the single-post plan. */
export function hasTalentAccess(planType: PlanType): boolean {
  return planType === "monthly" || planType === "term"
}
