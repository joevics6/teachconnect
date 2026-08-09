// ============================================================
// app/api/teacher/parse-cv/route.ts
// POST — parse uploaded CV with Gemini and return profile fields
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ALL_SUBJECTS, NIGERIAN_STATES } from "@/lib/constants"
import { parseGeminiJson } from "@/lib/gemini"
import { callGeminiWithDocument, isAcceptedDocumentType, ACCEPTED_DOCUMENT_LABEL, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/document-extract"

const CV_PROMPT = `You are an expert CV/resume parser for a Nigerian teacher recruitment platform called ClassHire.
Extract ALL available information from this CV and return a single valid JSON object.
Be thorough — extract everything present, leave fields null or empty array [] if not found.
Return ONLY raw JSON. No markdown, no backticks, no explanation, no preamble.

{
  "full_name": "string | null",
  "email": "string | null",
  "phone": "string | null",
  "location": "string | null — city/area they live in",
  "state": "Nigerian state | null — must be one of: ${NIGERIAN_STATES.join(", ")}",
  "lga": "string | null",
  "summary": "string | null — their own professional summary if present on CV",

  "roles": ["job titles/roles this person has held"],
  "skills": ["all technical and soft skills listed or implied"],
  "years_of_teaching_experience": "integer | null — count only teaching roles",
  "years_experience": "integer | null — total years any work experience",
  "experience_level": "entry | mid | senior | null — infer from years and seniority",

  "work_experience": [
    {
      "title": "string",
      "organization": "string",
      "location": "string | null",
      "start_date": "string | null",
      "end_date": "string | null — use Present if current",
      "description": "string | null"
    }
  ],

  "education": [
    {
      "degree": "string",
      "institution": "string",
      "field": "string | null",
      "year": "string | null",
      "grade": "string | null"
    }
  ],

  "certifications": ["certification names"],
  "awards": ["awards or honours"],
  "languages": ["languages spoken"],
  "volunteer_work": [{ "role": "string", "organization": "string", "description": "string | null" }],
  "publications": ["publication titles"],
  "accomplishments": ["notable accomplishments"],
  "interests": ["hobbies or interests"],
  "linkedin": "string | null — LinkedIn URL if present",

  "teaching_levels": ["array — only use values: nursery, primary, jss, sss, tertiary, adult_education — infer from schools worked at"],
  "subjects_taught": ["subjects — only from: ${ALL_SUBJECTS.join(", ")}"],
  "curriculum_experience": ["e.g. Nigerian, British, IB, Montessori, American"],
  "teaching_style": ["e.g. project-based, lecture, collaborative, differentiated — infer from descriptions"],
  "classroom_management_skills": ["classroom management techniques mentioned"],
  "lesson_delivery_mode": ["in-person | online | hybrid — infer from context"],

  "trcn_number": "string | null",
  "trcn_status": "registered | pending | not-registered — registered if number found, pending if mentioned without number, not-registered if no mention",

  "preferred_locations": ["specific cities or areas mentioned as preferred"],
  "preferred_states": ["Nigerian states mentioned as preferred work locations"],
  "willing_to_relocate": "boolean | null",
  "accommodation_needed": "boolean | null",
  "availability": "immediate | 2-weeks | 1-month | employed | null — employed if currently working with no availability stated",
  "job_type": "full-time | part-time | contract | null",
  "sector": "public | private | international | null",

  "salary_min": "integer | null — minimum monthly salary in Naira if stated, else null",

  "bio": "Write a compelling 150-200 word professional bio in third person based on this CV. Be specific — mention their actual subjects, school levels, years of experience, and notable achievements. Do not be generic."
}`

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("cv") as File | null
    const tempId = formData.get("temp_id") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No CV file provided" },
        { status: 400 }
      )
    }

    if (!tempId) {
      return NextResponse.json(
        { error: "No temp_id provided" },
        { status: 400 }
      )
    }

    // Validate file type — PDF, DOC/DOCX, or a photo of a CV. PDFs and
    // images go straight to Gemini's vision/document understanding;
    // Word docs get text-extracted first (see lib/document-extract.ts —
    // the shared utility every document-upload feature on the site
    // should use, so format support never drifts between call sites).
    if (!isAcceptedDocumentType(file.type)) {
      return NextResponse.json(
        { error: `Only ${ACCEPTED_DOCUMENT_LABEL} files are supported` },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File must be under 5MB" },
        { status: 400 }
      )
    }

    let parsed: Record<string, unknown> | null = null

    // generateWithGemini (called inside callGeminiWithDocument) already
    // tries both models across every configured API key before giving
    // up (see lib/gemini.ts) — this used to be a single manual
    // two-model fallback on one key, which is exactly the kind of thing
    // that produces "parsing failed" the moment that one key hits its
    // rate/quota limit.
    try {
      const text = await callGeminiWithDocument(CV_PROMPT, file, { maxOutputTokens: 4096 })
      parsed = parseGeminiJson(text)
    } catch (err) {
      console.error("CV parsing failed on every model/key combination:", err)
      return NextResponse.json(
        { error: err instanceof Error && err.message.startsWith("Couldn't extract")
            ? err.message
            : "CV parsing failed. Please fill in the form manually." },
        { status: 500 }
      )
    }

    if (!parsed) {
      return NextResponse.json(
        { error: "CV parsing returned no data." },
        { status: 500 }
      )
    }

    // ── Save to onboarding_data (upsert by temp_id) ──────────────────────────
    // user_id is null at this point — it gets linked on final registration submit
    try {
      const supabase = await createClient()
      await supabase
        .from("onboarding_data")
        .upsert(
          {
            temp_id: tempId,
            user_id: null,
            // Basic
            cv_name:     parsed.full_name     ?? null,
            cv_email:    parsed.email         ?? null,
            cv_phone:    parsed.phone         ?? null,
            cv_location: parsed.location      ?? null,
            cv_summary:  parsed.summary       ?? null,
            // Professional
            cv_roles:                    parsed.roles                    ?? null,
            cv_skills:                   parsed.skills                   ?? null,
            cv_experience:               parsed.years_experience != null ? String(parsed.years_experience) : null,
            years_of_teaching_experience: parsed.years_of_teaching_experience ?? null,
            experience_level:            parsed.experience_level         ?? null,
            // Work & Education
            cv_work_experience: parsed.work_experience ?? null,
            cv_education:       parsed.education       ?? null,
            cv_certifications:  parsed.certifications  ?? null,
            cv_awards:          parsed.awards          ?? null,
            cv_languages:       parsed.languages       ?? null,
            cv_volunteer_work:  parsed.volunteer_work  ?? null,
            // Academic & Personal
            cv_publications:    parsed.publications    ?? null,
            cv_accomplishments: parsed.accomplishments ?? null,
            cv_interests:       parsed.interests       ?? null,
            // Teacher-specific
            teaching_levels:             parsed.teaching_levels             ?? null,
            subjects_taught:             parsed.subjects_taught             ?? null,
            curriculum_experience:       parsed.curriculum_experience       ?? null,
            teaching_style:              parsed.teaching_style              ?? null,
            classroom_management_skills: parsed.classroom_management_skills ?? null,
            lesson_delivery_mode:        parsed.lesson_delivery_mode        ?? null,
            // Credentials
            trcn_number: parsed.trcn_number ?? null,
            trcn_status: parsed.trcn_status ?? null,
            // Preferences
            preferred_locations:  parsed.preferred_locations  ?? null,
            preferred_states:     parsed.preferred_states     ?? null,
            willing_to_relocate:  parsed.willing_to_relocate  ?? null,
            accommodation_needed: parsed.accommodation_needed ?? null,
            availability:         parsed.availability         ?? null,
            job_type:             parsed.job_type             ?? null,
            sector:               parsed.sector               ?? null,
            // Salary
            salary_min: parsed.salary_min ?? null,
            // Social
            cv_linkedin: parsed.linkedin ?? null,
          },
          { onConflict: "temp_id" }
        )
    } catch (dbErr) {
      // Non-fatal — log and continue. Form will still be pre-filled from parsed data.
      console.error("onboarding_data upsert failed:", dbErr)
    }

    // ── Return to client ─────────────────────────────────────────────────────
    // Return the full raw parsed object so the register page can cache ALL fields locally
    return NextResponse.json({
      parsed: {
        // Basic
        full_name:    parsed.full_name,
        email:        parsed.email,
        phone:        parsed.phone,
        state:        parsed.state,
        lga:          parsed.lga,
        location:     parsed.location,
        summary:      parsed.summary,
        // Professional
        roles:        parsed.roles        ?? [],
        skills:       parsed.skills       ?? [],
        years_experience:     parsed.years_of_teaching_experience ?? parsed.years_experience,
        experience_level:     parsed.experience_level,
        // Work & Education
        work_experience:  parsed.work_experience  ?? [],
        education:        parsed.education        ?? [],
        certifications:   parsed.certifications   ?? [],
        awards:           parsed.awards           ?? [],
        languages:        parsed.languages        ?? [],
        volunteer_work:   parsed.volunteer_work   ?? [],
        publications:     parsed.publications     ?? [],
        accomplishments:  parsed.accomplishments  ?? [],
        interests:        parsed.interests        ?? [],
        linkedin:         parsed.linkedin,
        // Teacher-specific
        teaching_levels:             parsed.teaching_levels             ?? [],
        subjects:                    parsed.subjects_taught             ?? [],
        curriculum_experience:       parsed.curriculum_experience       ?? [],
        teaching_style:              parsed.teaching_style              ?? [],
        classroom_management_skills: parsed.classroom_management_skills ?? [],
        lesson_delivery_mode:        parsed.lesson_delivery_mode        ?? [],
        // Credentials
        trcn_number:  parsed.trcn_number,
        trcn_status:  parsed.trcn_status,
        // Preferences
        preferred_locations:  parsed.preferred_locations  ?? [],
        preferred_states:     parsed.preferred_states     ?? [],
        willing_to_relocate:  parsed.willing_to_relocate  ?? false,
        accommodation_needed: parsed.accommodation_needed ?? false,
        availability:         parsed.availability,
        job_type:             parsed.job_type,
        sector:               parsed.sector,
        // Salary
        salary_min: parsed.salary_min,
        // Bio
        bio: parsed.bio,
        // Counts for the success banner
        _meta: {
          skills_count:          Array.isArray(parsed.skills)          ? (parsed.skills as unknown[]).length          : 0,
          work_experience_count: Array.isArray(parsed.work_experience) ? (parsed.work_experience as unknown[]).length : 0,
          education_count:       Array.isArray(parsed.education)       ? (parsed.education as unknown[]).length       : 0,
          certifications_count:  Array.isArray(parsed.certifications)  ? (parsed.certifications as unknown[]).length  : 0,
        },
      },
    })
  } catch (err) {
    console.error("CV parse error:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to parse CV",
      },
      { status: 500 }
    )
  }
}