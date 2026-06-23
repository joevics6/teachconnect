// ============================================================
// app/api/school/jobs/[id]/applicants/route.ts
// GET /api/school/jobs/[id]/applicants
// ============================================================
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const jobId = params.id
 
    // Verify auth
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
 
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, subject, quiz_enabled, quiz_mode, quiz_pass_mark, status, deadline")
      .eq("id", jobId)
      .eq("school_id", school.id)
      .single()
 
    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }
 
    // Fetch applications with teacher details using our view
    const { data: applicants, error } = await supabase
      .from("applications_with_details")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
 
    if (error) throw error
 
    // Build job info with counts
    const jobInfo = {
      ...job,
      total_applicants: applicants?.length || 0,
      passed_quiz: applicants?.filter((a) => a.quiz_passed).length || 0,
    }
 
    return NextResponse.json({
      job: jobInfo,
      applicants: applicants || [],
    })
  } catch (err) {
    console.error("GET applicants error:", err)
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 }
    )
  }
}
 