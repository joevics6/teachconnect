// ============================================================
// lib/pricing.ts
//
// SINGLE SOURCE OF TRUTH for every Naira amount ClassHire charges.
// Every payment route, the pricing page, and the subscription
// dashboard page import from here — nowhere else defines a price.
//
// Naira is the canonical unit; amount_kobo (Paystack's unit) is
// derived, never hand-typed, so the two can never drift apart.
// ============================================================

export type PlanType = "free" | "standard" | "monthly" | "term"

interface PlanDetails {
  id: Exclude<PlanType, "free">
  name: string
  price: number // Naira
  amount_kobo: number
  duration_days: number
  period_label: string
  /** Concurrent active-job cap. "unlimited" for Term. */
  job_limit: number | "unlimited"
  description: string
  features: string[]
  /** Shown as a struck-through limitation on the pricing page. */
  limitations?: string[]
}

export const PLANS: Record<Exclude<PlanType, "free">, PlanDetails> = {
  standard: {
    id: "standard",
    name: "Single Post",
    price: 12500,
    amount_kobo: 1250000,
    duration_days: 30,
    period_label: "per posting",
    job_limit: 1,
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
    price: 25000,
    amount_kobo: 2500000,
    duration_days: 30,
    period_label: "per month",
    job_limit: 5,
    description: "For schools hiring regularly.",
    features: [
      "5 active job postings at a time",
      "Full quiz screening (all 3 modes)",
      "Ranked shortlist + full applicant pipeline",
      "Download applicant CVs",
      "Private posting option",
      "Unlimited talent page browsing",
      "Direct messaging to teachers",
      "Analytics dashboard",
    ],
  },
  term: {
    id: "term",
    name: "Term Plan",
    price: 65000,
    amount_kobo: 6500000,
    duration_days: 91,
    period_label: "per term",
    job_limit: "unlimited",
    description: "Best value for schools hiring every term.",
    features: [
      "Unlimited job postings for one term",
      "Everything in Monthly",
      "1–2 featured listing credits included",
      "Verified school badge",
      "Priority support",
    ],
  },
}

export const ADDONS = {
  featured: {
    id: "featured",
    name: "Featured Listing",
    price: 9000,
    amount_kobo: 900000,
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

/** Free plan's concurrent active-job cap. */
export const FREE_PLAN_JOB_LIMIT = 1

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

export function getAddonAmountKobo(addonType: string): number | null {
  return ADDONS[addonType as AddonType]?.amount_kobo ?? null
}
