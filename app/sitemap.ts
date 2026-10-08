import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/site"
import { getLandingKeysWithContent, getStateJobCounts } from "@/lib/cache/landing"
import { landingPath, MIN_JOBS_FOR_LANDING } from "@/lib/landing"

const STATIC_ROUTES = [
  "",
  "/jobs",
  "/schools",
  "/pricing",
  "/resources",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL
  const supabase = await createClient()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === "" || path === "/jobs" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }))

  const [{ data: jobs }, { data: resources }, { data: blogPosts }, { data: schools }] =
    await Promise.all([
      supabase.from("jobs").select("id, updated_at").eq("status", "active").gte("deadline", new Date().toISOString().split("T")[0]),
      supabase.from("resource_posts").select("slug, updated_at").eq("is_published", true),
      supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true),
      // Verified AND has real long-form content — thin/placeholder
      // pages (ghost schools, or verified schools that haven't filled
      // in their public page yet) shouldn't be submitted for indexing;
      // generateMetadata on the page itself also sets noindex for
      // these as a second layer, but it's wasted crawl budget to list
      // them here at all.
      supabase.from("school_profiles").select("slug, updated_at").eq("is_verified", true).not("long_description", "is", null),
    ])

  const jobEntries: MetadataRoute.Sitemap = (jobs || []).map((job) => ({
    url: `${baseUrl}/jobs/${job.id}`,
    lastModified: job.updated_at ? new Date(job.updated_at) : new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }))

  const resourceEntries: MetadataRoute.Sitemap = (resources || []).map((r) => ({
    url: `${baseUrl}/resources/${r.slug}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const blogEntries: MetadataRoute.Sitemap = (blogPosts || []).map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const schoolEntries: MetadataRoute.Sitemap = (schools || []).map((s) => ({
    url: `${baseUrl}/schools/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  // Location pages: live (enough jobs) AND with written copy — the same
  // rule the page uses to decide whether it is indexable.
  const [stateCounts, statesWithCopy] = await Promise.all([getStateJobCounts(), getLandingKeysWithContent()])
  const landingEntries: MetadataRoute.Sitemap = statesWithCopy
    .filter((state) => (stateCounts[state] ?? 0) >= MIN_JOBS_FOR_LANDING)
    .map((state) => ({
      url: `${baseUrl}${landingPath(state)}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }))

  return [...staticEntries, ...landingEntries, ...jobEntries, ...resourceEntries, ...blogEntries, ...schoolEntries]
}
