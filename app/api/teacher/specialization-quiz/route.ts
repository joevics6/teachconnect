// ============================================================
// app/api/teacher/specialization-quiz/route.ts
// GET  — fetch quiz questions for a subject
// POST — submit quiz result and calculate percentile
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Speed quiz: 30 questions, 5 minutes
const QUESTION_COUNT = 30
const DURATION_MINUTES = 5

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: teacher } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })

    const subject = request.nextUrl.searchParams.get("subject")
    const level   = request.nextUrl.searchParams.get("level")
    if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    if (!level)   return NextResponse.json({ error: "Level is required" }, { status: 400 })

    // Check if teacher has a recent attempt (within 30 days) for this subject+level
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentAttempt } = await supabase
      .from("specialization_quiz_results")
      .select("id, score, percentile, subject, level, created_at")
      .eq("teacher_id", teacher.id)
      .eq("subject", subject)
      .eq("level", level)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentAttempt) {
      const retakeAvailableAt = new Date(recentAttempt.created_at)
      retakeAvailableAt.setDate(retakeAvailableAt.getDate() + 30)
      return NextResponse.json(
        {
          error: "You have already taken this quiz recently",
          recent_attempt: recentAttempt,
          retake_available_at: retakeAvailableAt.toISOString(),
        },
        { status: 409 }
      )
    }

    // Fetch questions filtered by subject + difficulty_level
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id, question_text, option_a, option_b, option_c, option_d")
      .eq("subject", subject)
      .eq("difficulty_level", level)
      .eq("is_active", true)
      .limit(QUESTION_COUNT * 3)

    if (questionsError) throw questionsError

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for this subject yet" },
        { status: 404 }
      )
    }

    // Shuffle and take QUESTION_COUNT
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, QUESTION_COUNT)

    return NextResponse.json({
      subject,
      level,
      duration_minutes: DURATION_MINUTES,
      question_count: shuffled.length,
      questions: shuffled,
    })
  } catch (err) {
    console.error("GET specialization-quiz error:", err)
    return NextResponse.json({ error: "Failed to load quiz" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: teacher } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })

    const body = await request.json()
    const { subject, level, answers, time_taken_seconds } = body

    if (!subject || !level || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const questionIds = Object.keys(answers)
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id, correct_option")
      .in("id", questionIds)

    if (questionsError) throw questionsError

    // Calculate score
    let correct = 0
    for (const q of questions || []) {
      if (answers[q.id] === q.correct_option) correct++
    }
    const total = questionIds.length
    const score = total > 0 ? Math.round((correct / total) * 100) : 0

    // Calculate percentile: how many OTHER teachers scored BELOW this score on the same subject
    const { count: totalOthers } = await supabase
      .from("specialization_quiz_results")
      .select("*", { count: "exact", head: true })
      .eq("subject", subject)
      .eq("level", level)
      .neq("teacher_id", teacher.id)

    const { count: scoredBelow } = await supabase
      .from("specialization_quiz_results")
      .select("*", { count: "exact", head: true })
      .eq("subject", subject)
      .eq("level", level)
      .neq("teacher_id", teacher.id)
      .lt("score", score)

    // Percentile = % of others who scored below you
    // If no other attempts yet, default to 50th percentile
    const percentile =
      totalOthers && totalOthers > 0
        ? Math.round(((scoredBelow || 0) / totalOthers) * 100)
        : 50

    // Save the result
    const { data: savedResult, error: saveError } = await supabase
      .from("specialization_quiz_results")
      .insert({
        teacher_id: teacher.id,
        subject,
        score,
        correct_answers: correct,
        total_questions: total,
        time_taken_seconds,
        percentile,
      })
      .select("id, score, percentile, subject, level, created_at")
      .single()

    if (saveError) throw saveError

    return NextResponse.json({
      score,
      correct,
      total,
      percentile,
      result: savedResult,
    })
  } catch (err) {
    console.error("POST specialization-quiz error:", err)
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 })
  }
}
