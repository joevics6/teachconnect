// ============================================================
// app/api/admin/jobs/parse/route.ts
// POST — admin-only. Same idea as api/school/jobs/parse, but for
// the admin "New Job" quick-create flow (app/admin/jobs/new): admin
// pastes one raw posting (e.g. copied from a Facebook group) that
// usually names the school too, and this extracts BOTH the job
// fields and the school fields from it in a single Gemini call —
// so one paste can fill the job form AND the new-school form at
// the bottom of that page.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
import { ALL_SUBJECTS, BENEFITS } from "@/lib/constants"
import { NIGERIAN_STATES } from "@/lib/nigerian-locations"
import { generateWithGemini, parseGeminiJson } from "@/lib/gemini"

const PROMPT = (description: string) => `
You are a recruitment assistant in Nigeria. Extract structured data from this raw job post, which may have been copied from Facebook or WhatsApp. It usually mentions both a job opening AND the school offering it.
Return ONLY a valid JSON object. No explanation, no markdown, no backticks, no extra text.

Text: "${description}"

Return exactly this JSON structure (use null for fields not mentioned, do not add extra fields):
{
  "job": {
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
    "apply_contact": "an email address, phone/WhatsApp number, or website mentioned as the way to apply or get in touch — or null if nothing like that is mentioned"
  },
  "school": {
    "school_name": "the hiring school's name, or null if not mentioned",
    "school_type": "must be one of exactly: private, public, international, missionary — or null if not stated or not inferable",
    "state": "must be one of exactly: ${NIGERIAN_STATES.join(", ")} — or null if not mentioned",
    "lga": "the LGA/area mentioned (e.g. 'Ikeja'), or null",
    "website": "school website if mentioned, or null",
    "about": "one short sentence about the school if the text gives any context, or null"
  }
}
`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { description } = await request.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const text = await generateWithGemini(PROMPT(description))
    const parsed = parseGeminiJson<{ job?: Record<string, unknown>; school?: Record<string, unknown> }>(text)

    return NextResponse.json({ parsed })
  } catch (err) {
    console.error("Admin job+school parse route error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse" },
      { status: 500 }
    )
  }
}
