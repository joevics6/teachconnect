// PATCH  — edit one question (text, options, answer, topic, explanation, year, region, status).
// DELETE — remove one question.
import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

const ALLOWED = [
  "question_text", "option_a", "option_b", "option_c", "option_d", "option_e",
  "correct_option", "topic", "explanation", "year", "region", "status", "source_note", "image_url",
] as const

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { id } = await params
    const body = await request.json()

    const updates: Record<string, unknown> = {}
    for (const f of ALLOWED) if (f in body) updates[f] = body[f]
    if ("correct_option" in updates) {
      const v = String(updates.correct_option).toLowerCase()
      if (!["a", "b", "c", "d", "e"].includes(v)) return NextResponse.json({ error: "Invalid answer" }, { status: 400 })
      updates.correct_option = v
      updates.answer_source = "manual" // a person has now chosen/confirmed it
    }
    if ("status" in updates && !["draft", "published"].includes(String(updates.status))) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    for (const k of ["topic", "explanation", "region", "option_e", "source_note"]) {
      if (k in updates && (updates[k] === "" || updates[k] == null)) updates[k] = null
    }
    if ("image_url" in updates) {
      const raw = typeof updates.image_url === "string" ? updates.image_url.trim() : ""
      if (!raw) updates.image_url = null
      else if (raw.length > 500 || !(raw.startsWith("/") || raw.startsWith("https://"))) {
        return NextResponse.json({ error: "Image must be an https:// URL or a site path like /cbt/name.jpg" }, { status: 400 })
      } else {
        updates.image_url = raw
        updates.needs_image = false // the diagram has been supplied
      }
    }
    if ("year" in updates) updates.year = updates.year === "" || updates.year == null ? null : Number(updates.year)
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    updates.updated_at = new Date().toISOString()

    const db = createAdminClient()
    // A question that cannot be answered without its diagram must not go live without one.
    if (updates.status === "published") {
      const { data: cur } = await db.from("cbt_questions").select("needs_image, image_url").eq("id", id).maybeSingle()
      const url = "image_url" in updates ? updates.image_url : cur?.image_url
      const needs = "needs_image" in updates ? updates.needs_image : cur?.needs_image
      if (needs && !url) return NextResponse.json({ error: "This question needs its diagram. Attach an image before publishing." }, { status: 400 })
    }

    const { data, error } = await db.from("cbt_questions").update(updates).eq("id", id).select("*").single()
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Another question with the same text already exists" }, { status: 409 })
      throw error
    }
    revalidateTag("cbt", "max")
    return NextResponse.json({ question: data })
  } catch (err) {
    console.error("PATCH admin cbt question error:", err)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { id } = await params
    const { error } = await createAdminClient().from("cbt_questions").delete().eq("id", id)
    if (error) throw error
    revalidateTag("cbt", "max")
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE admin cbt question error:", err)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
