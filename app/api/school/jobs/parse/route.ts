import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
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
  "teaching_levels": ["array of applicable values from: nursery, primary, jss, sss, tertiary, non_teaching — empty array if not mentioned"],
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

If the role is a NON-TEACHING position (e.g. bursar, accountant, admin
officer, receptionist, librarian, guidance counsellor, nurse, IT
support, security guard, driver, cook/caterer, cleaner, gardener,
maintenance/handyman, store keeper, sports coach, transport
coordinator, or a school leadership role like principal/head teacher/
vice principal), set teaching_levels to exactly ["non_teaching"] and
set subject to the matching position name from the list above — NOT
an academic subject. Never set quiz_enabled to true for a
non-teaching position; it has nothing to quiz on.
`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isSchool = user?.user_metadata?.role === "school"
    const isAdmin = !isSchool && !!(await requireAdmin(supabase))
    if (!user || (!isSchool && !isAdmin)) {
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
