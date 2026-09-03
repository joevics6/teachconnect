// ============================================================
// lib/social-post.ts
// Builds the ready-to-paste social post for a job and saves it to
// jobs.social. Called the moment a job goes live — from the admin
// approve action (app/api/admin/jobs/[id]/route.ts) and from the
// manual regenerate endpoint (app/api/admin/jobs/[id]/social/route.ts).
//
// Format matches the JobMeter/ClassHire convention:
//
//   Hiring: <title>
//   Location: <lga>, <state>
//
//   Requirements:
//   • <bullet>
//   • <bullet>
//
//   Apply: <site>/jobs/<id>
//
// Gemini (via lib/gemini.ts, same key-rotation helper used
// elsewhere) is only used for the narrow job of condensing
// required/preferred qualifications into 2-4 short bullets — the
// rest of the template is built directly from job data so a
// Gemini outage never blocks a post from being generated (falls
// back to a naive split of the qualifications text instead).
// ============================================================

import { createAdminClient } from "@/lib/supabase/admin"
import { generateWithGemini, parseGeminiJson } from "@/lib/gemini"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://classhire.jobmeter.app"

const BULLETS_PROMPT = (requiredQualifications: string, preferredQualifications: string | null) => `
You are writing a short social media job post for a Nigerian school hiring a teacher.
Condense the qualifications below into 2-4 short, punchy requirement bullets (each under 12 words, no leading dash or bullet character, no trailing period).

Required qualifications: "${requiredQualifications}"
${preferredQualifications ? `Preferred qualifications: "${preferredQualifications}"` : ""}

Return ONLY a valid JSON object, no markdown, no explanation:
{ "bullets": ["bullet one", "bullet two"] }
`

/** Naive fallback if Gemini is unavailable — splits on sentence/newline breaks. */
function fallbackBullets(requiredQualifications: string): string[] {
  const parts = requiredQualifications
    .split(/[\n.]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
  return (parts.length ? parts : [requiredQualifications.trim()]).slice(0, 4)
}

async function getBullets(requiredQualifications: string, preferredQualifications: string | null): Promise<string[]> {
  try {
    const text = await generateWithGemini(BULLETS_PROMPT(requiredQualifications, preferredQualifications), {
      temperature: 0.3,
      maxOutputTokens: 300,
    })
    const parsed = parseGeminiJson<{ bullets?: string[] }>(text)
    if (Array.isArray(parsed.bullets) && parsed.bullets.length > 0) {
      return parsed.bullets.slice(0, 4)
    }
  } catch (err) {
    console.error("Social post: Gemini bullet generation failed, using fallback:", err)
  }
  return fallbackBullets(requiredQualifications)
}

function formatLocation(lga: string | null | undefined, state: string | null | undefined): string {
  const parts = [lga, state].map((p) => p?.trim()).filter(Boolean)
  return parts.length ? parts.join(", ") : "Nigeria"
}

/**
 * Generates the social post for a job and saves it to jobs.social.
 * Best-effort: returns null (without throwing) if the job can't be
 * found, so callers — usually the approve action — never fail the
 * calling request because of this.
 */
export async function generateAndSaveSocialPost(jobId: string): Promise<string | null> {
  const adminDb = createAdminClient()

  const { data: job, error } = await adminDb
    .from("jobs")
    .select(`
      id, title, required_qualifications, preferred_qualifications,
      school_profiles ( lga, state )
    `)
    .eq("id", jobId)
    .single()

  if (error || !job) {
    console.error("Social post: job not found:", jobId, error)
    return null
  }

  const school = Array.isArray(job.school_profiles) ? job.school_profiles[0] : job.school_profiles
  const bullets = await getBullets(job.required_qualifications, job.preferred_qualifications ?? null)

  const post = [
    `Hiring: ${job.title}`,
    `Location: ${formatLocation(school?.lga, school?.state)}`,
    "",
    "Requirements:",
    ...bullets.map((b) => `• ${b}`),
    "",
    `Apply: ${SITE_URL}/jobs/${job.id}`,
  ].join("\n")

  const { error: updateError } = await adminDb.from("jobs").update({ social: post }).eq("id", jobId)
  if (updateError) {
    console.error("Social post: failed to save:", updateError)
    return null
  }

  return post
}
