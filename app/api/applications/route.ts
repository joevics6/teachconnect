import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { job_id, mode, answers, score, passed, time_taken, written_feedback, cover_letter } = await request.json()

    if (!job_id) return NextResponse.json({ error: "Job ID required" }, { status: 400 })

    // Get teacher profile
    const { data: teacherRows } = await supabase
      .from("teacher_profiles")
      .select("id, full_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const teacher = (teacherRows ?? [])[0] ?? null

    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })

    // Check not already applied
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("teacher_id", teacher.id)
      .eq("job_id", job_id)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: "Already applied" }, { status: 409 })

    // Only save quiz attempt if this was a quiz application
    let attemptId: string | null = null
    const isQuizApplication = mode !== null && mode !== undefined

    if (isQuizApplication) {
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
        .select("id")
        .single()

      if (attemptError) throw attemptError
      attemptId = attempt.id
    }

    // Create application
    const applicationData: Record<string, unknown> = {
      teacher_id: teacher.id,
      job_id,
      quiz_attempt_id: attemptId,
      pipeline_stage: "applied",
    }
    // Only include cover_letter if provided (column may not exist in older DBs)
    if (cover_letter) applicationData.cover_letter = cover_letter

    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert(applicationData)
      .select()
      .single()

    if (appError) {
      // If cover_letter column doesn't exist, retry without it
      if (appError.code === "42703" && cover_letter) {
        delete applicationData.cover_letter
        const { data: app2, error: app2Error } = await supabase
          .from("applications")
          .insert(applicationData)
          .select()
          .single()
        if (app2Error) throw app2Error
        Object.assign(application ?? {}, app2)
      } else {
        throw appError
      }
    }

    // Notify school
    const { data: job } = await supabase
      .from("jobs")
      .select("title, school_profiles(user_id, school_name)")
      .eq("id", job_id)
      .single()

    if (job) {
      const school = (Array.isArray(job.school_profiles)
        ? job.school_profiles[0]
        : job.school_profiles) as unknown as { user_id: string; school_name: string }

      const scoreText = score !== null && score !== undefined ? ` Quiz score: ${score}%.` : ""
      await supabase.from("notifications").insert({
        user_id: school.user_id,
        type: "new_application",
        title: "New Application Received",
        message: `${teacher.full_name} applied for ${(job as unknown as { title: string }).title}.${scoreText}`,
        metadata: { job_id, application_id: application.id, quiz_score: score, quiz_passed: passed },
      })
    }

    // Notify teacher — quiz result or plain confirmation
    if (isQuizApplication) {
      const jobTitle = (job as unknown as { title: string })?.title || "the position"
      const schoolName = ((Array.isArray((job as unknown as { school_profiles: unknown })?.school_profiles)
        ? ((job as unknown as { school_profiles: { school_name: string }[] })?.school_profiles)[0]
        : (job as unknown as { school_profiles: { school_name: string } })?.school_profiles) as { school_name: string })?.school_name || "The school"

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: passed ? "quiz_passed" : "quiz_failed",
        title: passed ? "Quiz passed — application submitted!" : "Quiz not passed",
        message: passed
          ? `You scored ${score}% on the ${jobTitle} quiz at ${schoolName}. Your application has been submitted.`
          : `You scored ${score}% on the ${jobTitle} quiz at ${schoolName}. The required pass mark was not met.`,
        metadata: { job_id, application_id: application?.id, quiz_score: score },
      })
    } else {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "application_submitted",
        title: "Application submitted",
        message: `Your application has been sent. The school will review your profile and be in touch if shortlisted.`,
        metadata: { job_id, application_id: application?.id },
      })
    }

    return NextResponse.json({ application, attempt_id: attemptId })
  } catch (err) {
    console.error("POST application error:", err)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
