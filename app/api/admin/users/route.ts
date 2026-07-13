// ============================================================
// app/api/admin/users/route.ts
// GET — list teachers + schools for the admin Users page.
// PATCH — verify a school, or disable/enable either account type.
//
// Teacher emails live only in Supabase's auth.users table, so they're
// fetched separately via the service-role Admin API (lib/supabase/admin.ts)
// rather than a normal query — auth.users isn't reachable through RLS.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get("search") || "").trim()

    let teacherQuery = supabase
      .from("teacher_profiles")
      .select("id, user_id, full_name, phone, state, subjects, is_visible, is_disabled, created_at")
      .order("created_at", { ascending: false })
      .limit(300)
    if (search) teacherQuery = teacherQuery.ilike("full_name", `%${search}%`)

    let schoolQuery = supabase
      .from("school_profiles")
      .select("id, user_id, school_name, contact_name, contact_email, contact_phone, state, is_verified, is_disabled, created_at")
      .order("created_at", { ascending: false })
      .limit(300)
    if (search) schoolQuery = schoolQuery.ilike("school_name", `%${search}%`)

    const [{ data: teachers, error: tErr }, { data: schools, error: sErr }] =
      await Promise.all([teacherQuery, schoolQuery])

    if (tErr) throw tErr
    if (sErr) throw sErr

    // Teacher emails only exist in Supabase's auth.users table, which
    // needs the service-role key to query. Build a full id->email map
    // once (paginated) rather than one API call per teacher.
    const emailByUserId = new Map<string, string>()
    if ((teachers || []).length > 0) {
      try {
        const adminClient = createAdminClient()
        let page = 1
        const perPage = 1000
        while (true) {
          const { data, error: listErr } = await adminClient.auth.admin.listUsers({ page, perPage })
          if (listErr) throw listErr
          for (const u of data.users) {
            if (u.email) emailByUserId.set(u.id, u.email)
          }
          if (data.users.length < perPage) break
          page++
        }
      } catch (err) {
        console.error("Failed to fetch auth emails (service role key missing or invalid?):", err)
      }
    }

    const users = [
      ...(teachers || []).map((t) => ({
        id: t.id,
        user_id: t.user_id,
        role: "teacher" as const,
        name: t.full_name,
        email: emailByUserId.get(t.user_id) || null,
        phone: t.phone,
        state: t.state,
        subjects: t.subjects,
        is_verified: null,
        is_visible: t.is_visible,
        is_disabled: t.is_disabled,
        created_at: t.created_at,
      })),
      ...(schools || []).map((s) => ({
        id: s.id,
        user_id: s.user_id,
        role: "school" as const,
        name: s.school_name,
        email: s.contact_email,
        phone: s.contact_phone,
        state: s.state,
        contact_name: s.contact_name,
        is_verified: s.is_verified,
        is_visible: null,
        is_disabled: s.is_disabled,
        created_at: s.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ users })
  } catch (err) {
    console.error("GET admin users error:", err)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { role, id, action, value } = await request.json()
    if (!role || !id || !action) {
      return NextResponse.json({ error: "role, id, and action required" }, { status: 400 })
    }
    if (!["teacher", "school"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const table = role === "teacher" ? "teacher_profiles" : "school_profiles"
    const updates: Record<string, boolean> = {}

    if (action === "toggle_disabled") {
      updates.is_disabled = !!value
    } else if (action === "verify" && role === "school") {
      updates.is_verified = !!value
    } else {
      return NextResponse.json({ error: "Invalid action for this role" }, { status: 400 })
    }

    const { error } = await supabase.from(table).update(updates).eq("id", id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("PATCH admin users error:", err)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
