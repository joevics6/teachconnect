import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ALL_SUBJECTS, BENEFITS } from "@/lib/constants"
import { generateWithGemini, parseGeminiJson } from "@/lib/gemini"

const PROMPT = (description: string) => `
You are a school HR assistant in Nigeria. Extract structured job posting data from this description.
Return ONLY a valid JSON object. No explanation, no markdown, no backticks, no extra text.

Description: "${description}"

Return exactly this JSON structure (use null for fields not mentioned, do not add extra fields):
{
  "title": "job title string or null",
  "subject": "must be one of exactly: ${ALL_SUBJECTS.join(", ")} — or null if not mentioned",
  "teaching_levels": ["array of applicable values from: nursery, primary, jss, sss, tertiary — empty array if not mentioned"],
  "employment_type": "full-time or part-time or contract or null",
  "positions": 1,
  "salary_min": 0,
  "salary_max": 0,
  "accommodation_offered": false,
  "accommodation_type": "fully-furnished or unfurnished or allowance or null",
  "benefits": ["array of applicable values from exactly: ${BENEFITS.join(", ")}"],
  "description": "a professional 3-5 sentence job description written from the school perspective based on the input",
  "required_qualifications": "a clear list of required qualifications inferred from the subject, level and any mentioned requirements",
  "quiz_enabled": false,
  "is_private": false
}
`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== "school") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // AI job-description parsing is available to every school, including
    // the Free plan — no plan check here.

    const { description } = await request.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const text = await generateWithGemini(PROMPT(description))
    const parsed = parseGeminiJson(text)

    return NextResponse.json({ parsed })
  } catch (err) {
    console.error("Parse route error:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to parse job description",
      },
      { status: 500 }
    )
  }
}
