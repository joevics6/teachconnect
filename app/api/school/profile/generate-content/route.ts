// ============================================================
// app/api/school/profile/generate-content/route.ts
// POST — authenticated school only. Generates the long-form "About"
// copy and FAQ for the school's public /schools/[slug] page via
// Gemini (lib/gemini.ts). Doesn't save anything — returns
// { long_description, faq } for the school to review/edit in
// dashboard/school/edit-profile before saving via PATCH
// /api/school/profile, same as every other profile field.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateWithGemini, parseGeminiJson } from "@/lib/gemini"

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  private: "private school",
  public: "public school",
  international: "international school",
  missionary: "missionary school",
}

const PROMPT = (school: {
  school_name: string
  school_type: string
  school_levels: string[]
  state: string
  lga: string
  town: string | null
  about: string | null
  curriculum: string[]
  benefits: string[]
}) => `
You are writing website copy for a Nigerian school's public profile page on ClassHire, a teacher-hiring platform. The page is read by two audiences: teachers researching whether to apply for a job there, and search engines.

Facts you have (do not invent any facts beyond these — no founding dates, student counts, awards, or achievements that aren't given):
- Name: ${school.school_name}
- Type: ${SCHOOL_TYPE_LABELS[school.school_type] || school.school_type}
- Levels taught: ${school.school_levels.join(", ") || "not specified"}
- Location: ${[school.town, school.lga, school.state].filter(Boolean).join(", ")}
${school.about ? `- School's own short description: "${school.about}"` : ""}
${school.curriculum?.length ? `- Curriculum: ${school.curriculum.join(", ")}` : ""}
${school.benefits?.length ? `- Staff benefits offered: ${school.benefits.join(", ")}` : ""}

Write:
1. A "long_description": approximately 600 words, warm and professional, in flowing paragraphs (not bullet points). Cover what kind of school it is, the levels/curriculum it offers, its location, and — without fabricating specifics — why it could be a good place to teach (professional environment, community, growth). Written in third person about the school. Natural, not keyword-stuffed, but it's fine to naturally mention the school name, location, and "teaching jobs" a few times since this is for a page real people and search engines will read.
2. A "faq": an array of exactly 6 objects, each { "question": string, "answer": string }. Questions a teacher or parent would realistically search for about this school — e.g. what levels/subjects it teaches, where it's located, whether it offers accommodation (only if benefits mention it), how to apply for a job there (answer: through ClassHire), what curriculum it follows. Answers should be 1-3 sentences, factual, based only on the facts given above plus general platform knowledge (applications go through ClassHire).

Return ONLY a valid JSON object, no markdown, no explanation:
{ "long_description": "...", "faq": [{ "question": "...", "answer": "..." }] }
`

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: school, error } = await supabase
      .from("school_profiles")
      .select("school_name, school_type, school_levels, state, lga, town, about, curriculum, benefits")
      .eq("user_id", user.id)
      .single()

    if (error || !school) {
      return NextResponse.json({ error: "School profile not found" }, { status: 404 })
    }

    const text = await generateWithGemini(PROMPT(school), { temperature: 0.6, maxOutputTokens: 2000 })
    const parsed = parseGeminiJson<{ long_description?: string; faq?: { question: string; answer: string }[] }>(text)

    if (!parsed.long_description || !parsed.faq?.length) {
      return NextResponse.json({ error: "Generation returned incomplete content — try again" }, { status: 500 })
    }

    return NextResponse.json({ long_description: parsed.long_description, faq: parsed.faq })
  } catch (err) {
    console.error("Generate school page content error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate content" },
      { status: 500 }
    )
  }
}
