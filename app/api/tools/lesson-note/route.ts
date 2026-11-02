import { NextResponse } from "next/server"
import { generateWithGemini, parseGeminiJson } from "@/lib/gemini"
import { checkAndRecordUsage, ipHashFor } from "@/lib/tools/rate-limit"
import {
  buildLessonNotePrompt,
  lessonNoteContentSchema,
  lessonNoteRequestSchema,
} from "@/lib/tools/lesson-note-server"

export const maxDuration = 60

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const parsed = lessonNoteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the class, subject and topic and try again." }, { status: 400 })
  }
  const request = parsed.data

  const usage = await checkAndRecordUsage("lesson-note", ipHashFor(req))
  if (!usage.ok) return NextResponse.json({ error: usage.message }, { status: 429 })

  const prompt = buildLessonNotePrompt(request)
  // The model occasionally returns malformed JSON; one retry fixes most cases.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await generateWithGemini(prompt, { temperature: 0.4, maxOutputTokens: 6000 })
      const note = lessonNoteContentSchema.safeParse(parseGeminiJson(raw))
      if (note.success) return NextResponse.json({ note: note.data })
      console.error("Lesson note: AI output failed validation:", note.error.issues.slice(0, 3))
    } catch (err) {
      console.error("Lesson note: generation failed:", err)
    }
  }
  return NextResponse.json(
    { error: "We couldn't generate this lesson note right now. Please try again in a moment." },
    { status: 502 }
  )
}
