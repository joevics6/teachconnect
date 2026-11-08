// ============================================================
// lib/job-parser.ts
// The admin "Job Parser" (/admin/parse-jobs) — modelled on the JobMeter
// parse-jobs function. One pasted text can hold any number of
// postings. A single Gemini call reads it and returns a JSON ARRAY with
// one fully written job per role/subject: its own title, rewritten
// description, qualifications and search content (about/who-should-apply/
// stand-out accordions, responsibilities, skills, meta description).
// Each entry is then saved as its own job — no shared copy — against the
// school named in the text (found, or created as an admin "ghost" school),
// as "pending_approval", exactly like every other admin-posted job.
// Approving a job (on /admin/jobs) is still what publishes it and
// generates its social post.
// ============================================================

import { createAdminClient } from "@/lib/supabase/admin"
import { ALL_SUBJECTS, BENEFITS, NIGERIAN_STATES } from "@/lib/constants"
import { NIGERIAN_LGAS } from "@/lib/nigerian-locations"
import { findDuplicateJob } from "@/lib/job-duplicates"
import { generateWithGemini, parseGeminiJson } from "@/lib/gemini"
import { generateUniqueSchoolSlug } from "@/lib/slug"
import { SEO_PROSE_RULES, sanitizeJobSeoContent } from "@/lib/job-seo"

export const MAX_PARSE_CHARS = 60000

const LEVELS = ["nursery", "primary", "jss", "sss", "tertiary", "non_teaching"]
const EMPLOYMENT = ["full-time", "part-time", "contract"]
const SCHOOL_TYPES = ["private", "public", "international", "missionary"]
const ACCOMMODATION = ["fully-furnished", "unfurnished", "allowance"]

