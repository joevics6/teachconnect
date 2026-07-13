import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ posts: posts || [] })
  } catch (err) {
    console.error("GET admin blog error:", err)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

const ALLOWED_FIELDS = [
  "title", "slug", "excerpt", "body", "author", "cover_image_url",
  "tags", "read_time_minutes", "seo_title", "seo_description",
  "is_published", "published_at",
]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    if (!body.title || !body.slug || !body.excerpt) {
      return NextResponse.json({ error: "title, slug, and excerpt are required" }, { status: 400 })
    }

    const insert: Record<string, unknown> = {}
    for (const f of ALLOWED_FIELDS) if (body[f] !== undefined) insert[f] = body[f]

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert(insert)
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "That slug is already in use" }, { status: 409 })
      }
      throw error
    }
    return NextResponse.json({ post })
  } catch (err) {
    console.error("POST admin blog error:", err)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
