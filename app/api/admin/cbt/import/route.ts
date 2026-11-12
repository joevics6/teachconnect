// ============================================================
// app/api/admin/cbt/import/route.ts
// POST multipart/form-data — turn a past-question PDF, photo or pasted text
// into DRAFT questions for one exam + subject (+ year, + state).
//
// Fields: exam_id, subject_id, year?, region?, from? (first question number,
// default 1), count? (how many to extract, default 40, max 60),
// and either `file` (PDF/PNG/JPG, up to 4 MB) or `text`.
//
// Nothing here goes live: every row is inserted as status 'draft' and must be
// checked and published in /admin/cbt. Answers the document does not print
// are worked out by the AI and flagged answer_source = 'ai' so they get a
// proper look. Explanations are written fresh by the AI, never copied.
// ============================================================

import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { generateWithGemini, parseGeminiJson } from "@/lib/gemini"

export const maxDuration = 60

const MAX_FILE_BYTES = 4 * 1024 * 1024
const LETTERS = ["a", "b", "c", "d", "e"] as const

interface RawQuestion {
  number?: number | string
  passage?: string | null
  question_text?: string
  options?: Record<string, string | null | undefined>
  correct_option?: string | null
  answer_source?: string
  topic?: string | null
  explanation?: string | null
}

function buildPrompt(examName: string, subjectName: string, from: number, count: number, text: string | null) {
  return `You are extracting multiple-choice past questions for a Nigerian exam practice app.

Exam: ${examName}
Subject: ${subjectName}
Extract up to ${count} questions, starting from question number ${from} of the document. Keep them in document order.

Rules:
- Copy each question and its options exactly as printed (fix only obvious typos from scanning).
- Write maths and science notation in plain text (x^2, sqrt(x), H2O, 3/4). Never use LaTeX.
- If a question needs a diagram, graph, table image or picture to be answerable, SKIP it and put its number in "skipped".
- If several questions share a passage or instruction block, repeat the full passage text in "passage" for each of them. Otherwise "passage" is null.
- "options" has keys a, b, c, d (and e only if the document has five options).
- "correct_option": if the document prints an answer key or marks the answer, use it and set "answer_source" to "document". If no answer is given, work out the correct answer yourself and set "answer_source" to "ai".
- "topic": a short syllabus topic name for the question (for example "Algebra", "Comprehension", "Cell biology").
- "explanation": write a brief, ORIGINAL explanation in your own words (1 to 2 sentences) of why the answer is correct. Never copy solution text from the document.
- Return ONLY valid JSON, no markdown, no backticks, in this shape:
{"questions":[{"number":1,"passage":null,"question_text":"...","options":{"a":"...","b":"...","c":"...","d":"..."},"correct_option":"a","answer_source":"document","topic":"...","explanation":"..."}],"skipped":[7,12]}
${text ? `\nTEXT:\n"""\n${text}\n"""` : "\nThe questions are in the attached file."}`
}

