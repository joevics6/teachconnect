// ============================================================
// lib/cache/landing.ts
// Cached reads for the location landing pages. Job data is tagged
// "jobs" (burst on approve/close like the rest); the copy admins write
// is tagged "landing" (burst by /api/admin/seo-pages).
// ============================================================

import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"
import { categorySlug } from "@/lib/landing"

const today = () => new Date().toISOString().split("T")[0]

export interface LandingContent {
  title: string | null
  meta_description: string | null
  intro: string | null
  body: string | null
}

/** Live public jobs per state, e.g. { Lagos: 24, Ogun: 12 }. */
export const getStateJobCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const { data } = await createPublicClient()
      .from("jobs_with_school")
      .select("school_state")
      .eq("status", "active")
      .eq("is_private", false)
      .gte("deadline", today())
    const counts: Record<string, number> = {}
    for (const row of data || []) {
      if (row.school_state) counts[row.school_state] = (counts[row.school_state] || 0) + 1
    }
    return counts
  },
  ["landing-state-counts"],
  { tags: ["jobs"], revalidate: 300 }
)

/** Live public jobs in one state — featured first, then newest. */
export const getStateLandingJobs = unstable_cache(
  async (state: string) => {
    const { data } = await createPublicClient()
      .from("jobs_with_school")
      .select("*")
      .eq("status", "active")
      .eq("is_private", false)
      .eq("school_state", state)
      .gte("deadline", today())
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60)
    return data || []
  },
  ["landing-state-jobs"],
  { tags: ["jobs"], revalidate: 300 }
)

export const getLandingContent = unstable_cache(
  async (key: string, kind: "state" | "category" = "state"): Promise<LandingContent | null> => {
    const { data } = await createPublicClient()
      .from("seo_landing_pages")
      .select("title, meta_description, intro, body")
      .eq("kind", kind)
      .eq("key", key)
      .maybeSingle()
    return (data as LandingContent) || null
  },
  ["landing-content"],
  { tags: ["landing"], revalidate: 300 }
)

/** Which states already have written copy (so they can be indexed / in the sitemap). */
export const getLandingKeysWithContent = unstable_cache(
  async (kind: "state" | "category" = "state"): Promise<string[]> => {
    const { data } = await createPublicClient()
      .from("seo_landing_pages")
      .select("key, intro, body")
      .eq("kind", kind)
    return (data || []).filter((r) => (r.intro || "").trim() || (r.body || "").trim()).map((r) => r.key)
  },
  ["landing-keys-with-content"],
  { tags: ["landing"], revalidate: 300 }
)

// ---- Categories -------------------------------------------------------

export interface CategoryInfo {
  name: string
  count: number
  ids: string[]
}

/**
 * Live public jobs grouped by normalized role_category, keyed by slug,
 * e.g. { "mathematics-teacher": { name: "Mathematics Teacher", count: 9, ids } }.
 * Spelling variants that slugify the same are merged; the most common
 * spelling is used as the display name.
 */
export const getCategoryIndex = unstable_cache(
  async (): Promise<Record<string, CategoryInfo>> => {
    const { data } = await createPublicClient()
      .from("jobs")
      .select("id, role_category")
      .eq("status", "active")
      .eq("is_private", false)
      .gte("deadline", today())
      .not("role_category", "is", null)
    const groups: Record<string, { names: Record<string, number>; ids: string[] }> = {}
    for (const row of data || []) {
      const name = (row.role_category || "").trim()
      if (!name) continue
      const slug = categorySlug(name)
      const g = (groups[slug] ||= { names: {}, ids: [] })
      g.names[name] = (g.names[name] || 0) + 1
      g.ids.push(row.id)
    }
    const out: Record<string, CategoryInfo> = {}
    for (const [slug, g] of Object.entries(groups)) {
      const name = Object.entries(g.names).sort((a, b) => b[1] - a[1])[0][0]
      out[slug] = { name, count: g.ids.length, ids: g.ids }
    }
    return out
  },
  ["landing-category-index"],
  { tags: ["jobs"], revalidate: 300 }
)

/** The live jobs in one category — featured first, then newest. */
export const getCategoryLandingJobs = unstable_cache(
  async (ids: string[]) => {
    if (!ids.length) return []
    const { data } = await createPublicClient()
      .from("jobs_with_school")
      .select("*")
      .in("id", ids.slice(0, 200))
      .eq("status", "active")
      .eq("is_private", false)
      .gte("deadline", today())
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60)
    return data || []
  },
  ["landing-category-jobs"],
  { tags: ["jobs"], revalidate: 300 }
)
