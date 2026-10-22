// ============================================================
// app/api/admin/content/clean/route.ts
// POST — admin-only. Cleans the text already in a textbox using the
// Toolbase scissors-edit prompt (bare citation links -> inline anchors,
// max 5; AI commentary removed; no other wording changed).
// Body: { content: string }  ->  { cleaned: string }
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
import { cleanContent } from "@/lib/content-writer"

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const content = typeof body.content === "string" ? body.content : ""
    if (!content.trim()) return NextResponse.json({ error: "Nothing to parse." }, { status: 400 })

    const cleaned = await cleanContent(content)
    return NextResponse.json({ cleaned })
  } catch (err) {
    console.error("POST admin content clean error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI cleanup failed" }, { status: 500 })
  }
}
