// ============================================================
// app/api/teacher/specialization-quiz/results/route.ts
// GET — fetch all specialization quiz results for the teacher
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: teacher } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { data: results, error } = await supabase
      .from("specialization_quiz_results")
      .select("id, subject, level, score, correct_answers, total_questions, time_taken_seconds, percentile, created_at")
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    // For each subject, mark if retake is available (30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const withRetake = (results || []).map((r) => {
      const takenAt = new Date(r.created_at)
      const retakeAt = new Date(takenAt)
      retakeAt.setDate(retakeAt.getDate() + 30)
      return {
        ...r,
        retake_available: takenAt < thirtyDaysAgo,
        retake_available_at: retakeAt.toISOString(),
      }
    })

    return NextResponse.json({ results: withRetake })
  } catch (err) {
    console.error("GET specialization-quiz/results error:", err)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}
