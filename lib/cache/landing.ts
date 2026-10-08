// ============================================================
// lib/cache/landing.ts
// Cached reads for the location landing pages. Job data is tagged
// "jobs" (burst on approve/close like the rest); the copy admins write
// is tagged "landing" (burst by /api/admin/seo-pages).
// ============================================================

import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"

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
  async (key: string): Promise<LandingContent | null> => {
    const { data } = await createPublicClient()
      .from("seo_landing_pages")
      .select("title, meta_description, intro, body")
      .eq("kind", "state")
      .eq("key", key)
      .maybeSingle()
    return (data as LandingContent) || null
  },
  ["landing-content"],
  { tags: ["landing"], revalidate: 300 }
)

/** Which states already have written copy (so they can be indexed / in the sitemap). */
export const getLandingKeysWithContent = unstable_cache(
  async (): Promise<string[]> => {
    const { data } = await createPublicClient()
      .from("seo_landing_pages")
      .select("key, intro, body")
      .eq("kind", "state")
    return (data || []).filter((r) => (r.intro || "").trim() || (r.body || "").trim()).map((r) => r.key)
  },
  ["landing-keys-with-content"],
  { tags: ["landing"], revalidate: 300 }
)
