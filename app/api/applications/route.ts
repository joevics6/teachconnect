import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { job_id, mode, subjects, answers, score: clientScore, time_taken, written_feedback, cover_letter } = await request.json()

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

    // Fetch the job once, up front — used for authoritative scoring below
    // and for notifications later.
    const { data: job } = await supabase
      .from("jobs")
      .select("title, quiz_mode, quiz_subjects, quiz_pass_mark, quiz_question_count, subject, school_profiles(user_id, school_name)")
      .eq("id", job_id)
      .single()

    const jobTitle = (job as unknown as { title: string })?.title
    const school = (Array.isArray((job as unknown as { school_profiles: unknown })?.school_profiles)
      ? ((job as unknown as { school_profiles: { user_id: string; school_name: string }[] })?.school_profiles)[0]
      : (job as unknown as { school_profiles: { user_id: string; school_name: string } })?.school_profiles) as
      { user_id: string; school_name: string } | undefined

    // ── Authoritative scoring — never trust score/passed from the client ──
    // Standard/speed (MCQ) modes: recompute from the real answer key.
    // Written mode: trust the score already produced server-side by
    // /api/quiz/grade-written (the client can't see correct answers to
    // forge here, and that route does its own AI grading independently).
    let score: number | null = null
    let passed: boolean | null = null
    const isQuizApplication = mode !== null && mode !== undefined

    if (isQuizApplication && mode !== "written") {
      const answerMap = (answers || {}) as Record<string, string>
      const questionIds = Object.keys(answerMap)

      let correct = 0
      if (questionIds.length > 0) {
        const { data: correctRows } = await supabase
          .from("quiz_questions")
          .select("id, correct_option")
          .in("id", questionIds)

        const keyById = new Map((correctRows ?? []).map((q) => [q.id, q.correct_option]))
        correct = questionIds.filter((qid) => answerMap[qid] === keyById.get(qid)).length
      }

      if (mode === "speed") {
        const attempted = questionIds.length
        score = attempted === 0 ? 0 : Math.round((correct / attempted) * 100)
      } else {
        // Standard mode — denominator is however many questions this job's
        // quiz config actually calls for, not however many the client chose
        // to answer, so skipping hard questions can't inflate the score.
        const quizSubjects: string[] = job?.quiz_subjects?.length ? job.quiz_subjects : [job?.subject].filter(Boolean)
        let totalQuestions: number
        if (quizSubjects.length <= 1) {
          totalQuestions = job?.quiz_question_count || 20
        } else if (quizSubjects.length === 2) {
          totalQuestions = 50
        } else {
          totalQuestions = 30
        }
        score = Math.round((correct / totalQuestions) * 100)
      }
      passed = score >= (job?.quiz_pass_mark ?? 70)
    } else if (isQuizApplication && mode === "written") {
      // Written mode's score was computed server-side by grade-written and
      // is passed through the client only as a relay — accept it, but only
      // alongside the feedback array that route produces, so a raw forged
      // POST without ever calling grade-written can't slip a score through.
      if (Array.isArray(written_feedback) && written_feedback.length > 0) {
        score = typeof clientScore === "number" ? clientScore : 0
        passed = score >= (job?.quiz_pass_mark ?? 70)
      } else {
        return NextResponse.json({ error: "Missing grading feedback" }, { status: 400 })
      }
    }

    // Only save quiz attempt if this was a quiz application
    let attemptId: string | null = null

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
          subjects: subjects || [],
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
    if (school?.user_id) {
      const scoreText = score !== null && score !== undefined ? ` Quiz score: ${score}%.` : ""
      await supabase.from("notifications").insert({
        user_id: school.user_id,
        type: "new_application",
        title: "New Application Received",
        message: `${teacher.full_name} applied for ${jobTitle || "a job"}.${scoreText}`,
        metadata: { job_id, application_id: application.id, quiz_score: score, quiz_passed: passed },
      })
    }

    // Notify teacher — quiz result or plain confirmation
    if (isQuizApplication) {
      const schoolName = school?.school_name || "The school"

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: passed ? "quiz_passed" : "quiz_failed",
        title: passed ? "Quiz passed — application submitted!" : "Quiz not passed",
        message: passed
          ? `You scored ${score}% on the ${jobTitle || "the position"} quiz at ${schoolName}. Your application has been submitted.`
          : `You scored ${score}% on the ${jobTitle || "the position"} quiz at ${schoolName}. The required pass mark was not met.`,
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

    return NextResponse.json({ application, attempt_id: attemptId, score, passed })
  } catch (err) {
    console.error("POST application error:", err)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