const PROMPT = (text: string) => `
You are an expert Nigerian education recruiter, job parser and SEO copywriter. The text below was copied from Facebook, WhatsApp or a website and may contain ONE or SEVERAL job postings. Parse it and return ONLY a valid JSON ARRAY. No explanation, no markdown, no backticks.

TEXT:
"""
${text}
"""

SEPARATE JOBS
- Return ONE object per distinct role or subject. If one advert asks for Mathematics, English and Physics teachers, return three objects, each written only about its own subject.
- Every object is a complete job and must be written independently. NEVER reuse sentences between jobs, even when the school and the requirements are the same — original wording per job is essential.
- Shared details (school, salary, benefits, how to apply) are repeated on each object.

REWRITE, DO NOT COPY
- Rewrite the description in professional, clear Nigerian English from the school's perspective, 3-5 sentences, as plain paragraphs separated by a blank line. No HTML, no emojis, no contact details in the text.
- Facts about the SCHOOL, pay and benefits (name, fees, salary, results, facilities, school history) must come only from the text. Never invent them.
- The text may be very short (for example just a location, a list of subjects and a contact). Still write EVERY field in full for each role. Write the role's own content from your knowledge of that role in Nigerian schools: the description, realistic standard required_qualifications (e.g. a relevant degree, NCE or B.Ed in the subject, TRCN registration, classroom experience), preferred_qualifications, responsibilities, skills and the three prose fields. Never return a job just because the text is thin.

LOCATION, LEVELS, SUBJECT AND CONTACT
- REMOTE JOBS: if the post says the job is remote, work from home, online or virtual, set is_remote true. A remote job needs no location: leave school.state, school.lga and school.town null unless the post names them. Otherwise is_remote is false.
- Always fill school.state and school.lga whenever any city, town or area is named, using your knowledge of Nigerian geography (e.g. Asaba -> Delta, Oshimili South; Ikeja -> Lagos, Ikeja; Garki -> FCT, Municipal Area Council). state must come from the list. Never leave state or lga null when a place is named. If only a state is named, give the LGA of its capital.
- If teaching levels are not stated, infer them from the school type: secondary school -> [\"jss\", \"sss\"]; primary school -> [\"primary\"]; nursery -> [\"nursery\"]; nursery and primary -> both.
- If the text says "a secondary school in Asaba" without a name, the school is not named: school_name null, is_confidential true.
- If a subject is not an exact name in the list, choose the closest one (e.g. ICT -> Computer Studies, Garment Making / Fashion Design / Clothing and Textiles -> Home Economics, Data Processing -> Data Processing).
- When one contact (phone, WhatsApp, email or website) is given for the whole advert, put the SAME contact in apply_contact on EVERY object.

Each object must have exactly these fields (null / empty when not stated):
{
  "title": "exact job title in Title Case, no emojis or extra words, e.g. 'Mathematics Teacher'",
  "subject": "exactly one of: ${ALL_SUBJECTS.join(", ")} — never null",
  "teaching_levels": ["one or more of: ${LEVELS.join(", ")}"],
  "employment_type": "${EMPLOYMENT.join(" | ")} (default full-time)",
  "is_remote": "true if the job is remote / work from home / online, else false",
  "positions": 1,
  "salary_min": 0,
  "salary_max": 0,
  "accommodation_offered": false,
  "accommodation_type": "${ACCOMMODATION.join(" | ")} or null",
  "benefits": ["values from exactly: ${BENEFITS.join(", ")}"],
  "deadline": "YYYY-MM-DD if an application deadline is stated, else null",
  "description": "the rewritten description",
  "required_qualifications": "requirements for THIS role, one per line, plain text, keeping every requirement in the text",
  "preferred_qualifications": "optional extras or null",
  "apply_contact": "the email address, phone/WhatsApp number or website to apply — or null",
  "school": {
    "school_name": "the hiring school's name, or null if the post hides it",
    "is_confidential": "true if the school is not named (e.g. 'a reputable school in Lekki'), else false",
    "school_type": "one of: ${SCHOOL_TYPES.join(", ")} — or null if not inferable",
    "state": "exactly one of: ${NIGERIAN_STATES.join(", ")} — or null",
    "lga": "LGA or area mentioned, or null",
    "town": "more specific town/neighbourhood, or null",
    "website": "school website or null",
    "about": "one short sentence about the school only if the text gives context, else null"
  },
  "role_category": "NORMALIZED standard title people search for, e.g. 'Mathematics Teacher', 'Primary School Teacher', 'Nursery Teacher', 'School Bursar', 'Principal'. No word 'jobs'. NYSC corps members: 'NYSC Teacher'.",
  "experience_level": "one of exactly: entry-level, junior, mid-level, senior, lead — infer from the qualifications; heads of department, vice principals and principals are lead",
  "responsibilities": ["5 to 8 short, specific duties for this exact role"],
  "skills_required": ["5 to 8 short keyword skills for this exact role"],
  "about_role": "PLAIN TEXT, 90-110 words. See rules.",
  "who_apply": "PLAIN TEXT, 90-110 words. See rules.",
  "standout": "PLAIN TEXT, 90-110 words. See rules.",
  "meta_description": "max 155 characters: role, school (unless confidential), location and a reason to click. No emojis, no quotes."
}

NON-TEACHING roles (bursar, accountant, admin officer, receptionist, librarian, counsellor, nurse, IT support, security, driver, cook, cleaner, gardener, maintenance, storekeeper, sports coach, transport coordinator, principal / head teacher / vice principal): set teaching_levels to exactly ["non_teaching"] and subject to the matching position name from the list above — NOT an academic subject.

${SEO_PROSE_RULES}
`

type Raw = Record<string, unknown>
type Str = string | null

const str = (v: unknown): Str => (typeof v === "string" && v.trim() && v.trim().toLowerCase() !== "null" ? v.trim() : null)
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)
const pick = (v: unknown, allowed: readonly string[]): Str => {
  const s = str(v)?.toLowerCase()
  return s ? allowed.find((a) => a.toLowerCase() === s) ?? null : null
}
const bool = (v: unknown) => v === true || v === "true"

/**
 * The AI sometimes names a town or LGA but leaves the state empty (or the
 * reverse). Fills the gaps from the Nigerian state/LGA list: a state given
 * directly wins, otherwise the state that owns the named LGA or town, and a
 * missing LGA falls back to the town.
 */
