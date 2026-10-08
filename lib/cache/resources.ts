// ============================================================
// lib/cache/resources.ts
// Cached reads for the public /resources listing so it can be
// server-rendered (crawlers get the real article/download links).
// Tagged "resources" — the admin resources routes burst it on every
// write; the 300s TTL is only a safety net.
// ============================================================

import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"

const TAGS = ["resources"]

export const getResourcePosts = unstable_cache(
  async () => {
    const { data } = await createPublicClient()
      .from("resource_posts")
      .select("id, title, slug, excerpt, category, resource_type, cover_image_url, read_time_minutes, tags, download_count, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
    return data || []
  },
  ["resource-posts"],
  { revalidate: 300, tags: TAGS }
)

export const getResourceDownloads = unstable_cache(
  async () => {
    const { data } = await createPublicClient()
      .from("resource_downloads")
      .select("id, title, slug, description, category, download_count")
      .eq("is_active", true)
      .order("download_count", { ascending: false })
    return data || []
  },
  ["resource-downloads"],
  { revalidate: 300, tags: TAGS }
)
