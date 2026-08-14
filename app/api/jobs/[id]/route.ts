// ============================================================
// app/api/jobs/[id]/route.ts
// GET /api/jobs/[id] — fetch single job with related jobs
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: job, error } = await supabase
      .from("jobs_with_school")
      .select("*")
      .eq("id", jobId)
      .single()

    if (error || !job) {
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

    const { data: related } = await supabase
      .from("jobs_with_school")
      .select("id, title, school_name, school_state, salary_min, salary_max, employment_type")
      .eq("subject", job.subject)
      .eq("status", "active")
      .eq("is_private", false)
      .neq("id", jobId)
      .gte("deadline", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false })
      .limit(4)

    return NextResponse.json({
      job,
      related: related || [],
      is_saved,
      has_applied,
    })
  } catch (err) {
    console.error("GET /api/jobs/[id] error:", err)
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    )
  }
}
