"use client"

import { NIGERIAN_LGAS, NIGERIAN_STATES } from "@/lib/nigerian-locations"

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
}: StateLgaSelectProps) {
  const lgas = state ? (NIGERIAN_LGAS[state] ?? []) : []

  const handleStateChange = (newState: string) => {
    onStateChange(newState)
    onLgaChange("") // reset LGA when state changes
  }

  const selectClass =
    "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"

  const wrapper =
    layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-5" : "space-y-5"

  return (
    <div className={wrapper}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
        <select
          value={state}
          onChange={(e) => handleStateChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Select state</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {stateError && <p className="text-red-500 text-xs mt-1">{stateError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">LGA</label>
        <select
          value={lga}
          onChange={(e) => onLgaChange(e.target.value)}
          disabled={!state}
          className={selectClass}
        >
          <option value="">{state ? "Select LGA" : "Select a state first"}</option>
          {lgas.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        {lgaError && <p className="text-red-500 text-xs mt-1">{lgaError}</p>}
      </div>
    </div>
  )
}