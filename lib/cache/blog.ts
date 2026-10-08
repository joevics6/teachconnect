// ============================================================
// lib/cache/blog.ts
// Cached reads for the public blog, so /blog and /blog/[slug] can be
// server-rendered (crawlers get the real content) without a Supabase
// round-trip per request. Tagged "blog" — the admin blog routes burst
// it on every write; the 300s TTL is only a safety net.
// ============================================================

import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"

const TAGS = ["blog"]

export interface BlogListPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string | null
  cover_image_url: string | null
  tags: string[]
  read_time_minutes: number | null
  published_at: string
}

export interface BlogPost extends BlogListPost {
  body: string | null
  updated_at?: string | null
}

export const getPublishedPosts = unstable_cache(
  async (): Promise<BlogListPost[]> => {
    const { data } = await createPublicClient()
      .from("blog_posts")
      .select("id, title, slug, excerpt, author, cover_image_url, tags, read_time_minutes, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
    return (data as BlogListPost[]) || []
  },
  ["blog-posts"],
  { revalidate: 300, tags: TAGS }
)

export const getPostBySlug = unstable_cache(
  async (slug: string): Promise<BlogPost | null> => {
    const { data } = await createPublicClient()
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
    return (data as BlogPost) || null
  },
  ["blog-post-by-slug"],
  { revalidate: 300, tags: TAGS }
)
