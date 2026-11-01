// ============================================================
// lib/sitemap.ts
// Split sitemaps: /sitemap.xml is an index that points at one file per
// content type, so Search Console shows indexing per section and no
// single file nears the 50,000-URL limit.
//
//   /sitemaps/static.xml     home, listing pages, legal
//   /sitemaps/landing.xml    state + category landing pages
//                            (/jobs/in/[state], /jobs/category/[slug])
//   /sitemaps/jobs/[page]    job pages, 1,000 per file (see JOBS_PER_SITEMAP)
//   /sitemaps/content.xml    blog posts + resource posts
//   /sitemaps/schools.xml    verified school profiles with real content
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/site"
import { jobPath } from "@/lib/job-slug"
import { getCategoryIndex, getLandingKeysWithContent, getStateJobCounts } from "@/lib/cache/landing"
import { categoryPath, landingPath, MIN_JOBS_FOR_LANDING } from "@/lib/landing"

type Freq = "daily" | "weekly" | "monthly"
interface Entry {
  path: string
  lastmod?: string | null
  changefreq: Freq
  priority: number
}

// "jobs" is not in this list: it is split into numbered pages (see below).
export const SITEMAP_NAMES = ["static", "landing", "content", "schools"] as const
export type SitemapName = (typeof SITEMAP_NAMES)[number]

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

const iso = (d?: string | null) => {
  if (!d) return null
  const t = new Date(d)
  return Number.isNaN(t.getTime()) ? null : t.toISOString()
}

export function renderUrlset(entries: Entry[]): string {
  const body = entries
    .map((e) => {
      const lm = iso(e.lastmod)
      return (
        `<url><loc>${esc(`${SITE_URL}${e.path}`)}</loc>` +
        (lm ? `<lastmod>${lm}</lastmod>` : "") +
        `<changefreq>${e.changefreq}</changefreq><priority>${e.priority.toFixed(1)}</priority></url>`
      )
    })
    .join("")
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

// Supabase returns at most 1,000 rows per request, so one query silently
// stops at 1,000 jobs. Jobs are therefore served in pages of this size.
export const JOBS_PER_SITEMAP = 1000
const JOB_STATUSES = ["active", "closed"]

async function jobSitemapPageCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .in("status", JOB_STATUSES)
  return Math.max(1, Math.ceil((count ?? 0) / JOBS_PER_SITEMAP))
}

export async function renderIndex(): Promise<string> {
  const now = new Date().toISOString()
  const pages = await jobSitemapPageCount().catch(() => 1)
  const names = [
    ...SITEMAP_NAMES.slice(0, 2).map((n) => `${SITE_URL}/sitemaps/${n}.xml`),
    ...Array.from({ length: pages }, (_, i) => `${SITE_URL}/sitemaps/jobs/${i + 1}`),
    ...SITEMAP_NAMES.slice(2).map((n) => `${SITE_URL}/sitemaps/${n}.xml`),
  ]
  const body = names.map((loc) => `<sitemap><loc>${loc}</loc><lastmod>${now}</lastmod></sitemap>`).join("")
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
}

export const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
}

const STATIC_ROUTES = ["", "/jobs", "/schools", "/pricing", "/resources", "/blog", "/contact", "/privacy", "/terms"]

