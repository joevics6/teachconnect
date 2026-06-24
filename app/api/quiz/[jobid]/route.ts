// ============================================================
// app/api/quiz/[jobid]/route.ts
// GET /api/quiz/[jobid] — fetch quiz questions for a job
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobid: string }> }
) {
  try {
    const { jobid: jobId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to take a quiz" },
        { status: 401 }
      )
    }

    const { data: teacherProfile } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!teacherProfile) {
      return NextResponse.json(
        { error: "Only teachers can take quizzes" },
        { status: 403 }
      )
    }

    const { data: existingAttempt } = await supabase
      .from("quiz_attempts")
      .select("id, score, passed")
      .eq("teacher_id", teacherProfile.id)
      .eq("job_id", jobId)
      .single()

    if (existingAttempt) {
      return NextResponse.json(
        {
          error: "You have already attempted this quiz",
          attempt: existingAttempt,
        },
        { status: 409 }
      )
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(
        `
        id,
        title,
        subject,
        quiz_enabled,
        quiz_mode,
        quiz_subject,
        quiz_difficulty,
        quiz_pass_mark,
        quiz_duration,
        quiz_question_count,
        school_id,
        school_profiles!inner(school_name)
      `
      )
      .eq("id", jobId)
      .eq("quiz_enabled", true)
      .eq("status", "active")
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Quiz not found or job is not active" },
        { status: 404 }
      )
    }

    const questionCount =
      job.quiz_mode === "speed"
        ? 50
        : job.quiz_question_count || 20

    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select(
        job.quiz_mode === "written"
          ? "id, question_text"
          : "id, question_text, option_a, option_b, option_c, option_d, correct_option"
      )
      .eq("subject", job.quiz_subject || job.subject)
      .eq("difficulty_level", job.quiz_difficulty || "sss")
      .eq("is_active", true)
      .limit(questionCount)

    if (questionsError) throw questionsError

    const shuffled = ((questions || []) as any[]).sort(() => Math.random() - 0.5)

    const safeQuestions =
      job.quiz_mode === "written"
        ? shuffled.map(({ id, question_text }) => ({ id, question_text }))
        : shuffled.map(({ correct_option: _co, ...q }) => q)

    return NextResponse.json({
      job_id: job.id,
      job_title: job.title,
      school_name: (job.school_profiles as { school_name: string }).school_name,
      subject: job.subject,
      mode: job.quiz_mode || "standard",
      duration_minutes: job.quiz_duration || 20,
      question_count: job.quiz_question_count || 20,
      pass_mark: job.quiz_pass_mark || 70,
      questions: safeQuestions,
    })
  } catch (err) {
    console.error("GET /api/quiz/[jobid] error:", err)
    return NextResponse.json(
      { error: "Failed to load quiz" },
      { status: 500 }
    )
  }
}