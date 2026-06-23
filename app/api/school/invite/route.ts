// ============================================================
// app/api/school/invite/route.ts
// POST /api/school/invite — invite a teacher to apply for a job
// ============================================================

// Create this at: app/api/school/invite/route.ts

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teacher_id, job_id } = await request.json()

    if (!teacher_id || !job_id) {
      return NextResponse.json(
        { error: "teacher_id and job_id are required" },
        { status: 400 }
      )
    }

    // Get school profile
    const { data: school } = await supabase
      .from("school_profiles")
      .select("id, school_name")
      .eq("user_id", user.id)
      .single()

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // Verify school owns the job
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("id", job_id)
      .eq("school_id", school.id)
      .eq("status", "active")
      .single()

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not active" },
        { status: 404 }
      )
    }

    // Check for existing invite
    const { data: existing } = await supabase
      .from("school_invites")
      .select("id, status")
      .eq("school_id", school.id)
      .eq("teacher_id", teacher_id)
      .eq("job_id", job_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "You have already invited this teacher for this job" },
        { status: 409 }
      )
    }

    // Create invite
    const { data: invite, error } = await supabase
      .from("school_invites")
      .insert({
        school_id: school.id,
        teacher_id,
        job_id,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    // Get teacher user_id for notification
    const { data: teacherProfile } = await supabase
      .from("teacher_profiles")
      .select("user_id, full_name")
      .eq("id", teacher_id)
      .single()

    if (teacherProfile) {
      await supabase.from("notifications").insert({
        user_id: teacherProfile.user_id,
        type: "job_invite",
        title: "You have been invited to apply",
        message: `${school.school_name} has invited you to apply for ${job.title}. Check your invites to respond.`,
        metadata: {
          invite_id: invite.id,
          job_id,
          school_id: school.id,
        },
      })
    }

    return NextResponse.json({ invite })
  } catch (err) {
    console.error("POST /api/school/invite error:", err)
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    )
  }
}