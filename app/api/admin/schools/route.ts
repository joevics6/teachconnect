// ============================================================
// app/api/admin/schools/route.ts
// GET  — list school profiles, searchable by name. Includes BOTH
//        admin-created ("ghost") placeholders and real, registered
//        schools — admin needs to be able to manage/delete either
//        (spam registrations, duplicates, a school that closed down),
//        not just the ghost ones this route originally only listed.
// POST — create a new ghost school profile.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { generateUniqueSchoolSlug } from "@/lib/slug"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim()
    const excludeAnonymous = searchParams.get("exclude_anonymous") === "true"
    // "all" (default) | "ghost" (admin-created, unclaimed) | "registered" (real accounts)
    const type = searchParams.get("type") || "all"

    const adminDb = createAdminClient()
    let query = adminDb
      .from("school_profiles")
      .select(`
        id, school_name, school_type, state, lga, town, logo_url, about,
        is_claimed, created_by_admin, claim_note, is_anonymous, is_verified,
        user_id, created_at,
        jobs ( count )
      `)
      .order("created_at", { ascending: false })
      .limit(200)

    if (type === "ghost") query = query.eq("created_by_admin", true)
    if (type === "registered") query = query.eq("is_claimed", true)
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
    const finalSchoolName = isAnonymous ? "Confidential School" : body.school_name
    const slug = await generateUniqueSchoolSlug(adminDb, finalSchoolName)
    const { data: school, error } = await adminDb
      .from("school_profiles")
      .insert({
        user_id: null,
        school_name: finalSchoolName,
        slug,
        school_type: body.school_type,
        school_levels: body.school_levels ?? [],
        state: body.state,
        lga: body.lga,
        town: body.town || null,
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
      .select("id, school_name, slug")
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
