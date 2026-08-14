// ============================================================
// app/api/admin/quiz-bank/coverage/route.ts
// GET — returns active MCQ question counts per level/subject so
// admins can see which combinations are safe to enable for quiz
// screening and which will hard-fail an applying teacher.
//
// Only real level+subject combinations are reported (e.g. "Physics"
// only exists at SSS/Tertiary) — driven by LEVEL_SUBJECTS, the same
// source of truth used everywhere else in the app.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { TEACHING_LEVELS, getSubjectsForLevel } from "@/lib/constants"
import type { TeachingLevel } from "@/types"

const LEVELS = TEACHING_LEVELS.map((l) => l.value)

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const adminDb = createAdminClient()

    const { data: rows, error } = await adminDb
      .from("quiz_questions")
      .select("subject, education_level")
      .eq("is_active", true)
      .eq("question_type", "mcq")

    if (error) throw error

    const counts: Record<TeachingLevel, Record<string, number>> = {} as Record<TeachingLevel, Record<string, number>>
    for (const level of LEVELS) {
      counts[level] = {}
      for (const subject of getSubjectsForLevel(level)) counts[level][subject] = 0
    }
    for (const row of rows || []) {
      const level = row.education_level as TeachingLevel
      if (!counts[level]) counts[level] = {}
      counts[level][row.subject] = (counts[level][row.subject] || 0) + 1
    }

    // Minimum viable count for a quiz to feel non-repetitive/non-guessable
    const MIN_VIABLE = 15
    const totalCombos = LEVELS.reduce((sum, l) => sum + getSubjectsForLevel(l).length, 0)
    const readyCombos = LEVELS.reduce(
      (sum, l) => sum + getSubjectsForLevel(l).filter((s) => (counts[l]?.[s] || 0) >= MIN_VIABLE).length,
      0
    )

    return NextResponse.json({
      levels: LEVELS,
      subjectsByLevel: Object.fromEntries(LEVELS.map((l) => [l, getSubjectsForLevel(l)])),
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
