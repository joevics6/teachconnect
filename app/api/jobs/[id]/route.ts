// ============================================================
// app/api/jobs/[id]/route.ts
// GET /api/jobs/[id] — fetch single job with related jobs
// ============================================================
 
// Create this separately at app/api/jobs/[id]/route.ts:
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const jobId = params.id
 
    // Get current user (optional — affects is_saved and has_applied)
    const { data: { user } } = await supabase.auth.getUser()
 
    // Fetch the job with school info
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
 
    // Increment view count
    await supabase.rpc("increment_job_views", { job_id: jobId })
 
    // Check if current user has saved or applied (if logged in)
    let is_saved = false
    let has_applied = false
 
    if (user) {
      // Get teacher profile id
      const { data: teacherProfile } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
 
      if (teacherProfile) {
        // Check saved
        const { data: saved } = await supabase
          .from("saved_jobs")
          .select("id")
          .eq("teacher_id", teacherProfile.id)
          .eq("job_id", jobId)
          .single()
 
        is_saved = !!saved
 
        // Check applied
        const { data: application } = await supabase
          .from("applications")
          .select("id")
          .eq("teacher_id", teacherProfile.id)
          .eq("job_id", jobId)
          .single()
 
        has_applied = !!application
      }
    }
 
    // Fetch related jobs (same subject, different job)
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