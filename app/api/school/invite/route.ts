import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { teacher_id, job_id } = await request.json()
    if (!teacher_id || !job_id) {
      return NextResponse.json({ error: "teacher_id and job_id are required" }, { status: 400 })
    }

    // Get school profile
    const { data: schoolRows } = await supabase
      .from("school_profiles").select("id, school_name")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1)
    const school = (schoolRows ?? [])[0] ?? null
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

    // Verify school owns the job
    const { data: jobRows } = await supabase
      .from("jobs").select("id, title")
      .eq("id", job_id).eq("school_id", school.id).eq("status", "active").limit(1)
    const job = (jobRows ?? [])[0] ?? null
    if (!job) return NextResponse.json({ error: "Job not found or not active" }, { status: 404 })

    // Check for existing invite
    const { data: existing } = await supabase
      .from("school_invites").select("id, status")
      .eq("school_id", school.id).eq("teacher_id", teacher_id).eq("job_id", job_id).limit(1)
    if ((existing ?? []).length > 0) {
      return NextResponse.json({ error: "You have already invited this teacher for this job" }, { status: 409 })
    }

    // Create invite
    const { data: inviteRows, error } = await supabase
      .from("school_invites")
      .insert({ school_id: school.id, teacher_id, job_id, status: "pending" })
      .select()
    if (error) throw error
    const invite = (inviteRows ?? [])[0]

    // Notify teacher
    const { data: teacherRows } = await supabase
      .from("teacher_profiles").select("user_id, full_name")
      .eq("id", teacher_id).order("created_at", { ascending: false }).limit(1)
    const teacherProfile = (teacherRows ?? [])[0] ?? null

    if (teacherProfile) {
      await supabase.from("notifications").insert({
        user_id: teacherProfile.user_id,
        type: "job_invite",
        title: "You have been invited to apply",
        message: `${school.school_name} has invited you to apply for ${job.title}. Check your invites tab to respond.`,
        metadata: { invite_id: invite?.id, job_id, school_id: school.id },
      })
    }

    return NextResponse.json({ invite, success: true })
  } catch (err) {
    console.error("POST /api/school/invite error:", err)
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 })
  }
}
