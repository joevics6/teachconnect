// ============================================================
// lib/landing.ts
// Location landing pages (/jobs/in/[state], e.g. /jobs/in/lagos).
// A location only gets a page once it has MORE than 5 live jobs —
// below that the page would be thin and just compete with /jobs.
// ============================================================

import { NIGERIAN_STATES } from "@/lib/constants"
import { slugify } from "@/lib/slug"

/** A state's page exists when it has strictly more than 5 live jobs. */
export const MIN_JOBS_FOR_LANDING = 6

// FCT is searched for as "Abuja"; every other state uses its own name.
const SLUG_OVERRIDES: Record<string, string> = { FCT: "abuja" }
const DISPLAY_OVERRIDES: Record<string, string> = { FCT: "Abuja (FCT)" }

export const stateSlug = (state: string) => SLUG_OVERRIDES[state] ?? slugify(state)
export const stateDisplayName = (state: string) => DISPLAY_OVERRIDES[state] ?? state
export const stateFromSlug = (slug: string) =>
  (NIGERIAN_STATES as readonly string[]).find((s) => stateSlug(s) === slug) ?? null
export const landingPath = (state: string) => `/jobs/in/${stateSlug(state)}`
