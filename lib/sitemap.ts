// ============================================================
// lib/sitemap.ts
// Split sitemaps: /sitemap.xml is an index that points at one file per
// content type, so Search Console shows indexing per section and no
// single file nears the 50,000-URL limit.
//
//   /sitemaps/static.xml     home, listing pages, legal
//   /sitemaps/locations.xml  state landing pages (/jobs/in/[state])
//   /sitemaps/jobs.xml       live job pages
//   /sitemaps/blog.xml       blog posts
//   /sitemaps/resources.xml  resource posts
//   /sitemaps/schools.xml    verified school profiles with real content
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/site"
import { getLandingKeysWithContent, getStateJobCounts } from "@/lib/cache/landing"
import { landingPath, MIN_JOBS_FOR_LANDING } from "@/lib/landing"

type Freq = "daily" | "weekly" | "monthly"
interface Entry {
  path: string
  lastmod?: string | null
  changefreq: Freq
  priority: number
}

export const SITEMAP_NAMES = ["static", "locations", "jobs", "blog", "resources", "schools"] as const
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

export function renderIndex(): string {
  const now = new Date().toISOString()
  const body = SITEMAP_NAMES.map(
    (n) => `<sitemap><loc>${SITE_URL}/sitemaps/${n}.xml</loc><lastmod>${now}</lastmod></sitemap>`
  ).join("")
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
    case "locations": {
      // Live (enough jobs) AND with written copy — the same rule the page
      // uses to decide whether it is indexable.
      const [stateCounts, statesWithCopy] = await Promise.all([getStateJobCounts(), getLandingKeysWithContent()])
      return statesWithCopy
        .filter((state) => (stateCounts[state] ?? 0) >= MIN_JOBS_FOR_LANDING)
        .map((state) => ({ path: landingPath(state), changefreq: "daily", priority: 0.8 }))
    }
    case "jobs": {
      const { data } = await supabase
        .from("jobs")
        .select("id, updated_at")
        .eq("status", "active")
        .gte("deadline", new Date().toISOString().split("T")[0])
      return (data || []).map((j) => ({ path: `/jobs/${j.id}`, lastmod: j.updated_at, changefreq: "daily", priority: 0.8 }))
    }
    case "blog": {
      const { data } = await supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true)
      return (data || []).map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.updated_at, changefreq: "monthly", priority: 0.6 }))
    }
    case "resources": {
      const { data } = await supabase.from("resource_posts").select("slug, updated_at").eq("is_published", true)
      return (data || []).map((r) => ({ path: `/resources/${r.slug}`, lastmod: r.updated_at, changefreq: "monthly", priority: 0.6 }))
    }
    case "schools": {
      // Verified AND has real long-form content — thin/placeholder pages
      // shouldn't be submitted for indexing (the page also sets noindex).
      const { data } = await supabase
        .from("school_profiles")
        .select("slug, updated_at")
        .eq("is_verified", true)
        .not("long_description", "is", null)
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
