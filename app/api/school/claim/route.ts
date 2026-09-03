// ============================================================
// app/api/school/claim/route.ts
// GET  — the logged-in school's own claim request history/status.
// POST — submit a request to claim an admin-created ("ghost") school
// profile. Admin reviews and approves/rejects (see
// api/admin/claims/[id]) — this route only ever creates a pending
// request, never claims anything itself.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== "school") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: requests, error } = await supabase
      .from("school_claim_requests")
      .select("id, school_id, message, status, created_at, reviewed_at, school_profiles(school_name, state, lga, logo_url)")
      .eq("requester_user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ requests: requests ?? [] })
  } catch (err) {
    console.error("GET school claim error:", err)
    return NextResponse.json({ error: "Failed to load your claim requests" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== "school") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const schoolId: string | undefined = body.school_id
    if (!schoolId) return NextResponse.json({ error: "Select a school to claim" }, { status: 400 })

    const adminDb = createAdminClient()

    const { data: ghostSchool } = await adminDb
      .from("school_profiles").select("id, is_claimed, created_by_admin").eq("id", schoolId).single()
    if (!ghostSchool || !ghostSchool.created_by_admin) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }
    if (ghostSchool.is_claimed) {
      return NextResponse.json({ error: "This school has already been claimed" }, { status: 409 })
    }

    // One pending request per school per requester — resubmitting
    // while already pending would just clutter the admin queue.
    const { data: existing } = await supabase
      .from("school_claim_requests")
      .select("id")
      .eq("school_id", schoolId)
      .eq("requester_user_id", user.id)
      .eq("status", "pending")
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: "You already have a pending claim request for this school" }, { status: 409 })
    }

    const { error } = await supabase
      .from("school_claim_requests")
      .insert({
        school_id: schoolId,
        requester_user_id: user.id,
        message: body.message?.trim() || null,
      })

    if (error) {
      console.error("Claim request insert error:", error)
      return NextResponse.json({ error: "Something went wrong submitting your claim. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("POST school claim error:", err)
    return NextResponse.json({ error: "Something went wrong submitting your claim. Please try again." }, { status: 500 })
  }
}
