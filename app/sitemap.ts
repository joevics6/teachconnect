import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

const STATIC_ROUTES = [
  "",
  "/jobs",
  "/talent",
  "/pricing",
  "/resources",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
  "/register/teacher",
  "/register/school",
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://classhire.jobmeter.app"
  const supabase = await createClient()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }))

  const [{ data: jobs }, { data: resources }, { data: blogPosts }, { data: schools }] =
    await Promise.all([
      supabase.from("jobs").select("id, updated_at").eq("status", "active"),
      supabase.from("resource_posts").select("slug, updated_at").eq("is_published", true),
      supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true),
      supabase.from("school_profiles").select("id, updated_at").eq("is_verified", true),
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
    url: `${baseUrl}/schools/${s.id}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  return [...staticEntries, ...jobEntries, ...resourceEntries, ...blogEntries, ...schoolEntries]
}
