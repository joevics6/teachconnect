// ============================================================
// lib/pricing.ts
//
// SINGLE SOURCE OF TRUTH for every Naira amount ClassHire charges.
// Every payment route, the pricing page, and the subscription
// dashboard page import from here — nowhere else defines a price.
//
// Naira is the canonical unit; amount_kobo (Paystack's unit) is
// derived, never hand-typed, so the two can never drift apart.
//
// LAUNCH PRICING (intentionally low to seed adoption — see plan
// notes below for the reasoning; expect to revisit upward once
// there's traction).
// ============================================================

export type PlanType = "free" | "standard" | "monthly" | "term"

interface PlanDetails {
  id: Exclude<PlanType, "free">
  name: string
  price: number // Naira
  amount_kobo: number
  duration_days: number
  period_label: string
  /** Concurrent active-job cap. */
  job_limit: number
  /** Bundled Featured Listing credits included with this plan (0 = none — pay per use at the paid-plan rate, see ADDONS.featured). */
  featured_credits: number
  description: string
  features: string[]
  /** Shown as a struck-through limitation on the pricing page. */
  limitations?: string[]
}

export const PLANS: Record<Exclude<PlanType, "free">, PlanDetails> = {
  standard: {
    id: "standard",
    name: "Single Post",
    price: 4999,
    amount_kobo: 499900,
    duration_days: 30,
    period_label: "per posting",
    job_limit: 1,
    featured_credits: 0,
    description: "Perfect for schools that hire occasionally.",
    features: [
      "Single job posting (30 days)",
      "Full quiz screening (all 3 modes)",
      "Ranked shortlist + full applicant pipeline",
      "Download applicant CVs",
      "Private posting option",
      "Applicant notes + email alerts",
    ],
    limitations: ["No talent page access", "No direct messaging"],
  },
  monthly: {
    id: "monthly",
    name: "Monthly",
    price: 15000,
    amount_kobo: 1500000,
    duration_days: 30,
    period_label: "per month",
    job_limit: 5,
    featured_credits: 1,
    description: "For schools hiring regularly.",
    features: [
      "5 active job postings at a time",
      "Full quiz screening (all 3 modes)",
      "Ranked shortlist + full applicant pipeline",
      "Download applicant CVs",
      "Private posting option",
      "1 featured listing included",
      "Unlimited talent page browsing",
      "Direct messaging to teachers",
      "Analytics dashboard",
    ],
  },
  term: {
    id: "term",
    name: "Term Plan",
    price: 50000,
    amount_kobo: 5000000,
    duration_days: 91,
    period_label: "per term",
    job_limit: 10,
    featured_credits: 3,
    description: "Best value for schools hiring every term.",
    features: [
      "10 active job postings at a time",
      "Everything in Monthly",
      "3 featured listing credits included",
      "Verified school badge",
      "Priority support",
    ],
  },
}

export const ADDONS = {
  featured: {
    id: "featured",
    name: "Featured Listing",
    // Featured pricing depends on whether the school is on a paid plan —
    // see getFeaturedAddonPrice/getFeaturedAddonAmountKobo below. Free
    // schools pay more since they aren't otherwise paying anything.
    price_free: 7000,
    price_paid: 4500,
    amount_kobo_free: 700000,
    amount_kobo_paid: 450000,
    description: "Pin your job to the top of search results for its full duration.",
  },
  extended: {
    id: "extended",
    name: "15-Day Extension",
    price: 4500,
    amount_kobo: 450000,
    description: "Push a job's deadline out by another 15 days.",
  },
} as const

export type AddonType = keyof typeof ADDONS

/** Free plan's job-posting cap — LIFETIME total (any status), not concurrent. Upgrading is the only way to post more. */
export const FREE_PLAN_JOB_LIMIT = 3

/** How many teacher profiles a Free-plan school can view per talent search. */
export const FREE_PLAN_TALENT_LIMIT = 5

export function getPlanAmountKobo(planId: string): number | null {
  return PLANS[planId as Exclude<PlanType, "free">]?.amount_kobo ?? null
}

export function getPlanPriceNaira(planId: string): number | null {
  return PLANS[planId as Exclude<PlanType, "free">]?.price ?? null
}

export function getPlanDurationDays(planId: string): number | null {
  return PLANS[planId as Exclude<PlanType, "free">]?.duration_days ?? null
}

export function getPlanFeaturedCredits(planId: string): number {
  return PLANS[planId as Exclude<PlanType, "free">]?.featured_credits ?? 0
}

/** Featured Listing price (Naira) — cheaper on any paid plan than on Free. */
export function getFeaturedAddonPrice(isPaidPlan: boolean): number {
  return isPaidPlan ? ADDONS.featured.price_paid : ADDONS.featured.price_free
}

export function getFeaturedAddonAmountKobo(isPaidPlan: boolean): number {
  return isPaidPlan ? ADDONS.featured.amount_kobo_paid : ADDONS.featured.amount_kobo_free
}

/** For add-ons priced the same regardless of plan (currently just Extension). */
export function getAddonAmountKobo(addonType: string): number | null {
  if (addonType === "extended") return ADDONS.extended.amount_kobo
  return null // "featured" is plan-dependent — use getFeaturedAddonAmountKobo instead
}
