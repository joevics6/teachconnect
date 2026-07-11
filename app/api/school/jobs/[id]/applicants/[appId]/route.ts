// ============================================================
// app/api/school/jobs/[id]/applicants/[appId]/route.ts
// PATCH — Update pipeline stage or notes
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notifyUser } from "@/lib/notifications"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  try {
    const { id: jobId, appId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: school } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!school) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("school_id", school.id)
      .single()

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const body = await request.json()
    const allowedFields = ["pipeline_stage", "school_notes"]
    const updates: Record<string, unknown> = {}

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) updates[field] = body[field]
    })

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", appId)
      .eq("job_id", jobId)
      .select()
      .single()

    if (error) throw error

    if (updates.pipeline_stage === "hired") {
      const { data: application } = await supabase
        .from("applications")
        .select("teacher_id, teacher_profiles(user_id)")
        .eq("id", appId)
        .single()

      if (application?.teacher_profiles) {
        const teacherProfile = (Array.isArray(application.teacher_profiles) ? application.teacher_profiles[0] : application.teacher_profiles) as unknown as { user_id: string }
        await notifyUser(supabase, {
          userId: teacherProfile.user_id,
          type: "application_hired",
          title: "Congratulations! You have been hired",
          message: `You have been selected for the position at the school. Check your email for further details.`,
          metadata: { job_id: jobId, application_id: appId },
          prefKey: "application_updates",
        })
      }
    }

    // Notify teacher on any meaningful stage change
    const notifiableStages: Record<string, { type: string; title: string; message: (school: string, job: string) => string }> = {
      shortlisted: {
        type: "application_shortlisted",
        title: "Your application has been shortlisted",
        message: (school, job) => `${school} has shortlisted you for ${job}. They may be in touch soon.`,
      },
      interviewed: {
        type: "application_interviewed",
        title: "Interview stage reached",
        message: (school, job) => `${school} has moved you to the interview stage for ${job}.`,
      },
      offered: {
        type: "application_offered",
        title: "You have received a job offer!",
        message: (school, job) => `${school} has made you an offer for ${job}. Log in to review the details.`,
      },
      rejected: {
        type: "application_rejected",
        title: "Application update",
        message: (school, job) => `Your application for ${job} at ${school} was not successful this time.`,
      },
    }

    if (updates.pipeline_stage && notifiableStages[updates.pipeline_stage as string]) {
      const stageInfo = notifiableStages[updates.pipeline_stage as string]
      const { data: application } = await supabase
        .from("applications")
        .select("teacher_id, teacher_profiles(user_id), jobs(title, school_profiles(school_name))")
        .eq("id", appId)
        .single()

      if (application?.teacher_profiles) {
        const teacherProfile = (Array.isArray(application.teacher_profiles)
          ? application.teacher_profiles[0]
          : application.teacher_profiles) as unknown as { user_id: string }
        const jobData = (Array.isArray(application.jobs)
          ? application.jobs[0]
          : application.jobs) as unknown as { title: string; school_profiles: { school_name: string } }
        const schoolName = jobData?.school_profiles?.school_name || "The school"
        const jobTitle = jobData?.title || "the position"

        await notifyUser(supabase, {
          userId: teacherProfile.user_id,
          type: stageInfo.type,
          title: stageInfo.title,
          message: stageInfo.message(schoolName, jobTitle),
          metadata: { job_id: jobId, application_id: appId },
          prefKey: "application_updates",
        })
      }
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error("PATCH applicant error:", err)
    return NextResponse.json(
      { error: "Failed to update applicant" },
      { status: 500 }
    )
  }
}