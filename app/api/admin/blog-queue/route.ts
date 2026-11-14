// GET  — the saved content queue (newest first).
// POST — save pasted content to the queue: { content }.
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

export async function GET() {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { data, error } = await createAdminClient()
      .from("blog_queue")
      .select("id, content, status, error, attempts, created_at, processed_at")
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) throw error
    return NextResponse.json({ items: data || [] })
  } catch (err) {
    console.error("GET admin blog-queue error:", err)
    return NextResponse.json({ error: "Failed to load" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const body = await request.json().catch(() => ({}))
    const content = typeof body.content === "string" ? body.content.trim() : ""
    if (!content) return NextResponse.json({ error: "Paste some content first" }, { status: 400 })
    const { data, error } = await createAdminClient()
      .from("blog_queue")
      .insert({ content })
      .select("id, content, status, error, attempts, created_at, processed_at")
      .single()
    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (err) {
    console.error("POST admin blog-queue error:", err)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
