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
    const status = searchParams.get("status") || "pending"

    const adminDb = createAdminClient()
    let query = adminDb
      .from("school_claim_requests")
      .select(`
        id, school_id, message, status, created_at, reviewed_at,
        school_profiles ( school_name, state, lga, logo_url ),
        requester:users!school_claim_requests_requester_user_id_fkey ( email )
      `)
      .order("created_at", { ascending: false })
      .limit(200)

    if (status !== "all") query = query.eq("status", status)

    const { data: requests, error } = await query
    if (error) throw error

    return NextResponse.json({ requests: requests ?? [] })
  } catch (err) {
    console.error("GET admin claims error:", err)
    return NextResponse.json({ error: "Failed to fetch claim requests" }, { status: 500 })
  }
}
