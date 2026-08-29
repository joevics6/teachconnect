// ============================================================
// app/api/jobs/[id]/route.ts
// GET /api/jobs/[id] — fetch single job with related jobs
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getJobById, getRelatedJobs } from "@/lib/cache/jobs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const job = await getJobById(jobId)

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      )
    }

    // A job that hasn't been approved yet (pending_approval, rejected, or
    // still a draft) shouldn't be reachable by anyone except the school
    // that owns it — previously this route returned any job by id
    // regardless of status, so a pending job's direct URL worked for
    // guests, other schools, and teachers alike, before an admin had
    // ever approved it. "closed" is a normal post-approval lifecycle
    // state (was live, now closed) and stays publicly viewable — the
    // frontend already shows a graceful "This job has closed" state
    // for it.
    const UNAPPROVED_STATUSES = ["pending_approval", "rejected", "draft"]
    if (UNAPPROVED_STATUSES.includes(job.status)) {
      let isOwner = false
      if (user) {
        const { data: ownSchool } = await supabase
          .from("school_profiles")
          .select("id")
          .eq("user_id", user.id)
          .eq("id", job.school_id)
          .single()
        isOwner = !!ownSchool
      }
      if (!isOwner) {
        return NextResponse.json(
          { error: "Job not found" },
          { status: 404 }
        )
      }
    } else {
      await supabase.rpc("increment_job_views", { job_id: jobId })
    }

    let is_saved = false
    let has_applied = false

    if (user && !UNAPPROVED_STATUSES.includes(job.status)) {
      const { data: teacherProfile } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (teacherProfile) {
        const { data: saved } = await supabase
          .from("saved_jobs")
          .select("id")
          .eq("teacher_id", teacherProfile.id)
          .eq("job_id", jobId)
          .single()

        is_saved = !!saved

        const { data: application } = await supabase
          .from("applications")
          .select("id")
          .eq("teacher_id", teacherProfile.id)
          .eq("job_id", jobId)
          .single()

        has_applied = !!application
      }
    }

    const related = await getRelatedJobs(job.subject, jobId)

    // External contact info (email/phone/website) is only for signed-in
    // users — strip it from the payload entirely for guests rather than
    // just hiding it client-side, since anyone can read the raw network
    // response regardless of what the UI shows.
    const jobForResponse = user
      ? job
      : { ...job, external_apply_value: null }

    return NextResponse.json({
      job: jobForResponse,
      related,
      is_saved,
      has_applied,
      requires_auth_for_external_apply: !user && !!job.external_apply_enabled && !!job.external_apply_value,
    })
  } catch (err) {
    console.error("GET /api/jobs/[id] error:", err)
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    )
  }
}
