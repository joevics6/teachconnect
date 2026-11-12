// ============================================================
// lib/cbt.ts
// Shared types and helpers for the CBT practice section
// (/cbt, /cbt/[exam], /cbt/[exam]/[subject]) and its admin tools.
// ============================================================

export const CBT_OPTION_KEYS = ["a", "b", "c", "d", "e"] as const
export type CbtOptionKey = (typeof CBT_OPTION_KEYS)[number]

export interface CbtExam {
  id: string
  slug: string
  name: string
  short_name: string
  description: string | null
  default_question_count: number
  sort_order: number
  is_active: boolean
}

export interface CbtSubject {
  id: string
  slug: string
  name: string
  sort_order: number
}

/** A question as served to the practice runner (published questions only). */
export interface CbtRunnerQuestion {
  id: string
  year: number | null
  topic: string | null
  passage: string | null
  question_text: string
  options: { key: CbtOptionKey; text: string }[]
  correct_option: CbtOptionKey
  explanation: string | null
}

export const CBT_DISCLAIMER =
  "ClassHire CBT is independent practice material. It is not affiliated with, endorsed by or sponsored by JAMB, WAEC, NECO or any state examination board. Questions are based on past papers and practice material. Answers and explanations are provided for revision and may contain errors, so always check against your textbook and teacher."

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Seconds allowed for a timed practice: about 1 minute per question. */
export function defaultSeconds(questionCount: number): number {
  return questionCount * 60
}

export function sampleIds<T>(items: T[], n: number): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}
