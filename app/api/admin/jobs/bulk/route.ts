// ============================================================
// app/api/admin/jobs/bulk/route.ts
// POST — bulk-approve jobs awaiting review.
//   { action: "approve", ids: string[] }  — approve the selected jobs
//   { action: "approve", all: true }      — approve every unapproved job
// Only jobs currently in "pending_approval" are touched, so a stale
// selection can never re-activate a rejected or closed job.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { generateAndSaveSocialPost } from "@/lib/social-post"
import { ensureJobSeoContent } from "@/lib/job-seo"
import { notifyJobsPublished } from "@/lib/index-notify"
import { revalidateTag } from "next/cache"
import { after } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    if (body.action !== "approve") {
      return NextResponse.json({ error: "action must be 'approve'" }, { status: 400 })
    }

    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((i: unknown) => typeof i === "string") : []
    if (!body.all && ids.length === 0) {
      return NextResponse.json({ error: "No jobs selected" }, { status: 400 })
    }

    const adminDb = createAdminClient()
    let query = adminDb
      .from("jobs")
      .update({ status: "active" })
      .eq("status", "pending_approval")
    if (!body.all) query = query.in("id", ids)

    const { data: approved, error } = await query.select("id")
    if (error) throw error

    const approvedIds = (approved || []).map((j) => j.id as string)

    // SEO content + social posts: best-effort, run after the response in
    // small batches so a large bulk approval doesn't hammer Gemini all
    // at once and never delays the admin. The cache is burst again at
    // the end so the new content shows up without waiting out the TTL.
    after(async () => {
      const BATCH = 3
      for (let i = 0; i < approvedIds.length; i += BATCH) {
        await Promise.all(
          approvedIds.slice(i, i + BATCH).map(async (id) => {
            await ensureJobSeoContent(id)
            await generateAndSaveSocialPost(id).catch((err) =>
              console.error("Social post generation failed for job", id, err)
            )
          })
        )
      }
      revalidateTag("jobs", "max")
      await notifyJobsPublished(approvedIds)
    })

    revalidateTag("jobs", "max")
    revalidateTag("schools", "max")

    return NextResponse.json({ ok: true, approved: approvedIds.length })
  } catch (err) {
    console.error("POST admin jobs bulk error:", err)
    return NextResponse.json({ error: "Failed to approve jobs" }, { status: 500 })
  }
}
