// ============================================================
// app/api/cbt/questions/route.ts
// GET ?exam=jamb&subject=mathematics&count=40[&year=2019]
// Returns a random set of PUBLISHED questions for one practice session.
// Public: RLS only exposes published rows. Answers are included so the
// runner can mark instantly and show explanations (this is practice).
// ============================================================

import { NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"
import { CBT_OPTION_KEYS, sampleIds, type CbtRunnerQuestion } from "@/lib/cbt"

export const dynamic = "force-dynamic"

interface Row {
  id: string
  year: number | null
  topic: string | null
  passage_id: string | null
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string | null
  correct_option: CbtRunnerQuestion["correct_option"]
  explanation: string | null
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const examSlug = url.searchParams.get("exam") || ""
    const subjectSlug = url.searchParams.get("subject") || ""
    const count = Math.min(Math.max(parseInt(url.searchParams.get("count") || "40", 10) || 40, 5), 100)
    const yearParam = parseInt(url.searchParams.get("year") || "", 10)

    const db = createPublicClient()
    const [{ data: exam }, { data: subject }] = await Promise.all([
      db.from("cbt_exams").select("id").eq("slug", examSlug).eq("is_active", true).maybeSingle(),
      db.from("cbt_subjects").select("id").eq("slug", subjectSlug).maybeSingle(),
    ])
    if (!exam || !subject) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Page through ids (PostgREST caps a plain select at 1000 rows).
    const ids: string[] = []
    for (let from = 0; ; from += 1000) {
      let q = db.from("cbt_questions").select("id").eq("exam_id", exam.id).eq("subject_id", subject.id).order("id").range(from, from + 999)
      if (!Number.isNaN(yearParam)) q = q.eq("year", yearParam)
      const { data, error } = await q
      if (error) throw error
      ids.push(...(data || []).map((r: { id: string }) => r.id))
      if (!data || data.length < 1000) break
    }
    if (ids.length === 0) return NextResponse.json({ questions: [], total: 0 })

    const chosen = sampleIds(ids, count)
    const { data: rows, error } = await db
      .from("cbt_questions")
      .select("id, year, topic, passage_id, question_text, option_a, option_b, option_c, option_d, option_e, correct_option, explanation")
      .in("id", chosen)
    if (error) throw error

    const passageIds = Array.from(new Set((rows as Row[]).map((r) => r.passage_id).filter((p): p is string => !!p)))
    const passages = new Map<string, string>()
    if (passageIds.length > 0) {
      const { data: ps } = await db.from("cbt_passages").select("id, body").in("id", passageIds)
      for (const p of ps || []) passages.set(p.id, p.body)
    }

    // Keep the shuffled order, and keep questions that share a passage together.
    const byId = new Map((rows as Row[]).map((r) => [r.id, r]))
    const ordered = chosen.map((id) => byId.get(id)).filter((r): r is Row => !!r)
    const withPassage = ordered.filter((r) => r.passage_id)
    const withoutPassage = ordered.filter((r) => !r.passage_id)
    withPassage.sort((a, b) => (a.passage_id! < b.passage_id! ? -1 : a.passage_id! > b.passage_id! ? 1 : 0))
    const finalOrder = [...withPassage, ...withoutPassage]

    const questions: CbtRunnerQuestion[] = finalOrder.map((r) => ({
      id: r.id,
      year: r.year,
      topic: r.topic,
      passage: r.passage_id ? passages.get(r.passage_id) ?? null : null,
      question_text: r.question_text,
      options: CBT_OPTION_KEYS.map((key) => ({ key, text: (r[`option_${key}` as keyof Row] as string | null) ?? "" })).filter((o) => o.text.trim() !== ""),
      correct_option: r.correct_option,
      explanation: r.explanation,
    }))

    return NextResponse.json({ questions, total: ids.length })
  } catch (err) {
    console.error("GET cbt questions error:", err)
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 })
  }
}
