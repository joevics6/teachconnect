// ============================================================
// app/api/admin/resources/[id]/route.ts
// GET — one resource post (for the edit form).
// PATCH — update.
// DELETE — remove.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"

const ALLOWED_FIELDS = [
  "title", "slug", "excerpt", "body", "category", "author", "resource_type",
  "cover_image_url", "file_url", "external_url", "youtube_id", "tags",
  "read_time_minutes", "seo_title", "seo_description", "is_published", "published_at",
]

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: post, error } = await supabase
      .from("resource_posts")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !post) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ post })
  } catch (err) {
    console.error("GET admin resource error:", err)
    return NextResponse.json({ error: "Failed to fetch resource" }, { status: 500 })
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
      .from("resource_posts")
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
    console.error("PATCH admin resource error:", err)
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { error } = await supabase.from("resource_posts").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE admin resource error:", err)
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 })
  }
}
