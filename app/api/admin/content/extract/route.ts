// ============================================================
// app/api/admin/content/extract/route.ts
// POST — admin-only. Powers the "AI auto-fill" panel on the admin
// blog and resource editors (ported from the Toolbase article writer).
// Body: { kind: "blog" | "resource", title?: string, content: string }
// Returns the extracted fields + the scissors-cleaned markdown.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
import { extractContent, RESOURCE_CATEGORIES, type ContentKind } from "@/lib/content-writer"

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const kind: ContentKind = body.kind === "resource" ? "resource" : "blog"
    const title = typeof body.title === "string" ? body.title : ""
    const content = typeof body.content === "string" ? body.content : ""
    if (!content.trim()) {
      return NextResponse.json({ error: "Paste content first." }, { status: 400 })
    }

    const result = await extractContent(kind, title, content)

    // Resources only accept the four known categories.
    if (kind === "resource" && !(RESOURCE_CATEGORIES as readonly string[]).includes(result.category ?? "")) {
      delete result.category
    }
    return NextResponse.json({ result })
  } catch (err) {
    console.error("POST admin content extract error:", err)
    const message = err instanceof Error ? err.message : "AI extraction failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
