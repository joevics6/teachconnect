// ============================================================
// app/api/admin/quiz-bank/generate/route.ts
// POST — generate MCQ questions for one subject/level with Gemini
// and insert them into quiz_questions.
//
// This replaces an earlier, undocumented generation flow that ran
// entirely outside this repo. Its logs (quiz_generation_logs) show
// every single insert failed with:
//   "violates check constraint quiz_questions_correct_option_check"
// That constraint requires correct_option to be exactly one of
// 'a' | 'b' | 'c' | 'd' (lowercase). The old flow must have been
// passing something else (an uppercase letter, or the option text
// itself). This version validates and normalizes every question
// before insert, skips anything malformed instead of letting the
// whole batch die, and logs per-question failures so gaps are
// visible instead of a silent 0-row result.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
import { TEACHING_LEVELS, getSubjectsForLevel, getTopicsForSubject } from "@/lib/constants"
import type { TeachingLevel } from "@/types"
import crypto from "crypto"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const VALID_OPTIONS = new Set(["a", "b", "c", "d"])
const VALID_LEVELS = new Set(TEACHING_LEVELS.map((l) => l.value))

interface RawQuestion {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  topic?: string
  explanation?: string
}

function normalizeOption(value: unknown): string | null {
  if (typeof value !== "string") return null
  const v = value.trim().toLowerCase().replace(/[).]/g, "")
  return VALID_OPTIONS.has(v) ? v : null
}

async function callGemini(prompt: string): Promise<string> {
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
  let lastErr: unknown = null
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: 8000 },
          }),
        }
      )
      if (!res.ok) throw new Error(`Gemini ${model} responded ${res.status}`)
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error(`Gemini ${model} returned empty content`)
      return text
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Gemini generation failed")
}

function buildPrompt(subject: string, level: string, count: number, topics?: string[]): string {
  return `You are a Nigerian curriculum expert writing multiple-choice quiz questions for teacher applicant screening.

Subject: ${subject}
Level: ${level.toUpperCase()} (Nigerian education system)
Count: ${count}
${topics && topics.length > 0 ? `\nThis subject is a broad assessment category. Spread questions across these topic areas:\n${topics.map((t) => `- ${t}`).join("\n")}\n` : ""}
Rules:
- Questions test subject-matter mastery a qualified TEACHER of this subject/level should have — not trivia.
- Each question has exactly 4 options.
- Vary difficulty and topic within the subject.
- Return ONLY a JSON array, no markdown, no backticks, no commentary.

Return this exact structure:
[
  {
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "a",
    "topic": "short topic label",
    "explanation": "1 sentence explaining the correct answer"
  }
]

"correct_option" MUST be exactly one lowercase letter: a, b, c, or d. Nothing else.`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { subject, level, count = 20 } = await request.json()
  if (!subject || !level) {
    return NextResponse.json({ error: "subject and level are required" }, { status: 400 })
  }
  if (!VALID_LEVELS.has(level)) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 })
  }
  if (!getSubjectsForLevel(level as TeachingLevel).includes(subject)) {
    return NextResponse.json({ error: `"${subject}" is not a valid subject for ${level}` }, { status: 400 })
  }
  const targetCount = Math.min(Math.max(Number(count) || 20, 1), 40)

  const { data: job, error: jobError } = await supabase
    .from("quiz_generation_jobs")
    .insert({
      requested_by: admin.id,
      scope: "subject",
      education_level: level,
      subject,
      target_count: targetCount,
      status: "running",
    })
    .select("id")
    .single()

  if (jobError || !job) {
    console.error("Failed to create quiz_generation_jobs row:", jobError)
    return NextResponse.json({ error: "Failed to start generation job" }, { status: 500 })
  }

  const log = async (level_: string, message: string, meta?: Record<string, unknown>) => {
    await supabase.from("quiz_generation_logs").insert({
      job_id: job.id,
      level: level_,
      message,
      meta: meta ?? null,
    })
  }

  let generated = 0
  let duplicates = 0
  let failed = 0

  try {
    const topics = getTopicsForSubject(level as TeachingLevel, subject)
    const raw = await callGemini(buildPrompt(subject, level, targetCount, topics))
    const cleaned = raw.replace(/```json|```/g, "").trim()
    let questions: RawQuestion[]
    try {
      questions = JSON.parse(cleaned)
    } catch {
      await log("error", "Gemini response was not valid JSON", { snippet: cleaned.slice(0, 500) })
      throw new Error("Gemini response was not valid JSON")
    }

    for (const q of questions) {
      const correctOption = normalizeOption(q.correct_option)
      if (
        !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d ||
        !correctOption
      ) {
        failed++
        await log("error", "Skipped malformed question (missing field or invalid correct_option)", {
          received_correct_option: q.correct_option ?? null,
          question_preview: (q.question_text || "").slice(0, 100),
        })
        continue
      }

      const contentHash = crypto
        .createHash("sha256")
        .update(`${subject}|${level}|${q.question_text.trim().toLowerCase()}`)
        .digest("hex")

      const { error: insertError } = await supabase.from("quiz_questions").insert({
        subject,
        education_level: level,
        difficulty_level: level, // legacy column, kept for backward compatibility
        question_text: q.question_text.trim(),
        option_a: q.option_a.trim(),
        option_b: q.option_b.trim(),
        option_c: q.option_c.trim(),
        option_d: q.option_d.trim(),
        correct_option: correctOption,
        question_type: "mcq",
        topic: q.topic?.trim() || null,
        explanation: q.explanation?.trim() || null,
        content_hash: contentHash,
        is_active: true,
        created_by: admin.id,
      })

      if (insertError) {
        if (insertError.code === "23505") {
          duplicates++
        } else {
          failed++
          await log("error", `Insert failed: ${insertError.message}`, {
            question_preview: q.question_text.slice(0, 100),
          })
        }
        continue
      }
      generated++
    }

    await supabase
      .from("quiz_generation_jobs")
      .update({
        status: "completed",
        generated_count: generated,
        duplicate_count: duplicates,
        failed_count: failed,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id)

    await log("info", `Generation complete: ${generated} inserted, ${duplicates} duplicates, ${failed} failed`)

    return NextResponse.json({ ok: true, generated, duplicates, failed })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    await supabase
      .from("quiz_generation_jobs")
      .update({
        status: "failed",
        generated_count: generated,
        duplicate_count: duplicates,
        failed_count: failed,
        error: message,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id)
    console.error("Quiz generation error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
