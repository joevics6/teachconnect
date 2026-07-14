// ============================================================
// lib/school-plan.ts
// Shared helper for looking up a school's active plan type.
// Used to gate premium-only fields (quiz screening, private
// postings, featured listings, CV downloads) consistently.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export type PlanType = "free" | "standard" | "term"

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

export function isPremiumPlan(planType: PlanType): boolean {
  return planType === "standard" || planType === "term"
}
