// ============================================================
// components/layout/FooterBrowse.tsx
// Server component rendered inside the footer: links to the state and role
// landing pages that actually exist (6+ live jobs each), so every page on
// the site passes link weight to them. Counts are cached (5 min).
// ============================================================

import Link from "next/link"
import { getCategoryIndex, getStateJobCounts } from "@/lib/cache/landing"
import { categoryPath, landingPath, MIN_JOBS_FOR_LANDING, stateDisplayName } from "@/lib/landing"

export default async function FooterBrowse() {
  const [counts, categories] = await Promise.all([getStateJobCounts(), getCategoryIndex()])
  const states = Object.entries(counts)
    .filter(([, n]) => n >= MIN_JOBS_FOR_LANDING)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const roles = Object.entries(categories)
    .filter(([, c]) => c.count >= MIN_JOBS_FOR_LANDING)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
  if (states.length === 0 && roles.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 pt-8 border-t border-ink-800">
      {states.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 text-sm">Teaching jobs by state</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {states.map(([state]) => (
              <li key={state}>
                <Link href={landingPath(state)} className="hover:text-white transition">
                  {stateDisplayName(state)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {roles.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 text-sm">Teaching jobs by role</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {roles.map(([slug, c]) => (
              <li key={slug}>
                <Link href={categoryPath(slug)} className="hover:text-white transition">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
