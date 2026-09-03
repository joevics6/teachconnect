// ============================================================
// app/api/admin/schools/route.ts
// GET  — list admin-created ("ghost") school profiles, searchable by
//        name. These are schools found on Facebook groups etc. that
//        haven't registered yet — admin creates a placeholder profile
//        so a real job can be posted and attract applicants before
//        the school signs up (see /dashboard/school/claim for the
//        other half of that flow).
// POST — create a new ghost school profile.
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
    const search = searchParams.get("search")?.trim()
    const excludeAnonymous = searchParams.get("exclude_anonymous") === "true"

    const adminDb = createAdminClient()
    let query = adminDb
      .from("school_profiles")
      .select(`
        id, school_name, school_type, state, lga, logo_url, about,
        is_claimed, created_by_admin, claim_note, is_anonymous, created_at,
        jobs ( count )
      `)
      .eq("created_by_admin", true)
      .order("created_at", { ascending: false })
      .limit(200)

    if (excludeAnonymous) query = query.eq("is_anonymous", false)
    if (search) query = query.ilike("school_name", `%${search}%`)

    const { data: schools, error } = await query
    if (error) throw error

    const shaped = (schools ?? []).map((s) => ({
      ...s,
      jobs_count: (s.jobs as unknown as { count: number }[])?.[0]?.count ?? 0,
    }))

    return NextResponse.json({ schools: shaped })
  } catch (err) {
    console.error("GET admin schools error:", err)
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const isAnonymous = body.is_anonymous === true

    // Anonymous stubs skip the name — it's always the same literal
    // placeholder, never something the admin types — but still need
    // a real type/location, since those came from the source post.
    const required = isAnonymous ? ["school_type", "state", "lga"] : ["school_name", "school_type", "state", "lga"]
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ error: `${field.replace("_", " ")} is required` }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { data: school, error } = await adminDb
      .from("school_profiles")
      .insert({
        user_id: null,
        school_name: isAnonymous ? "Confidential School" : body.school_name,
        school_type: body.school_type,
        school_levels: body.school_levels ?? [],
        state: body.state,
        lga: body.lga,
        address: isAnonymous ? null : (body.address || null),
        website: isAnonymous ? null : (body.website || null),
        logo_url: isAnonymous ? null : (body.logo_url || null),
        about: isAnonymous ? null : (body.about || null),
        is_verified: false,
        is_claimed: false,
        created_by_admin: true,
        is_anonymous: isAnonymous,
        claim_note: body.claim_note || null,
      })
      .select("id, school_name")
      .single()

    if (error) {
      console.error("Ghost school insert error:", error)
      return NextResponse.json({ error: "Something went wrong creating the school. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true, school })
  } catch (err) {
    console.error("POST admin schools error:", err)
    return NextResponse.json({ error: "Something went wrong creating the school. Please try again." }, { status: 500 })
  }
}