export async function buildEntries(name: SitemapName): Promise<Entry[]> {
  const supabase = await createClient()

  switch (name) {
    case "static": {
      const base: Entry[] = STATIC_ROUTES.map((path) => ({
        path,
        changefreq: path === "" || path === "/jobs" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
      }))
      return base
    }
    case "landing": {
      // Locations + categories. Live (enough jobs) AND with written copy —
      // the same rule the pages use to decide whether they are indexable.
      const [stateCounts, statesWithCopy, index, slugsWithCopy] = await Promise.all([
        getStateJobCounts(),
        getLandingKeysWithContent(),
        getCategoryIndex(),
        getLandingKeysWithContent("category"),
      ])
      const locations: Entry[] = statesWithCopy
        .filter((state) => (stateCounts[state] ?? 0) >= MIN_JOBS_FOR_LANDING)
        .map((state) => ({ path: landingPath(state), changefreq: "daily", priority: 0.8 }))
      const categories: Entry[] = slugsWithCopy
        .filter((slug) => (index[slug]?.count ?? 0) >= MIN_JOBS_FOR_LANDING)
        .map((slug) => ({ path: categoryPath(slug), changefreq: "daily", priority: 0.8 }))
      return [...locations, ...categories]
    }
    case "content": {
      // Blog posts + resource posts.
      const [blog, resources] = await Promise.all([
        supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true),
        supabase.from("resource_posts").select("slug, updated_at").eq("is_published", true),
      ])
      const posts: Entry[] = (blog.data || []).map((p) => ({
        path: `/blog/${p.slug}`,
        lastmod: p.updated_at,
        changefreq: "monthly",
        priority: 0.6,
      }))
      const res: Entry[] = (resources.data || []).map((r) => ({
        path: `/resources/${r.slug}`,
        lastmod: r.updated_at,
        changefreq: "monthly",
        priority: 0.6,
      }))
      return [...posts, ...res]
    }
    case "schools": {
      // Has real long-form content — thin/placeholder pages shouldn't be
      // submitted for indexing. This mirrors the page's own noindex rule
      // (app/(public)/schools/[slug]/page.tsx: long_description only).
      // is_verified is just a badge now, not a visibility gate.
      const { data } = await supabase
        .from("school_profiles")
        .select("slug, updated_at")
        .not("long_description", "is", null)
        .neq("long_description", "")
        .not("slug", "is", null)
      return (data || []).map((s) => ({ path: `/schools/${s.slug}`, lastmod: s.updated_at, changefreq: "monthly", priority: 0.5 }))
    }
  }
}

export async function sitemapResponse(name: SitemapName): Promise<Response> {
  try {
    return new Response(renderUrlset(await buildEntries(name)), { headers: XML_HEADERS })
  } catch (err) {
    console.error(`Sitemap ${name} failed:`, err)
    return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "300" } })
  }
}

/**
 * One page of the job sitemap. Expired (closed) jobs stay in on purpose:
 * they remain indexed with contact hidden and a "this job has expired"
 * notice. Only unapproved jobs are left out. Jobs use their slug URL.
 */
export async function jobSitemapResponse(pageParam: string): Promise<Response> {
  const page = Number.parseInt(pageParam, 10)
  if (!Number.isInteger(page) || page < 1) return new Response("Invalid page", { status: 400 })

  try {
    const supabase = await createClient()
    const from = (page - 1) * JOBS_PER_SITEMAP
    const to = from + JOBS_PER_SITEMAP - 1
    // Stable order (created_at, then id) so rows never move between pages.
    const run = (columns: string) =>
      supabase
        .from("jobs")
        .select(columns)
        .in("status", JOB_STATUSES)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)

    let { data, error } = await run("id, slug, status, updated_at")
    // Before supabase/job_slugs.sql has been run there is no slug column.
    if (error) ({ data, error } = await run("id, status, updated_at"))
    if (error) throw error
    if (!data || data.length === 0) return new Response("Page not found", { status: 404 })

    const rows = data as unknown as { id: string; slug?: string | null; status: string; updated_at: string | null }[]
    const entries: Entry[] = rows.map((j) => ({
      path: jobPath(j),
      lastmod: j.updated_at,
      changefreq: j.status === "active" ? "daily" : "weekly",
      priority: j.status === "active" ? 0.8 : 0.5,
    }))
    return new Response(renderUrlset(entries), { headers: XML_HEADERS })
  } catch (err) {
    console.error(`Job sitemap page ${pageParam} failed:`, err)
    return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "300" } })
  }
}
