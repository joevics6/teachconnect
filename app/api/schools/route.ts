// ============================================================
// app/api/schools/route.ts
// GET — public directory of registered (claimed) schools, for the
// /schools listing page. Ghost schools (created_by_admin, not yet
// claimed) are excluded — they don't have a real public profile to
// show yet, just a placeholder waiting for their owner to claim it.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim()
    const state = searchParams.get("state")?.trim()
    const schoolType = searchParams.get("school_type")?.trim()
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from("school_profiles")
      .select("id, school_name, slug, school_type, state, lga, town, logo_url, is_verified, about", { count: "exact" })
      .eq("is_claimed", true)
      .order("is_verified", { ascending: false })
      .order("school_name", { ascending: true })
      .range(from, to)

    if (search) query = query.ilike("school_name", `%${search}%`)
    if (state) query = query.eq("state", state)
    if (schoolType) query = query.eq("school_type", schoolType)

    const { data: schools, error, count } = await query
    if (error) throw error

    return NextResponse.json({ schools: schools ?? [], total: count ?? 0, page, limit })
  } catch (err) {
    console.error("GET /api/schools error:", err)
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 })
  }
}
