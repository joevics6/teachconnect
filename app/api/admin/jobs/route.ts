// ============================================================
// app/api/admin/jobs/route.ts
// GET — list jobs for the admin Jobs review page, filterable by
// status (defaults to pending_approval).
//
// Uses the service-role client for the actual read: jobs' own SELECT
// policies gate on status/deadline/ownership, none of which apply to
// an admin account, so an RLS-bound client would see nothing.
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
    const status = searchParams.get("status") || "pending_approval"

    const adminDb = createAdminClient()
    let query = adminDb
      .from("jobs")
      .select(`
        id, title, subject, employment_type, salary_min, salary_max,
        state, status, is_private, is_featured, quiz_enabled, deadline,
        created_at, school_id,
        school_profiles ( school_name, is_verified, logo_url )
      `)
      .order("created_at", { ascending: false })
      .limit(300)

    if (status !== "all") query = query.eq("status", status)

    const { data: jobs, error } = await query
    if (error) throw error

    return NextResponse.json({ jobs: jobs || [] })
  } catch (err) {
    console.error("GET admin jobs error:", err)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}
