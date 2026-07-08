// ============================================================
// app/api/quiz/grade-written/route.ts
// POST /api/quiz/grade-written — grade written answers with Gemini
// ============================================================

// Create this at: app/api/quiz/grade-written/route.ts

import { NextResponse } from "next/server"

interface QuestionAnswer {
  id: string
  question: string
  answer: string
  subject?: string
}

interface GradedQuestion {
  question_id: string
  question: string
  answer: string
  score: number
  max_score: number
  feedback: string
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

async function gradeWithGemini(
  subject: string,
  qa: QuestionAnswer[]
): Promise<GradedQuestion[]> {
  // Subjects present across this attempt (could be 1-3 combined subjects).
  const subjectsInvolved = Array.from(
    new Set(qa.map((q) => q.subject).filter(Boolean))
  ) as string[]
  const isCombined = subjectsInvolved.length > 1

  const questionsText = qa
    .map((q, i) => `Q${i + 1} [${q.subject || subject}]: ${q.question}\nAnswer: ${q.answer}`)
    .join("\n\n")

  const prompt = `You are an expert teacher grading a student quiz${
    isCombined ? ` covering multiple subjects (${subjectsInvolved.join(", ")})` : ` in ${subject}`
  }.
Each question is labeled with the subject it belongs to in brackets — grade it against that
subject's standards specifically.
Grade each answer out of 10 points. Be fair but accurate.
Return ONLY a JSON array. No markdown, no explanation, no backticks.

Questions and Answers:
${questionsText}

Return this exact JSON array structure:
[
  {
    "question_id": "the question index as string, e.g. '0', '1'",
    "question": "the question text",
    "answer": "the student answer",
    "score": 7,
    "max_score": 10,
    "feedback": "Brief constructive feedback in 1-2 sentences explaining the score"
  }
]`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
      },
    }),
  })

  if (!response.ok) {
    // Fallback to gemini-2.5-flash
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    const fallbackResponse = await fetch(fallbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
      }),
    })
    if (!fallbackResponse.ok) throw new Error("Grading failed")
    const fallbackData = await fallbackResponse.json()
    const text = fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text || ""
    return JSON.parse(text.replace(/```json|```/g, "").trim())
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
  return JSON.parse(text.replace(/```json|```/g, "").trim())
}

export async function POST(request: Request) {
  try {
    const { job_id, subject, questions } = await request.json()

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No answers provided" },
        { status: 400 }
      )
    }

    // Grade with Gemini
    const gradedAnswers = await gradeWithGemini(subject, questions)

    // Calculate total score as percentage
    const totalPoints = gradedAnswers.reduce((sum, g) => sum + g.score, 0)
    const maxPoints = gradedAnswers.reduce((sum, g) => sum + g.max_score, 0)
    const total_score = Math.round((totalPoints / maxPoints) * 100)

    return NextResponse.json({
      total_score,
      feedback: gradedAnswers,
    })
  } catch (err) {
    console.error("Grade written error:", err)
    return NextResponse.json(
      { error: "Failed to grade answers" },
      { status: 500 }
    )
  }
}
