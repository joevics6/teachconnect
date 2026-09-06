// ============================================================
// app/api/admin/jobs/[id]/route.ts
// GET   — fetch any job, full detail, for the admin edit page.
// PATCH — either:
//   { action: "approve" | "reject" } — the existing review flow, or
//   a full-field edit payload (same shape as the school-facing PATCH,
//   minus ownership restriction — admin can edit any job).
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { generateAndSaveSocialPost } from "@/lib/social-post"
import { revalidateTag } from "next/cache"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const adminDb = createAdminClient()
    const { data: job, error } = await adminDb
      .from("jobs")
      .select("*, school_profiles ( school_name )")
      .eq("id", id)
      .single()

    if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    return NextResponse.json({ job })
  } catch (err) {
    console.error("GET admin job error:", err)
    return NextResponse.json({ error: "Failed to load job" }, { status: 500 })
  }
}

const EDITABLE_FIELDS = [
  "title", "subject", "teaching_levels", "description", "deadline",
  "employment_type", "positions", "salary_min", "salary_max",
  "accommodation_offered", "accommodation_type", "benefits",
  "required_qualifications", "preferred_qualifications",
  "is_featured", "is_private",
  "external_apply_enabled", "external_apply_value",
  "quiz_enabled", "quiz_pass_mark", "quiz_mode", "quiz_duration", "quiz_question_count",
]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const adminDb = createAdminClient()

    // Full-field edit — no `action` in the payload means this is the
    // admin edit page saving changes, not the approve/reject review flow.
    if (body.action === undefined) {
      const { data: existingJob } = await adminDb.from("jobs").select("id").eq("id", id).single()
      if (!existingJob) return NextResponse.json({ error: "Job not found" }, { status: 404 })

      const updates: Record<string, unknown> = {}
      EDITABLE_FIELDS.forEach((f) => { if (body[f] !== undefined) updates[f] = body[f] })

      // Same derivation as job creation and the school-facing edit route
      // — never trust a raw pass-through value for these.
      if (body.quiz_subject_levels !== undefined || body.quiz_enabled !== undefined) {
        const quizEnabled = body.quiz_enabled ?? false
        const subjectLevels = body.quiz_subject_levels || []
        updates.quiz_subjects = quizEnabled ? subjectLevels.map((sl: { subject: string }) => sl.subject) : []
        updates.quiz_difficulty = quizEnabled ? (subjectLevels[0]?.level || null) : null
        updates.quiz_subject_levels = quizEnabled ? subjectLevels : null
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 })
      }

      const { error } = await adminDb.from("jobs").update(updates).eq("id", id)
      if (error) {
        console.error("Admin job edit error:", error)
        return NextResponse.json({ error: "Something went wrong saving changes. Please try again." }, { status: 500 })
      }

      revalidateTag("jobs", "max")
      return NextResponse.json({ success: true })
    }

    const { action } = body
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 })
    }

    const { data: job } = await adminDb.from("jobs").select("id, status").eq("id", id).single()
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    const { error } = await adminDb
      .from("jobs")
      .update({ status: action === "approve" ? "active" : "rejected" })
      .eq("id", id)
    if (error) throw error

    // The moment a job goes live is the moment it needs a social post.
    // Best-effort — generateAndSaveSocialPost never throws, so a Gemini
    // hiccup here can't block the approval itself; admin can retry via
    // the "Regenerate" action on /admin/jobs (POST .../[id]/social).
    if (action === "approve") {
      generateAndSaveSocialPost(id).catch((err) =>
        console.error("Social post generation failed for job", id, err)
      )
    }

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
