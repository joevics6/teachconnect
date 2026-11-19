// ============================================================
// components/home/HomeBrowse.tsx
// Server-rendered browse links under the homepage: state pages, role pages
// and the latest guides. The homepage is the most linked-to page on the
// site, so this is where state, role and blog pages receive the most weight.
// Only pages that exist are linked (6+ live jobs for state/role pages).
// ============================================================

import Link from "next/link"
import { getCategoryIndex, getStateJobCounts } from "@/lib/cache/landing"
import { getPublishedPosts } from "@/lib/cache/blog"
import { categoryPath, landingPath, MIN_JOBS_FOR_LANDING, stateDisplayName } from "@/lib/landing"

const chip = "px-3 py-1.5 bg-white border border-gray-200 hover:border-ink-300 text-gray-700 text-sm rounded-lg"

export default async function HomeBrowse() {
  const [counts, categories, posts] = await Promise.all([getStateJobCounts(), getCategoryIndex(), getPublishedPosts()])
  const states = Object.entries(counts)
    .filter(([, n]) => n >= MIN_JOBS_FOR_LANDING)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
  const roles = Object.entries(categories)
    .filter(([, c]) => c.count >= MIN_JOBS_FOR_LANDING)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
  const latest = posts.slice(0, 3)
  if (states.length === 0 && roles.length === 0 && latest.length === 0) return null

  return (
    <section className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        {states.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Browse teaching jobs by state</h2>
            <div className="flex flex-wrap gap-2">
              {states.map(([state, n]) => (
                <Link key={state} href={landingPath(state)} className={chip}>
                  {stateDisplayName(state)} <span className="text-gray-400">({n})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {roles.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Browse teaching jobs by role</h2>
            <div className="flex flex-wrap gap-2">
              {roles.map(([slug, c]) => (
                <Link key={slug} href={categoryPath(slug)} className={chip}>
                  {c.name} jobs <span className="text-gray-400">({c.count})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {latest.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Latest teacher career guides</h2>
              <Link href="/blog" className="text-sm text-ink-600 hover:underline">All guides</Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {latest.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="bg-white border border-gray-200 hover:border-ink-300 rounded-2xl p-4 block">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{p.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-3">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
