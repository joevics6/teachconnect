// ============================================================
// lib/job-seo.ts
// Generates the extra, search-oriented content for a job page:
//   role_category     normalized, searchable title ("Mathematics Teacher")
//   experience_level  entry-level | junior | mid-level | senior | lead
//   responsibilities  5-8 short bullet points
//   skills_required   5-8 keyword skills
//   about_role        ~100 words, plain text   (accordion 1)
//   who_apply         ~100 words, plain text   (accordion 2)
//   standout          ~100 words, plain text   (accordion 3)
//   meta_description  <= 155 chars, used for <meta name="description">
//
// Adapted from JobMeter's parse-jobs function. Generated per job (not
// per pasted posting) so that when one posting is split into several
// subject jobs, each URL still gets its own unique text — duplicate
// copy across URLs is what search engines punish.
//
// Best-effort everywhere: ensureJobSeoContent never throws, so a
// Gemini outage can't block approving a job.
// ============================================================

import { createAdminClient } from "@/lib/supabase/admin"
import { generateWithGemini, parseGeminiJson } from "@/lib/gemini"

export interface JobSeoContent {
  role_category: string | null
  experience_level: string | null
  responsibilities: string[]
  skills_required: string[]
  about_role: string | null
  who_apply: string | null
  standout: string | null
  meta_description: string | null
}

const EXPERIENCE_LEVELS = ["entry-level", "junior", "mid-level", "senior", "lead"]

export interface JobSeoInput {
  title: string
  subject: string | null
  teaching_levels: string[] | null
  employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  accommodation_offered: boolean | null
  benefits: string[] | null
  description: string | null
  required_qualifications: string | null
  preferred_qualifications: string | null
  school_name: string | null
  school_type: string | null
  state: string | null
  lga: string | null
  is_anonymous: boolean
}

const PROMPT = (j: JobSeoInput) => `
You are an expert Nigerian education recruiter and SEO copywriter. Using ONLY the job details below, write search-optimised content for the public job page.
Return ONLY a valid JSON object. No explanation, no markdown, no backticks.

JOB DETAILS
Title: ${j.title}
Subject / position: ${j.subject ?? "n/a"}
Levels: ${(j.teaching_levels ?? []).join(", ") || "n/a"}
Employment type: ${j.employment_type ?? "n/a"}
School: ${j.is_anonymous ? "(confidential - never name it)" : j.school_name ?? "n/a"}
School type: ${j.school_type ?? "n/a"}
Location: ${[j.lga, j.state].filter(Boolean).join(", ") || "Nigeria"}
Salary (NGN): ${j.salary_min || j.salary_max ? `${j.salary_min || ""}-${j.salary_max || ""}` : "not disclosed"}
Accommodation offered: ${j.accommodation_offered ? "yes" : "not stated"}
Benefits: ${(j.benefits ?? []).join(", ") || "not stated"}
Description: ${j.description ?? ""}
Required qualifications: ${j.required_qualifications ?? ""}
Preferred qualifications: ${j.preferred_qualifications ?? ""}

Return exactly this JSON:
{
  "role_category": "NORMALIZED standard title people actually search for, e.g. 'Mathematics Teacher', 'Primary School Teacher', 'Nursery Teacher', 'School Bursar', 'Principal'. No word 'jobs'. If the role is for NYSC corps members use 'NYSC Teacher'.",
  "experience_level": "one of exactly: ${EXPERIENCE_LEVELS.join(", ")} — infer from the qualifications; heads of department, vice principals and principals are 'lead'",
  "responsibilities": ["5 to 8 short, specific duties for this exact role"],
  "skills_required": ["5 to 8 short keyword skills for this exact role"],
  "about_role": "PLAIN TEXT, 90-110 words. See rules.",
  "who_apply": "PLAIN TEXT, 90-110 words. See rules.",
  "standout": "PLAIN TEXT, 90-110 words. See rules.",
  "meta_description": "max 155 characters: role, school (unless confidential), location and a reason to click. No emojis, no quotes."
}

RULES FOR THE THREE PROSE FIELDS (plain text, no HTML, no markdown, no bullet characters, one paragraph each):
about_role:
- Open with ONE sentence on the state of private/primary/secondary education in the job's state or area of Nigeria.
- Work in 4-5 role-specific keywords naturally (e.g. lesson planning, scheme of work, continuous assessment, WAEC/NECO preparation, classroom management, UBE curriculum, Cambridge IGCSE, Montessori, differentiated instruction - choose only what fits the role).
- Describe the role's impact on pupil outcomes, school reputation and academic results.
- No filler like "exciting opportunity" or "great school". Every sentence must carry searchable meaning.
who_apply:
- Describe the ideal candidate with professional labels (e.g. "Qualified Mathematics Educator", "Early Years Specialist").
- Name 2-3 real, relevant certifications or qualifications (e.g. TRCN registration, PGDE, B.Ed, NCE, TEFL/CELTA, Montessori diploma, Cambridge teaching certificates; for non-teaching roles use ICAN, ANAN, CIPM and the like).
- State the experience level precisely, consistent with the qualifications given.
- List 3-4 must-have tools or hard skills (e.g. Google Classroom, Microsoft Teams, smartboards, lesson-plan software, ERP/accounting packages for non-teaching roles).
standout:
- Every sentence starts with an action verb: Showcase, Quantify, Demonstrate, Highlight, Complete.
- Tell candidates to quantify impact with realistic examples (e.g. raising class WAEC credit pass rates, improving average scores, running successful extracurricular clubs).
- Recommend 1-2 upskilling paths (e.g. TRCN professional development, Google Certified Educator, Cambridge professional qualifications, Montessori training).
- Mention an ATS-friendly CV, a teaching portfolio or a professional LinkedIn profile.

GENERAL: Never invent facts about the school, its fees, results or facilities. Never state a salary that was not given. Write in clear professional Nigerian English.
`