// Well-known towns that are not themselves an LGA name. Safety net for when
// the AI returns a place but no state/LGA.
const TOWN_LOCATIONS: Record<string, [string, string]> = {
  asaba: ["Delta", "Oshimili South"],
  warri: ["Delta", "Warri South"],
  lekki: ["Lagos", "Eti-Osa"],
  ajah: ["Lagos", "Eti-Osa"],
  "victoria island": ["Lagos", "Eti-Osa"],
  ikoyi: ["Lagos", "Eti-Osa"],
  yaba: ["Lagos", "Lagos Mainland"],
  maitama: ["FCT", "Municipal Area Council"],
  garki: ["FCT", "Municipal Area Council"],
  wuse: ["FCT", "Municipal Area Council"],
  abuja: ["FCT", "Municipal Area Council"],
  ibadan: ["Oyo", "Ibadan North"],
  "benin city": ["Edo", "Oredo"],
  abeokuta: ["Ogun", "Abeokuta South"],
  kano: ["Kano", "Kano Municipal"],
  owerri: ["Imo", "Owerri Municipal"],
  jos: ["Plateau", "Jos North"],
  ilorin: ["Kwara", "Ilorin West"],
  akure: ["Ondo", "Akure South"],
  kaduna: ["Kaduna", "Kaduna North"],
}

export function resolveLocation(stateIn: Str, lgaIn: Str, townIn: Str): { state: string | null; lga: string | null } {
  let state = NIGERIAN_STATES.find((s) => s.toLowerCase() === stateIn?.toLowerCase()) ?? null
  let lga = lgaIn
  if (!state) {
    for (const candidate of [lgaIn, townIn]) {
      if (!candidate) continue
      const c = candidate.toLowerCase()
      const hit = Object.entries(NIGERIAN_LGAS).find(([, lgas]) => lgas.some((l) => l.toLowerCase() === c))
      if (hit) {
        state = hit[0]
        if (!lga) lga = hit[1].find((l) => l.toLowerCase() === c) ?? candidate
        break
      }
    }
  }
  if (!state || !lga) {
    for (const candidate of [townIn, lgaIn]) {
      const hit = candidate ? TOWN_LOCATIONS[candidate.trim().toLowerCase()] : null
      if (hit) {
        state = state ?? hit[0]
        const valid = state && lga && (NIGERIAN_LGAS[state] ?? []).some((l) => l.toLowerCase() === lga!.toLowerCase())
        lga = valid ? lga : hit[1]
        break
      }
    }
  }
  if (!lga && townIn) lga = townIn
  return { state, lga }
}

export interface ParseBatchResult {
  success: boolean
  batchId: string | null
  totalJobs: number
  processedJobs: number
  failedJobs: number
  skippedJobs: number
  errors: { job: string; error: string }[]
  jobs: { id: string; title: string; school: string }[]
  error?: string
}

/** Pulls the JSON array out of the model's reply, tolerating fences and chatter. */
function extractJobs(text: string): Raw[] {
  const m = text.match(/\[[\s\S]*\]/)
  if (!m) throw new Error("No JSON array found in the AI response")
  const arr = parseGeminiJson<unknown>(m[0])
  if (!Array.isArray(arr)) throw new Error("AI response was not a list of jobs")
  return arr.filter((x): x is Raw => !!x && typeof x === "object")
}

