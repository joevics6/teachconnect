// ============================================================
// lib/countries.ts
// A registry, not a two-way branch. Adding a third country later
// means adding one more entry here — StateLgaSelect and anything
// else that reads from this registry needs zero changes. This is
// the direct answer to "the idea of starting with UAE is so we can
// easily add other countries": the extensibility lives here, not in
// scattered isUAE-style conditionals.
// ============================================================

import { NIGERIAN_LGAS, NIGERIAN_STATES } from "@/lib/nigerian-locations"
import { UAE_AREAS, UAE_EMIRATES } from "@/lib/uae-locations"

export interface CountryConfig {
  code: string // ISO 3166-1 alpha-2, e.g. "NG", "AE"
  name: string // Display name, also the value stored in country columns
  // "State" / "Emirate" — for <label> text
  stateLabel: string
  // Lowercase form for placeholder text ("Select state") — stored
  // explicitly rather than derived via .toLowerCase(), because an
  // acronym like "LGA" reads wrong lowercased ("select lga") while a
  // normal word doesn't. Each country's config controls its own case.
  stateLabelLower: string
  areaLabel: string // "LGA" / "Area"
  areaLabelLower: string
  states: string[]
  areas: Record<string, string[]>
  // ISO 4217 currency code — not read anywhere yet (every
  // formatCurrency/formatSalaryRange call site still defaults to
  // NGN), but present so a future call site has a real value to pass
  // once jobs/schools actually vary by country.
  currency: string
  // Live/bookable now vs visible-but-not-yet-open. UAE ships with
  // this false — the location picker and registration data model
  // fully support it, but pricing/payments (Paystack is NGN-only)
  // aren't built yet, so it shouldn't be a real registration option
  // until that's ready. Flip to true when it is; nothing else about
  // the registry needs to change.
  enabled: boolean
}

export const COUNTRIES: Record<string, CountryConfig> = {
  Nigeria: {
    code: "NG",
    name: "Nigeria",
    stateLabel: "State",
    stateLabelLower: "state",
    areaLabel: "LGA",
    areaLabelLower: "LGA",
    states: NIGERIAN_STATES,
    areas: NIGERIAN_LGAS,
    currency: "NGN",
    enabled: true,
  },
  UAE: {
    code: "AE",
    name: "United Arab Emirates",
    stateLabel: "Emirate",
    stateLabelLower: "emirate",
    areaLabel: "Area",
    areaLabelLower: "area",
    states: UAE_EMIRATES,
    areas: UAE_AREAS,
    currency: "AED",
    enabled: false,
  },
}

export const COUNTRY_LIST = Object.keys(COUNTRIES)
export const ENABLED_COUNTRY_LIST = COUNTRY_LIST.filter((c) => COUNTRIES[c].enabled)

export function getCountryConfig(country: string | undefined | null): CountryConfig {
  return (country && COUNTRIES[country]) || COUNTRIES.Nigeria
}
