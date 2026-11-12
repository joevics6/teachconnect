// GET  — all exams (including inactive) and all subjects, for the admin CBT page.
// POST — add an exam ({ type: "exam", name, short_name }) or a subject ({ type: "subject", name }).
import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { slugifyName } from "@/lib/cbt"

export async function GET() {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const db = createAdminClient()
    const [{ data: exams, error: e1 }, { data: subjects, error: e2 }] = await Promise.all([
      db.from("cbt_exams").select("*").order("sort_order"),
      db.from("cbt_subjects").select("*").order("sort_order").order("name"),
    ])
    if (e1) throw e1
    if (e2) throw e2
    return NextResponse.json({ exams: exams || [], subjects: subjects || [] })
  } catch (err) {
    console.error("GET admin cbt meta error:", err)
    return NextResponse.json({ error: "Failed to load" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
    const slug = slugifyName(name)
    if (!slug) return NextResponse.json({ error: "Invalid name" }, { status: 400 })
    const db = createAdminClient()

    if (body.type === "exam") {
      const short = typeof body.short_name === "string" && body.short_name.trim() ? body.short_name.trim() : name
      const { data, error } = await db
        .from("cbt_exams")
        .insert({ slug, name, short_name: short, description: `Practise ${name} past questions in a timed computer-based test.`, sort_order: 100 })
        .select("*")
        .single()
      if (error) {
        if (error.code === "23505") return NextResponse.json({ error: "That exam already exists" }, { status: 409 })
        throw error
      }
      revalidateTag("cbt", "max")
      return NextResponse.json({ exam: data })
    }
    if (body.type === "subject") {
      const { data, error } = await db.from("cbt_subjects").insert({ slug, name, sort_order: 100 }).select("*").single()
      if (error) {
        if (error.code === "23505") return NextResponse.json({ error: "That subject already exists" }, { status: 409 })
        throw error
      }
      revalidateTag("cbt", "max")
      return NextResponse.json({ subject: data })
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (err) {
    console.error("POST admin cbt meta error:", err)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
