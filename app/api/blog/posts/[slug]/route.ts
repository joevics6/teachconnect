import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (error || !post) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { data: related } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_image_url, published_at")
      .eq("is_published", true)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3)

    return NextResponse.json({ post, related: related || [] })
  } catch (err) {
    console.error("GET blog post error:", err)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}
