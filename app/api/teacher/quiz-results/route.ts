// ============================================================
// app/api/teacher/quiz-results/route.ts
// GET /api/teacher/quiz-results
// ============================================================

// Create at: app/api/teacher/quiz-results/route.ts

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: teacher } = await supabase
      .from("teacher_profiles").select("id").eq("user_id", user.id).single()

    if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { data: results, error } = await supabase
      .from("quiz_attempts")
      .select(`
        id, score, passed, mode, time_taken_seconds,
        written_feedback, created_at,
        jobs (
          id, title, subject,
          school_profiles ( school_name )
        )
      `)
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formatted = (results || []).map((r) => {
      const job = (Array.isArray(r.jobs) ? r.jobs[0] : r.jobs) as unknown as {
        id: string
        title: string
        subject: string
        school_profiles: { school_name: string }
      }
      return {
        id: r.id,
        job_id: job?.id,
        job_title: job?.title,
        school_name: job?.school_profiles?.school_name,
        subject: job?.subject,
        score: r.score,
        passed: r.passed,
        mode: r.mode,
        time_taken_seconds: r.time_taken_seconds,
        written_feedback: r.written_feedback,
        created_at: r.created_at,
      }
    })

    return NextResponse.json({ results: formatted })
  } catch (err) {
    console.error("GET quiz results error:", err)
    return NextResponse.json({ error: "Failed to fetch quiz results" }, { status: 500 })
  }
}