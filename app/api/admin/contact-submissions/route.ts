// ============================================================
// app/api/admin/contact-submissions/route.ts
// GET/PATCH — list and mark-read contact form submissions.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: submissions, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) throw error

    return NextResponse.json({ submissions: submissions || [] })
  } catch (err) {
    console.error("GET admin contact-submissions error:", err)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id, is_read } = await request.json()
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const { error } = await supabase
      .from("contact_submissions")
      .update({ is_read: is_read ?? true })
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("PATCH admin contact-submissions error:", err)
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
  }
}
