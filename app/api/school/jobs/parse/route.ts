import { NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

const PROMPT = (description: string) => `
You are a school HR assistant in Nigeria. Extract structured job posting data from this description.
Return ONLY a valid JSON object. No explanation, no markdown, no backticks, no extra text.

Description: "${description}"

Return exactly this JSON structure (use null for fields not mentioned, do not add extra fields):
{
  "title": "job title string or null",
  "subject": "must be one of exactly: Mathematics, English Language, Basic Science, Physics, Chemistry, Biology, Geography, History, Economics, Government, Commerce, Accounting, French, Yoruba, Igbo, Hausa, Arabic, Christian Religious Studies, Islamic Religious Studies, Agricultural Science, Technical Drawing, Computer Science, Further Mathematics, Literature in English, Civic Education, Physical Education, Fine Arts, Music, Home Economics, Food and Nutrition, Nursery Activities, Primary Activities — or null if not mentioned",
  "teaching_levels": ["array of applicable values from: nursery, primary, jss, sss, tertiary — empty array if not mentioned"],
  "employment_type": "full-time or part-time or contract or null",
  "positions": 1,
  "salary_min": 0,
  "salary_max": 0,
  "accommodation_offered": false,
  "accommodation_type": "fully-furnished or unfurnished or allowance or null",
  "benefits": ["array of applicable values from exactly: Health Insurance, Transport Allowance, Pension, School Fee Discount for Staff Children, Housing Allowance, Lunch, Professional Development"],
  "description": "a professional 3-5 sentence job description written from the school perspective based on the input",
  "required_qualifications": "a clear list of required qualifications inferred from the subject, level and any mentioned requirements",
  "quiz_enabled": false,
  "is_private": false
}
`

async function callGemini(model: string, description: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: PROMPT(description) }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err?.error?.message || `${model} request failed`)
  }

  const data = await response.json()
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

  if (!text) throw new Error("Empty response from model")

  // Clean and parse JSON
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()

  return JSON.parse(cleaned)
}

export async function POST(request: Request) {
  try {
    const { description } = await request.json()

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      )
    }

    let parsed: Record<string, unknown> | null = null

    // Try gemini-2.5-flash-lite first (faster, cheaper)
    try {
      parsed = await callGemini("gemini-2.5-flash-lite", description)
    } catch (liteError) {
      console.warn("gemini-2.5-flash-lite failed, falling back:", liteError)

      // Fallback to gemini-2.5-flash
      try {
        parsed = await callGemini("gemini-2.5-flash", description)
      } catch (flashError) {
        console.error("gemini-2.5-flash also failed:", flashError)
        throw new Error("AI parsing failed. Please fill the form manually.")
      }
    }

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