"use client"

import { NIGERIAN_LGAS, NIGERIAN_STATES } from "@/lib/nigerian-locations"
import { UAE_AREAS, UAE_EMIRATES } from "@/lib/uae-locations"

// Re-exported for backward compatibility — everything that used to
// import these from this file still works. The actual data now
// lives in lib/nigerian-locations.ts (a plain module, not "use
// client") so server code like API routes can import it too.
export { NIGERIAN_LGAS, NIGERIAN_STATES }

// ─── Props ────────────────────────────────────────────────────────────────────
interface StateLgaSelectProps {
  state: string
  lga: string
  onStateChange: (state: string) => void
  onLgaChange: (lga: string) => void
  stateError?: string
  lgaError?: string
  // "grid" = side by side (default), "stack" = full-width stacked
  layout?: "grid" | "stack"
  // Optional third field, free-text — the specific town/area within the
  // LGA (e.g. "Ikeja" LGA, "Opebi" town). Opt-in: only renders when
  // onTownChange is passed, so existing callers are unaffected.
  town?: string
  onTownChange?: (town: string) => void
  townError?: string
  // Which country's location data to use. Defaults to "Nigeria" so
  // every existing caller (none of which pass this yet) is completely
  // unaffected — this just makes the component CAPABLE of UAE, it's
  // not wired into any live form as a switchable option yet.
  country?: "Nigeria" | "UAE"
}

// ─── Component ────────────────────────────────────────────────────────────────
export function StateLgaSelect({
  state,
  lga,
  onStateChange,
  onLgaChange,
  stateError,
  lgaError,
  layout = "grid",
  town,
  onTownChange,
  townError,
  country = "Nigeria",
}: StateLgaSelectProps) {
  const isUAE = country === "UAE"
  const stateOptions = isUAE ? UAE_EMIRATES : NIGERIAN_STATES
  const lgaOptions = state ? ((isUAE ? UAE_AREAS : NIGERIAN_LGAS)[state] ?? []) : []
  const stateLabel = isUAE ? "Emirate" : "State"
  const lgaLabel = isUAE ? "Area" : "LGA"
  // Explicit placeholder text rather than deriving it from the label
  // (e.g. via .toLowerCase()) — "LGA" is an acronym and reads wrong
  // lowercased ("select lga"), so Nigeria's placeholders stay exactly
  // as they were before this component supported a second country.
  const statePlaceholder = isUAE ? "Select emirate" : "Select state"
  const lgaPlaceholder = isUAE ? "Select area" : "Select LGA"
  const lgaPlaceholderNoState = isUAE ? "Select an emirate first" : "Select a state first"

  const handleStateChange = (newState: string) => {
    onStateChange(newState)
    onLgaChange("") // reset LGA/Area when state/emirate changes
  }

  const selectClass =
    "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"

  const wrapper =
    layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-5" : "space-y-5"

  return (
    <div className={layout === "grid" ? "space-y-5" : "space-y-5"}>
      <div className={wrapper}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{stateLabel}</label>
          <select
            value={state}
            onChange={(e) => handleStateChange(e.target.value)}
            className={selectClass}
          >
            <option value="">{statePlaceholder}</option>
            {stateOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {stateError && <p className="text-red-500 text-xs mt-1">{stateError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{lgaLabel}</label>
          <select
            value={lga}
            onChange={(e) => onLgaChange(e.target.value)}
            disabled={!state}
            className={selectClass}
          >
            <option value="">{state ? lgaPlaceholder : lgaPlaceholderNoState}</option>
            {lgaOptions.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {lgaError && <p className="text-red-500 text-xs mt-1">{lgaError}</p>}
        </div>
      </div>

      {onTownChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Town (optional)</label>
          <input
            value={town ?? ""}
            onChange={(e) => onTownChange(e.target.value)}
            placeholder="e.g. Opebi, Magodo"
            className={selectClass}
          />
          {townError && <p className="text-red-500 text-xs mt-1">{townError}</p>}
        </div>
      )}
    </div>
  )
}
