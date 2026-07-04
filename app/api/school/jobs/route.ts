// ============================================================
// app/api/school/jobs/route.ts
// GET  — list jobs for the logged-in school
// POST — create a new job posting
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ── GET: list school's own jobs ───────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get school_id from school_profiles
    const { data: schoolRows, error: schoolError } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    const schoolProfile = (schoolRows ?? [])[0] ?? null
    if (schoolError || !schoolProfile) {
      return NextResponse.json({ error: "School profile not found" }, { status: 404 })
    }

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("school_id", schoolProfile.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: jobs ?? [] })
  } catch (err) {
    console.error("GET /api/school/jobs error:", err)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

// ── POST: create a new job ────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch school_id — jobs link to school_profiles.id, not auth user id
    const { data: schoolRows, error: schoolError } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    const schoolProfile = (schoolRows ?? [])[0] ?? null
    if (schoolError || !schoolProfile) {
      return NextResponse.json(
        { error: "School profile not found. Please complete your school profile first." },
        { status: 404 }
      )
    }

    const body = await request.json()

    // ── Validate required fields ──────────────────────────────────────────────
    const required = ["title", "subject", "employment_type", "deadline", "description", "required_qualifications"]
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    if (!body.teaching_levels?.length) {
      return NextResponse.json({ error: "At least one teaching level is required" }, { status: 400 })
    }

    // ── Build insert payload ──────────────────────────────────────────────────
    const jobPayload = {
      school_id:               schoolProfile.id,
      title:                   body.title,
      subject:                 body.subject,
      teaching_levels:         body.teaching_levels,
      employment_type:         body.employment_type,
      positions:               parseInt(body.positions) || 1,
      salary_min:              parseInt(body.salary_min) || 0,
      salary_max:              parseInt(body.salary_max) || 0,
      accommodation_offered:   body.accommodation_offered ?? false,
      accommodation_type:      body.accommodation_offered ? (body.accommodation_type || null) : null,
      benefits:                body.benefits ?? [],
      is_private:              body.is_private ?? false,
      is_featured:             body.is_featured ?? false,
      quiz_enabled:            body.quiz_enabled ?? false,
      quiz_subject:            body.quiz_enabled ? (body.quiz_subject || null) : null,
      quiz_difficulty:         body.quiz_enabled ? (body.quiz_difficulty || null) : null,
      quiz_pass_mark:          body.quiz_enabled ? (parseInt(body.quiz_pass_mark) || 70) : null,
      quiz_mode:               body.quiz_enabled ? (body.quiz_mode || "standard") : null,
      quiz_duration:           body.quiz_enabled ? (parseInt(body.quiz_duration) || 20) : null,
      quiz_question_count:     body.quiz_enabled ? (parseInt(body.quiz_question_count) || 20) : null,
      custom_questions:        body.quiz_enabled
                                 ? (body.custom_questions ?? []).filter((q: string) => q.trim() !== "")
                                 : [],
      description:             body.description,
      required_qualifications: body.required_qualifications,
      preferred_qualifications: body.preferred_qualifications || null,
      deadline:                body.deadline,
      status:                  "active",
    }

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert(jobPayload)
      .select("id, title")
      .single()

    if (insertError) {
      console.error("Job insert error:", insertError)
      return NextResponse.json(
        { error: insertError.message || "Failed to create job" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      job: { id: job.id, title: job.title },
    })
  } catch (err) {
    console.error("POST /api/school/jobs error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to post job" },
      { status: 500 }
    )
  }
}