export async function parseJobBatch(jobText: string): Promise<ParseBatchResult> {
  const db = createAdminClient()
  const startedAt = Date.now()

  // Batch record is best-effort: the parser still works if the
  // job_batches table has not been created yet.
  let batchId: string | null = null
  try {
    const { data } = await db
      .from("job_batches")
      .insert({
        source_type: "text_parse",
        source_data: { chars: jobText.length, preview: jobText.slice(0, 300) },
        status: "processing",
        processing_started_at: new Date(startedAt).toISOString(),
      })
      .select("id")
      .single()
    batchId = data?.id ?? null
  } catch {
    batchId = null
  }

  const errors: { job: string; error: string }[] = []
  const created: { id: string; title: string; school: string }[] = []
  let skipped = 0
  let total = 0

  const finish = async (fatal?: string): Promise<ParseBatchResult> => {
    const failed = errors.length
    const status = fatal ? "failed" : failed === 0 ? "completed" : created.length > 0 ? "partial" : "failed"
    if (batchId) {
      await db
        .from("job_batches")
        .update({
          status,
          total_jobs: total,
          processed_jobs: created.length,
          failed_jobs: failed,
          skipped_jobs: skipped,
          job_ids: created.map((j) => j.id),
          errors: fatal ? [{ job: "", error: fatal }] : errors,
          processing_completed_at: new Date().toISOString(),
          processing_duration_ms: Date.now() - startedAt,
        })
        .eq("id", batchId)
    }
    return {
      success: !fatal,
      batchId,
      totalJobs: total,
      processedJobs: created.length,
      failedJobs: failed,
      skippedJobs: skipped,
      errors,
      jobs: created,
      ...(fatal ? { error: fatal } : {}),
    }
  }

  let parsed: Raw[]
  try {
    const text = await generateWithGemini(PROMPT(jobText), { temperature: 0.5, maxOutputTokens: 32000 })
    parsed = extractJobs(text)
  } catch (err) {
    return finish(err instanceof Error ? err.message : "Failed to parse the text")
  }
  total = parsed.length
  if (total === 0) return finish("No jobs were found in the text")

  // One contact is often given for the whole advert; jobs the AI left
  // without one share it.
  const sharedContact = parsed.map((r) => str(r.apply_contact)).find((c): c is string => !!c) ?? null

  // Schools are reused within a run (several jobs from one advert).
  const schoolCache = new Map<string, { id: string; name: string }>()
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  for (const raw of parsed) {
    const label = str(raw.title) ?? "Untitled job"
    try {
      // ---- validate the job itself ----
      const title = str(raw.title)
      const subject = ALL_SUBJECTS.find((s) => s.toLowerCase() === str(raw.subject)?.toLowerCase()) ?? null
      const levels = (Array.isArray(raw.teaching_levels) ? raw.teaching_levels : [])
        .map((l) => pick(l, LEVELS))
        .filter((l): l is string => !!l)
      const description = str(raw.description)
      const required = str(raw.required_qualifications)
      if (!title) throw new Error("No job title found")
      if (!subject) throw new Error(`Subject "${str(raw.subject) ?? ""}" is not one of the supported subjects/positions`)
      if (!levels.length) throw new Error("No teaching level found")
      if (!description || !required) throw new Error("Description or required qualifications missing")

      const contact = str(raw.apply_contact) ?? sharedContact

      // ---- duplicate guard: same title + same contact already in the jobs table ----
      if (await findDuplicateJob(db, title, contact)) {
        skipped++
        continue
      }
      const sc = (raw.school && typeof raw.school === "object" ? raw.school : {}) as Raw
      const schoolName = str(sc.school_name)
      const anonymous = bool(sc.is_confidential) || !schoolName
      const isRemote = bool(raw.is_remote)
      const { state, lga } = resolveLocation(str(sc.state), str(sc.lga), str(sc.town))

      // ---- find or create the school ----
      const cacheKey = anonymous
        ? `anon|${isRemote ? "remote" : `${state}|${lga?.toLowerCase()}`}`
        : `${schoolName.toLowerCase()}|${state ?? ""}`
      let school = schoolCache.get(cacheKey) ?? null

      if (!school && !anonymous) {
        let q = db.from("school_profiles").select("id, school_name").eq("is_anonymous", false).ilike("school_name", escapeLike(schoolName))
        if (state) q = q.eq("state", state)
        const { data: found } = await q.limit(1)
        if (found?.[0]) school = { id: found[0].id, name: found[0].school_name }
      }

      // ---- duplicate guard (same job re-pasted) ----
      if (school && !anonymous) {
        const { data: dup } = await db
          .from("jobs")
          .select("id")
          .eq("school_id", school.id)
          .ilike("title", escapeLike(title))
          .gte("created_at", sevenDaysAgo)
          .limit(1)
        if (dup?.length) {
          skipped++
          continue
        }
      }

      if (anonymous && !contact) throw new Error("Confidential posting has no contact to apply with")

      if (!school) {
        // A remote job has no place of work, so state/LGA are only required for on-site jobs.
        if (!isRemote && (!state || !lga)) throw new Error("School state/LGA not found in the text")
        const finalName = anonymous ? "Confidential School" : schoolName
        const { data: made, error: schoolErr } = await db
          .from("school_profiles")
          .insert({
            user_id: null,
            school_name: finalName,
            slug: await generateUniqueSchoolSlug(db, finalName),
            school_type: pick(sc.school_type, SCHOOL_TYPES) ?? "private",
            school_levels: [],
            state,
            lga,
            town: str(sc.town),
            address: null,
            website: anonymous ? null : str(sc.website),
            logo_url: null,
            about: anonymous ? null : str(sc.about),
            is_verified: false,
            is_claimed: false,
            created_by_admin: true,
            is_anonymous: anonymous,
            claim_note: null,
          })
          .select("id, school_name")
          .single()
        if (schoolErr || !made) throw new Error("Could not create the school")
        school = { id: made.id, name: made.school_name }
      }
      schoolCache.set(cacheKey, school)

      // ---- salary, deadline, accommodation ----
      let salaryMin = Math.max(0, parseInt(String(raw.salary_min)) || 0)
      let salaryMax = Math.max(0, parseInt(String(raw.salary_max)) || 0)
      if (salaryMin && salaryMax && salaryMin === salaryMax) salaryMin = 0
      else if (salaryMin && salaryMax && salaryMax < salaryMin) [salaryMin, salaryMax] = [salaryMax, salaryMin]

      let deadline = str(raw.deadline)
      if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || deadline < today) {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        deadline = d.toISOString().split("T")[0]
      }
      const accommodation = bool(raw.accommodation_offered)
      const benefits = (Array.isArray(raw.benefits) ? raw.benefits : [])
        .map((b) => BENEFITS.find((x) => x.toLowerCase() === String(b).toLowerCase()))
        .filter((b): b is string => !!b)

      // ---- this job's own search content, written for it directly ----
      const seo = sanitizeJobSeoContent(raw)

      const { data: job, error: jobErr } = await db
        .from("jobs")
        .insert({
          school_id: school.id,
          title,
          subject,
          teaching_levels: levels,
          employment_type: pick(raw.employment_type, EMPLOYMENT) ?? "full-time",
          positions: parseInt(String(raw.positions)) || 1,
          salary_min: salaryMin,
          salary_max: salaryMax,
          accommodation_offered: accommodation,
          accommodation_type: accommodation ? pick(raw.accommodation_type, ACCOMMODATION) : null,
          benefits,
          is_private: false,
          is_featured: false,
          is_remote: isRemote,
          external_apply_enabled: !!contact,
          external_apply_value: contact,
          quiz_enabled: false,
          quiz_subjects: [],
          quiz_difficulty: null,
          quiz_subject_levels: null,
          quiz_pass_mark: null,
          quiz_mode: null,
          quiz_duration: null,
          quiz_question_count: null,
          custom_questions: [],
          description,
          required_qualifications: required,
          preferred_qualifications: str(raw.preferred_qualifications),
          deadline,
          status: "pending_approval",
          ...seo,
          ...(seo.about_role ? { seo_generated_at: new Date().toISOString() } : {}),
        })
        .select("id, title")
        .single()
      if (jobErr || !job) {
        console.error("Parsed job insert error:", jobErr)
        throw new Error("Could not save the job")
      }
      created.push({ id: job.id, title: job.title, school: school.name })
    } catch (err) {
      errors.push({ job: label, error: err instanceof Error ? err.message : "Unknown error" })
    }
  }

  return finish()
}
