import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, author, cover_image_url, tags, read_time_minutes, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ posts: posts || [] })
  } catch (err) {
    console.error("GET blog posts error:", err)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}