/** Parses the model reply; if the JSON was cut off, keeps every complete question before the cut. */
function parseReply(reply: string): { questions: RawQuestion[]; skipped: unknown[] } {
  try {
    const obj = parseGeminiJson<{ questions?: RawQuestion[]; skipped?: unknown[] }>(reply)
    return { questions: Array.isArray(obj.questions) ? obj.questions : [], skipped: Array.isArray(obj.skipped) ? obj.skipped : [] }
  } catch {
    const cleaned = reply.replace(/```json/gi, "").replace(/```/g, "").trim()
    const cut = cleaned.lastIndexOf("},")
    const start = cleaned.indexOf("[")
    if (cut === -1 || start === -1) throw new Error("The AI reply could not be read. Try a smaller range.")
    const obj = JSON.parse(`${cleaned.slice(start, cut + 1)}]`) as RawQuestion[]
    return { questions: obj, skipped: [] }
  }
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const form = await request.formData()
    const examId = str(form.get("exam_id"))
    const subjectId = str(form.get("subject_id"))
    if (!examId || !subjectId) return NextResponse.json({ error: "Choose an exam and a subject" }, { status: 400 })
    const yearNum = parseInt(String(form.get("year") || ""), 10)
    const year = Number.isNaN(yearNum) ? null : yearNum
    const region = str(form.get("region"))
    const from = Math.max(parseInt(String(form.get("from") || "1"), 10) || 1, 1)
    const count = Math.min(Math.max(parseInt(String(form.get("count") || "40"), 10) || 40, 1), 60)

    const db = createAdminClient()
    const [{ data: exam }, { data: subject }] = await Promise.all([
      db.from("cbt_exams").select("id, name").eq("id", examId).maybeSingle(),
      db.from("cbt_subjects").select("id, name").eq("id", subjectId).maybeSingle(),
    ])
    if (!exam || !subject) return NextResponse.json({ error: "Exam or subject not found" }, { status: 404 })

    const file = form.get("file")
    const pasted = str(form.get("text"))
    let inlineData: { mimeType: string; data: string } | undefined
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File is over 4 MB. Split it or paste the text instead." }, { status: 413 })
      const okType = file.type === "application/pdf" || file.type === "image/png" || file.type === "image/jpeg"
      if (!okType) return NextResponse.json({ error: "Upload a PDF, PNG or JPG" }, { status: 400 })
      inlineData = { mimeType: file.type, data: Buffer.from(await file.arrayBuffer()).toString("base64") }
    }
    if (!inlineData && !pasted) return NextResponse.json({ error: "Upload a file or paste the questions" }, { status: 400 })

    const reply = await generateWithGemini(buildPrompt(exam.name, subject.name, from, count, inlineData ? null : pasted), {
      temperature: 0.1,
      maxOutputTokens: 32000,
      inlineData,
    })
    const { questions, skipped } = parseReply(reply)

    const batch = crypto.randomUUID()
    const passageIds = new Map<string, string>()
    let inserted = 0
    let duplicates = 0
    let invalid = 0

    for (const raw of questions) {
      const text = str(raw.question_text)
      const opts = raw.options || {}
      const a = str(opts.a), b = str(opts.b), c = str(opts.c), d = str(opts.d), e = str(opts.e)
      const answer = String(raw.correct_option ?? "").toLowerCase().replace(/[^a-e]/g, "")
      if (!text || !a || !b || !c || !d || !LETTERS.includes(answer as (typeof LETTERS)[number]) || (answer === "e" && !e)) {
        invalid++
        continue
      }

      let passageId: string | null = null
      const passage = str(raw.passage)
      if (passage) {
        passageId = passageIds.get(passage) ?? null
        if (!passageId) {
          const { data: p, error: pErr } = await db
            .from("cbt_passages")
            .insert({ exam_id: examId, subject_id: subjectId, year, body: passage })
            .select("id")
            .single()
          if (pErr) throw pErr
          passageId = p.id
          passageIds.set(passage, p.id)
        }
      }

      const { error } = await db.from("cbt_questions").insert({
        exam_id: examId,
        subject_id: subjectId,
        year,
        region,
        topic: str(raw.topic),
        passage_id: passageId,
        question_text: text,
        option_a: a,
        option_b: b,
        option_c: c,
        option_d: d,
        option_e: e,
        correct_option: answer,
        explanation: str(raw.explanation),
        answer_source: raw.answer_source === "ai" ? "ai" : "document",
        status: "draft",
        import_batch: batch,
      })
      if (error) {
        if (error.code === "23505") duplicates++
        else {
          console.error("cbt import insert error:", error)
          invalid++
        }
        continue
      }
      inserted++
    }

    revalidateTag("cbt", "max")
    return NextResponse.json({ inserted, duplicates, invalid, skipped: skipped.length, found: questions.length, batch })
  } catch (err) {
    console.error("POST admin cbt import error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Import failed" }, { status: 500 })
  }
}
