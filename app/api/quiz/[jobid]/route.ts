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
        quiz_subjects,
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

    // Fall back to the job's own subject for older jobs created before
    // multi-subject quizzes existed (quiz_subjects would be empty then).
    const quizSubjects: string[] =
      job.quiz_subjects?.length ? job.quiz_subjects : [job.subject]

    // Total question count scales with how many subjects are combined,
    // capped to keep the quiz within a reasonable 30-50 question band.
    // 1 subject -> mode's normal default. 2 subjects -> 50 total (25 each).
    // 3 subjects -> 30 total (10 each).
    let totalQuestions: number
    if (quizSubjects.length <= 1) {
      totalQuestions =
        job.quiz_mode === "speed" ? 50 : job.quiz_question_count || 20
    } else if (quizSubjects.length === 2) {
      totalQuestions = 50
    } else {
      totalQuestions = 30
    }

    // Split as evenly as possible across subjects, any remainder going to
    // the first subjects in the list.
    const base = Math.floor(totalQuestions / quizSubjects.length)
    const remainder = totalQuestions % quizSubjects.length
    const perSubjectCounts = quizSubjects.map((s, i) => ({
      subject: s,
      count: base + (i < remainder ? 1 : 0),
    }))

    const selectColumns =
      job.quiz_mode === "written"
        ? "id, subject, question_text"
        : "id, subject, question_text, option_a, option_b, option_c, option_d, correct_option"

    const results = await Promise.all(
      perSubjectCounts.map(({ subject, count }) =>
        supabase
          .from("quiz_questions")
          .select(selectColumns)
          .eq("subject", subject)
          .eq("difficulty_level", job.quiz_difficulty || "sss")
          .eq("is_active", true)
          .limit(count * 3) // buffer, so we can randomly sample instead of always taking the same rows
      )
    )

    interface QuestionRow {
      id: string
      subject: string
      question_text: string
      option_a?: string
      option_b?: string
      option_c?: string
      option_d?: string
      correct_option?: string
    }

    const shortages: { subject: string; available: number; needed: number }[] = []
    let allQuestions: QuestionRow[] = []

    perSubjectCounts.forEach(({ subject, count }, i) => {
      const { data, error } = results[i]
      if (error) throw error
      const pool = ((data || []) as unknown as QuestionRow[]).sort(() => Math.random() - 0.5)
      if (pool.length < count) {
        shortages.push({ subject, available: pool.length, needed: count })
      }
      allQuestions = allQuestions.concat(pool.slice(0, count))
    })

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for the selected subjects yet" },
        { status: 404 }
      )
    }

    const shuffled = allQuestions.sort(() => Math.random() - 0.5)

    const safeQuestions =
      job.quiz_mode === "written"
        ? shuffled.map(({ id, subject, question_text }) => ({ id, subject, question_text }))
        : shuffled.map(({ correct_option: _co, ...q }) => q)

    return NextResponse.json({
      job_id: job.id,
      job_title: job.title,
      school_name: ((Array.isArray(job.school_profiles) ? job.school_profiles[0] : job.school_profiles) as unknown as { school_name: string })?.school_name,
      subject: job.subject,
      subjects: quizSubjects,
      mode: job.quiz_mode || "standard",
      duration_minutes: job.quiz_duration || 20,
      question_count: shuffled.length,
      pass_mark: job.quiz_pass_mark || 70,
      questions: safeQuestions,
      ...(shortages.length ? { subject_shortages: shortages } : {}),
    })
  } catch (err) {
    console.error("GET /api/quiz/[jobid] error:", err)
    return NextResponse.json(
      { error: "Failed to load quiz" },
      { status: 500 }
    )
  }
}