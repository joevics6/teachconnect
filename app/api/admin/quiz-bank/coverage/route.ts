// ============================================================
// app/api/admin/quiz-bank/coverage/route.ts
// GET — returns active MCQ question counts per subject/level so
// admins can see which combinations are safe to enable for quiz
// screening and which will hard-fail an applying teacher.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
import { SUBJECTS } from "@/lib/constants"

const LEVELS = ["nursery", "primary", "jss", "sss", "tertiary"] as const

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: rows, error } = await supabase
      .from("quiz_questions")
      .select("subject, education_level")
      .eq("is_active", true)
      .eq("question_type", "mcq")

    if (error) throw error

    const counts: Record<string, Record<string, number>> = {}
    for (const subject of SUBJECTS) {
      counts[subject] = {}
      for (const level of LEVELS) counts[subject][level] = 0
    }
    for (const row of rows || []) {
      if (!counts[row.subject]) counts[row.subject] = {}
      counts[row.subject][row.education_level] = (counts[row.subject][row.education_level] || 0) + 1
    }

    // Minimum viable count for a quiz to feel non-repetitive/non-guessable
    const MIN_VIABLE = 15
    const totalCombos = SUBJECTS.length * LEVELS.length
    const readyCombos = SUBJECTS.reduce(
      (sum, s) => sum + LEVELS.filter((l) => (counts[s]?.[l] || 0) >= MIN_VIABLE).length,
      0
    )

    return NextResponse.json({
      subjects: SUBJECTS,
      levels: LEVELS,
      counts,
      min_viable: MIN_VIABLE,
      total_combos: totalCombos,
      ready_combos: readyCombos,
    })
  } catch (err) {
    console.error("GET quiz-bank coverage error:", err)
    return NextResponse.json({ error: "Failed to load coverage" }, { status: 500 })
  }
}
