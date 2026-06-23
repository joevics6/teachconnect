// ============================================================
// app/api/school/jobs/[id]/applicants/[appId]/route.ts
// PATCH /api/school/jobs/[id]/applicants/[appId]
// Update pipeline stage or notes
// ============================================================
 
// Create this at: app/api/school/jobs/[id]/applicants/[appId]/route.ts
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; appId: string } }
) {
  try {
    const supabase = await createClient()
    const { id: jobId, appId } = params
 
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
 
    // Verify school owns this job
    const { data: school } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()
 
    if (!school) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
 
    // Verify job belongs to school
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
 
    // If hired, optionally send notification to teacher
    if (updates.pipeline_stage === "hired") {
      const { data: application } = await supabase
        .from("applications")
        .select("teacher_id, teacher_profiles(user_id)")
        .eq("id", appId)
        .single()
 
      if (application?.teacher_profiles) {
        const teacherProfile = application.teacher_profiles as { user_id: string }
        await supabase.from("notifications").insert({
          user_id: teacherProfile.user_id,
          type: "application_hired",
          title: "Congratulations! You have been hired",
          message: `You have been selected for the position at the school. Check your email for further details.`,
          metadata: { job_id: jobId, application_id: appId },
        })
      }
    }
 
    // If shortlisted, send notification to teacher
    if (updates.pipeline_stage === "shortlisted") {
      const { data: application } = await supabase
        .from("applications")
        .select("teacher_id, teacher_profiles(user_id), jobs(title, school_profiles(school_name))")
        .eq("id", appId)
        .single()
 
      if (application?.teacher_profiles) {
        const teacherProfile = application.teacher_profiles as { user_id: string }
        const jobData = application.jobs as { title: string; school_profiles: { school_name: string } }
        await supabase.from("notifications").insert({
          user_id: teacherProfile.user_id,
          type: "application_shortlisted",
          title: "Your application has been shortlisted",
          message: `${jobData?.school_profiles?.school_name} has shortlisted you for ${jobData?.title}.`,
          metadata: { job_id: jobId, application_id: appId },
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