function clean(text: unknown, maxChars: number): string | null {
  if (typeof text !== "string") return null
  const t = text
    .replace(/<[^>]*>/g, " ")
    .replace(/[*_#`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (t.split(" ").length < 25) return null // too thin to be worth publishing
  return t.slice(0, maxChars)
}

function cleanList(arr: unknown, max: number): string[] {
  if (!Array.isArray(arr)) return []
  return arr
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim())
    .filter((x) => x.length > 2)
    .slice(0, max)
}

export function sanitizeJobSeoContent(raw: Record<string, unknown>): JobSeoContent {
  const level = typeof raw.experience_level === "string" ? raw.experience_level.toLowerCase().trim() : ""
  const meta = typeof raw.meta_description === "string" ? raw.meta_description.replace(/\s+/g, " ").trim() : ""
  const role = typeof raw.role_category === "string" ? raw.role_category.replace(/\s+jobs?$/i, "").trim() : ""
  return {
    role_category: role ? role.slice(0, 80) : null,
    experience_level: EXPERIENCE_LEVELS.includes(level) ? level : null,
    responsibilities: cleanList(raw.responsibilities, 8),
    skills_required: cleanList(raw.skills_required, 8),
    about_role: clean(raw.about_role, 1200),
    who_apply: clean(raw.who_apply, 1200),
    standout: clean(raw.standout, 1200),
    meta_description: meta ? meta.slice(0, 160) : null,
  }
}

/** Calls Gemini for one job. Throws on failure — use ensureJobSeoContent for the safe wrapper. */
export async function generateJobSeoContent(input: JobSeoInput): Promise<JobSeoContent> {
  const text = await generateWithGemini(PROMPT(input), { temperature: 0.4, maxOutputTokens: 3000 })
  return sanitizeJobSeoContent(parseGeminiJson<Record<string, unknown>>(text))
}

async function loadInput(jobId: string): Promise<{ input: JobSeoInput; hasSeo: boolean } | null> {
  const adminDb = createAdminClient()
  const { data: job, error } = await adminDb
    .from("jobs")
    .select(`
      title, subject, teaching_levels, employment_type, salary_min, salary_max,
      accommodation_offered, benefits, description, required_qualifications,
      preferred_qualifications, about_role,
      school_profiles ( school_name, school_type, state, lga, is_anonymous )
    `)
    .eq("id", jobId)
    .single()
  if (error || !job) {
    console.error("Job SEO: job not found:", jobId, error)
    return null
  }
  const school = Array.isArray(job.school_profiles) ? job.school_profiles[0] : job.school_profiles
  return {
    hasSeo: Boolean(job.about_role),
    input: {
      title: job.title,
      subject: job.subject,
      teaching_levels: job.teaching_levels,
      employment_type: job.employment_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      accommodation_offered: job.accommodation_offered,
      benefits: job.benefits,
      description: job.description,
      required_qualifications: job.required_qualifications,
      preferred_qualifications: job.preferred_qualifications,
      school_name: school?.school_name ?? null,
      school_type: school?.school_type ?? null,
      state: school?.state ?? null,
      lga: school?.lga ?? null,
      is_anonymous: Boolean(school?.is_anonymous),
    },
  }
}

/**
 * Generates and saves SEO content for a job. Skips jobs that already
 * have it unless `force` is set (admin "Regenerate"). Never throws.
 */
export async function ensureJobSeoContent(
  jobId: string,
  options?: { force?: boolean }
): Promise<JobSeoContent | null> {
  try {
    const loaded = await loadInput(jobId)
    if (!loaded) return null
    if (loaded.hasSeo && !options?.force) return null

    const content = await generateJobSeoContent(loaded.input)
    const { error } = await createAdminClient()
      .from("jobs")
      .update({ ...content, seo_generated_at: new Date().toISOString() })
      .eq("id", jobId)
    if (error) {
      console.error("Job SEO: failed to save:", jobId, error)
      return null
    }
    return content
  } catch (err) {
    console.error("Job SEO: generation failed for job", jobId, err)
    return null
  }
}
