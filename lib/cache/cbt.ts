// ============================================================
// lib/cache/cbt.ts
// Cached public reads for the CBT pages. Tagged "cbt" — the admin
// routes burst it whenever questions are published, edited or deleted.
// Counts come from the cbt_question_counts view (published only).
// ============================================================

import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"
import type { CbtExam, CbtSubject } from "@/lib/cbt"

const TAGS = ["cbt"]

interface CountRow {
  exam_id: string
  subject_id: string
  year: number | null
  n: number
}

async function loadCounts(): Promise<CountRow[]> {
  const { data } = await createPublicClient().from("cbt_question_counts").select("exam_id, subject_id, year, n")
  return (data as CountRow[]) || []
}

export interface ExamWithCount extends CbtExam {
  question_count: number
  subject_count: number
}

/** Exams that have at least one published question. */
export const getExamsWithQuestions = unstable_cache(
  async (): Promise<ExamWithCount[]> => {
    const db = createPublicClient()
    const [{ data: exams }, counts] = await Promise.all([
      db.from("cbt_exams").select("*").eq("is_active", true).order("sort_order"),
      loadCounts(),
    ])
    return ((exams as CbtExam[]) || [])
      .map((e) => {
        const rows = counts.filter((c) => c.exam_id === e.id)
        return {
          ...e,
          question_count: rows.reduce((s, r) => s + r.n, 0),
          subject_count: new Set(rows.map((r) => r.subject_id)).size,
        }
      })
      .filter((e) => e.question_count > 0)
  },
  ["cbt-exams"],
  { revalidate: 300, tags: TAGS }
)

export const getExamBySlug = unstable_cache(
  async (slug: string): Promise<CbtExam | null> => {
    const { data } = await createPublicClient().from("cbt_exams").select("*").eq("slug", slug).eq("is_active", true).maybeSingle()
    return (data as CbtExam) || null
  },
  ["cbt-exam"],
  { revalidate: 300, tags: TAGS }
)

export interface SubjectWithCount extends CbtSubject {
  question_count: number
  years: number[]
}

/** Subjects of one exam that have published questions, with question counts and years. */
export const getExamSubjects = unstable_cache(
  async (examId: string): Promise<SubjectWithCount[]> => {
    const db = createPublicClient()
    const [{ data: subjects }, counts] = await Promise.all([db.from("cbt_subjects").select("*").order("sort_order"), loadCounts()])
    const rows = counts.filter((c) => c.exam_id === examId)
    return ((subjects as CbtSubject[]) || [])
      .map((s) => {
        const mine = rows.filter((r) => r.subject_id === s.id)
        return {
          ...s,
          question_count: mine.reduce((sum, r) => sum + r.n, 0),
          years: Array.from(new Set(mine.map((r) => r.year).filter((y): y is number => y != null))).sort((a, b) => b - a),
        }
      })
      .filter((s) => s.question_count > 0)
  },
  ["cbt-exam-subjects"],
  { revalidate: 300, tags: TAGS }
)

/** Every exam/subject pair with published questions (for the sitemap). */
export const getLivePairs = unstable_cache(
  async (): Promise<{ exam: string; subject: string }[]> => {
    const db = createPublicClient()
    const [{ data: exams }, { data: subjects }, counts] = await Promise.all([
      db.from("cbt_exams").select("id, slug").eq("is_active", true),
      db.from("cbt_subjects").select("id, slug"),
      loadCounts(),
    ])
    const examSlug = new Map((exams || []).map((e: { id: string; slug: string }) => [e.id, e.slug]))
    const subjectSlug = new Map((subjects || []).map((s: { id: string; slug: string }) => [s.id, s.slug]))
    const seen = new Set<string>()
    const out: { exam: string; subject: string }[] = []
    for (const c of counts) {
      const e = examSlug.get(c.exam_id)
      const s = subjectSlug.get(c.subject_id)
      if (!e || !s || seen.has(`${e}/${s}`)) continue
      seen.add(`${e}/${s}`)
      out.push({ exam: e, subject: s })
    }
    return out
  },
  ["cbt-live-pairs"],
  { revalidate: 300, tags: TAGS }
)
