// ============================================================
// app/api/admin/contact-submissions/route.ts
// GET — list contact form submissions. Restricted to email
// addresses listed in the ADMIN_EMAILS environment variable
// (comma-separated), since there's no admin role in the schema.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isAdminEmail(email: string | undefined | null) {
  if (!email) return false
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.toLowerCase())
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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
