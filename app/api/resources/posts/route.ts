// ============================================================
// app/api/resources/posts/route.ts
// GET /api/resources/posts
// ============================================================
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function GET() {
  try {
    const supabase = await createClient()
 
    const { data: posts, error } = await supabase
      .from("resource_posts")
      .select("id, title, slug, excerpt, category, cover_image_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
 
    if (error) throw error
 
    return NextResponse.json({ posts: posts || [] })
  } catch (err) {
    console.error("GET posts error:", err)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}