// ============================================================
// app/api/admin/jobs/[id]/route.ts
// PATCH — approve (status -> active) or reject (status -> rejected)
// a pending job.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { revalidateTag } from "next/cache"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const { action } = await request.json()
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { data: job } = await adminDb.from("jobs").select("id, status").eq("id", id).single()
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    const { error } = await adminDb
      .from("jobs")
      .update({ status: action === "approve" ? "active" : "rejected" })
      .eq("id", id)
    if (error) throw error

    // DORMANT — see notifyMatchingTeachersOfNewJob in lib/notifications.ts
    // for why (Resend cost/limits at fan-out scale). Enable once on SES:
    //
    // if (action === "approve") {
    //   const { data: fullJob } = await adminDb
    //     .from("jobs")
    //     .select("title, subject, teaching_levels")
    //     .eq("id", id)
    //     .single()
    //   if (fullJob) {
    //     await notifyMatchingTeachersOfNewJob({
    //       jobId: id,
    //       title: fullJob.title,
    //       subject: fullJob.subject,
    //       teachingLevels: fullJob.teaching_levels ?? [],
    //     })
    //   }
    // }

    // This is the moment a job actually becomes (or stops being)
    // publicly visible — burst both caches immediately rather than
    // waiting on their TTL.
    revalidateTag("jobs", "max")
    revalidateTag("schools", "max")

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("PATCH admin job error:", err)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}
