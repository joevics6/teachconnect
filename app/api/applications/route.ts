// ============================================================
// app/api/applications/route.ts
// POST /api/applications — submit an application after quiz
// ============================================================

// Create at: app/api/applications/route.ts

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { job_id, mode, answers, score, passed, time_taken, written_feedback } = await request.json()

    const { data: teacher } = await supabase
      .from("teacher_profiles").select("id").eq("user_id", user.id).single()

    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })

    // Check not already applied
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("teacher_id", teacher.id)
      .eq("job_id", job_id)
      .single()

    if (existing) return NextResponse.json({ error: "Already applied" }, { status: 409 })

    // Save quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        teacher_id: teacher.id,
        job_id,
        score,
        passed,
        time_taken_seconds: time_taken,
        answers: answers || {},
        mode,
        written_feedback: written_feedback || null,
      })
      .select()
      .single()

    if (attemptError) throw attemptError

    // Create application
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({
        teacher_id: teacher.id,
        job_id,
        quiz_attempt_id: attempt.id,
        pipeline_stage: "applied",
      })
      .select()
      .single()

    if (appError) throw appError

    // Notify school
    const { data: job } = await supabase
      .from("jobs")
      .select("title, school_id, school_profiles(user_id, school_name)")
      .eq("id", job_id)
      .single()

    if (job) {
      const school = (Array.isArray(job.school_profiles) ? job.school_profiles[0] : job.school_profiles) as unknown as { user_id: string; school_name: string }
      const { data: teacherProfile } = await supabase
        .from("teacher_profiles")
        .select("full_name")
        .eq("id", teacher.id)
        .single()

      await supabase.from("notifications").insert({
        user_id: school.user_id,
        type: "new_application",
        title: "New Application Received",
        message: `${teacherProfile?.full_name} applied for ${job.title}. Quiz score: ${score}%`,
        metadata: { job_id, application_id: application.id, quiz_score: score, quiz_passed: passed },
      })
    }

    return NextResponse.json({ application, attempt })
  } catch (err) {
    console.error("POST application error:", err)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}