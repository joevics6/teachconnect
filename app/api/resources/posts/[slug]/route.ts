import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data: post, error } = await supabase
      .from("resource_posts")
      .select("id, title, slug, excerpt, content, category, cover_image_url, published_at, author_name")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Fetch related posts in same category
    const { data: related } = await supabase
      .from("resource_posts")
      .select("id, title, slug, excerpt, category, published_at")
      .eq("is_published", true)
      .eq("category", post.category)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(2)

    return NextResponse.json({ post, related: related || [] })
  } catch (err) {
    console.error("GET post by slug error:", err)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}
