// ============================================================
// app/api/schools/search-unclaimed/route.ts
// GET — lets a logged-in school search admin-created ("ghost")
// school profiles by name, to find and claim their own listing (see
// /dashboard/school/claim). Uses the service-role client since an
// unclaimed profile has no owning user for RLS to key off of, and
// this is deliberately gated at the route level (must be logged in
// as a school) rather than opened up via a new public RLS policy.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== "school") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim()
    if (!search || search.length < 2) {
      return NextResponse.json({ schools: [] })
    }

    const adminDb = createAdminClient()
    const { data: schools, error } = await adminDb
      .from("school_profiles")
      .select("id, school_name, school_type, state, lga, logo_url")
      .eq("is_claimed", false)
      .eq("is_anonymous", false)
      .ilike("school_name", `%${search}%`)
      .limit(10)

    if (error) throw error

    return NextResponse.json({ schools: schools ?? [] })
  } catch (err) {
    console.error("GET search-unclaimed error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
