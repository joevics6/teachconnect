// ============================================================
// app/api/admin/claims/[id]/route.ts
// PATCH — approve or reject a school's request to claim an
// admin-created ("ghost") school profile.
//
// Approval is a MERGE, not a simple "set user_id on the ghost row":
// every school registration already creates its own school_profiles
// row (school_profiles.user_id is UNIQUE), so the requester almost
// always already has one. Approving therefore:
//   1. Moves every job from the ghost school to the requester's real
//      school_id (jobs are looked up by school_id everywhere in the
//      app, so this alone makes them show up in the requester's
//      dashboard immediately — no other data migration needed).
//   2. Backfills a few profile fields on the requester's row ONLY if
//      they're currently empty, so legitimate data they already
//      entered is never overwritten.
//   3. Deletes the now-empty ghost row.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { notifyUser } from "@/lib/notifications"

const BACKFILL_FIELDS = ["logo_url", "about", "website"] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params
    const supabase = await createClient()
    const adminUser = await requireAdmin(supabase)
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const action = body.action as "approve" | "reject"
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const adminDb = createAdminClient()

    const { data: claim } = await adminDb
      .from("school_claim_requests")
      .select("id, school_id, requester_user_id, status")
      .eq("id", claimId)
      .single()

    if (!claim) return NextResponse.json({ error: "Claim request not found" }, { status: 404 })
    if (claim.status !== "pending") {
      return NextResponse.json({ error: "This claim request has already been reviewed" }, { status: 409 })
    }

    if (action === "reject") {
      await adminDb
        .from("school_claim_requests")
        .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: adminUser.id })
        .eq("id", claimId)
      return NextResponse.json({ success: true })
    }

    // ── Approve ──────────────────────────────────────────────
    const { data: ghostSchool } = await adminDb
      .from("school_profiles")
      .select("id, school_name, logo_url, about, website, is_claimed")
      .eq("id", claim.school_id)
      .single()
    if (!ghostSchool) return NextResponse.json({ error: "School no longer exists" }, { status: 404 })
    if (ghostSchool.is_claimed) {
      return NextResponse.json({ error: "This school was already claimed by someone else" }, { status: 409 })
    }

    const { data: requesterSchool } = await adminDb
      .from("school_profiles")
      .select("id, logo_url, about, website")
      .eq("user_id", claim.requester_user_id)
      .single()
    if (!requesterSchool) {
      return NextResponse.json(
        { error: "This user doesn't have a school account to merge into. Ask them to finish registration first." },
        { status: 400 }
      )
    }

    // Move the jobs over — this is the part that actually matters.
    const { error: moveError } = await adminDb
      .from("jobs")
      .update({ school_id: requesterSchool.id })
      .eq("school_id", ghostSchool.id)
    if (moveError) {
      console.error("Claim approval — job move failed:", moveError)
      return NextResponse.json({ error: "Something went wrong merging this school's jobs. Please try again." }, { status: 500 })
    }

    // Defensive — school_invites also carries its own school_id, though
    // a ghost school (no login) should never actually have any.
    await adminDb.from("school_invites").update({ school_id: requesterSchool.id }).eq("school_id", ghostSchool.id)

    // Backfill only what's currently empty on the real profile.
    const backfill: Record<string, unknown> = {}
    for (const field of BACKFILL_FIELDS) {
      if (!requesterSchool[field] && ghostSchool[field]) backfill[field] = ghostSchool[field]
    }
    if (Object.keys(backfill).length > 0) {
      await adminDb.from("school_profiles").update(backfill).eq("id", requesterSchool.id)
    }

    await adminDb.from("school_profiles").delete().eq("id", ghostSchool.id)

    await adminDb
      .from("school_claim_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: adminUser.id })
      .eq("id", claimId)

    // Transactional confirmation — always sends, no prefKey.
    await notifyUser(adminDb, {
      userId: claim.requester_user_id,
      role: "school",
      type: "school_claim_approved",
      title: "School Claim Approved",
      message: `Your claim for "${ghostSchool.school_name}" has been approved. Any jobs already posted for it now show up in your dashboard.`,
      metadata: { school_id: requesterSchool.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("PATCH admin claim error:", err)
    return NextResponse.json({ error: "Something went wrong reviewing this claim. Please try again." }, { status: 500 })
  }
}
