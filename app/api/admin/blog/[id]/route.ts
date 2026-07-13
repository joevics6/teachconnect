import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"

const ALLOWED_FIELDS = [
  "title", "slug", "excerpt", "body", "author", "cover_image_url",
  "tags", "read_time_minutes", "seo_title", "seo_description",
  "is_published", "published_at",
]

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !post) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ post })
  } catch (err) {
    console.error("GET admin blog post error:", err)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const f of ALLOWED_FIELDS) if (body[f] !== undefined) updates[f] = body[f]

    const { data: post, error } = await supabase
      .from("blog_posts")
      .update(updates)
      .eq("id", id)
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
    console.error("PATCH admin blog post error:", err)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { error } = await supabase.from("blog_posts").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE admin blog post error:", err)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
