import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Helper — get or auto-create school profile row
async function getSchoolProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: rows } = await supabase
    .from("school_profiles")
    .select("id, school_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)

  if (rows?.[0]) return rows[0]

  const { data: { user } } = await supabase.auth.getUser()
  const meta = user?.user_metadata || {}

  const { data: created } = await supabase
    .from("school_profiles")
    .insert({
      user_id:           userId,
      school_name:       (meta.school_name as string) || (meta.full_name as string) || "My School",
      school_type:       (meta.school_type as string) || "private",
      state:             (meta.state as string) || "",
      lga:               (meta.lga as string) || "",
      address:           "",
      contact_name:      (meta.full_name as string) || "",
      contact_email:     user?.email || "",
      contact_phone:     "",
      contact_role:      "",
      contact_phone_alt: "",
      website:           "",
      school_levels:     [],
      logo_url:          null,
      cac_number:        "",
      is_verified:       false,
      is_registered:     false,
    })
    .select("id, school_name")

  return created?.[0] ?? null
}

// ── GET: list school's own jobs ─────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const school = await getSchoolProfile(supabase, user.id)
    if (!school) return NextResponse.json({ error: "School profile not found" }, { status: 404 })

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(`
        id, title, subject, teaching_levels, employment_type,
        salary_min, salary_max, accommodation_offered,
        quiz_enabled, deadline, status, is_featured, created_at,
        applications(count)
      `)
      .eq("school_id", school.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Shape jobs to include applicant counts
    const shaped = (jobs ?? []).map((j) => ({
      ...j,
      applicants_count:   (j.applications as unknown as { count: number }[])?.[0]?.count ?? 0,
      passed_quiz_count:  0,
    }))

    return NextResponse.json({ jobs: shaped })
  } catch (err) {
    console.error("GET /api/school/jobs error:", err)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

// ── POST: create a new job ──────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const school = await getSchoolProfile(supabase, user.id)
    if (!school) {
      return NextResponse.json(
        { error: "School profile not found. Please complete your profile first." },
        { status: 404 }
      )
    }

    const body = await request.json()

    const required = ["title", "subject", "employment_type", "deadline", "description", "required_qualifications"]
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
    if (!body.teaching_levels?.length) {
      return NextResponse.json({ error: "At least one teaching level is required" }, { status: 400 })
    }

    const jobPayload = {
      school_id:                school.id,
      title:                    body.title,
      subject:                  body.subject,
      teaching_levels:          body.teaching_levels,
      employment_type:          body.employment_type,
      positions:                parseInt(body.positions) || 1,
      salary_min:               parseInt(body.salary_min) || 0,
      salary_max:               parseInt(body.salary_max) || 0,
      accommodation_offered:    body.accommodation_offered ?? false,
      accommodation_type:       body.accommodation_offered ? (body.accommodation_type || null) : null,
      benefits:                 body.benefits ?? [],
      is_private:               body.is_private ?? false,
      is_featured:              body.is_featured ?? false,
      quiz_enabled:             body.quiz_enabled ?? false,
      quiz_subject:             body.quiz_enabled ? (body.quiz_subject || null) : null,
      quiz_difficulty:          body.quiz_enabled ? (body.quiz_difficulty || null) : null,
      quiz_pass_mark:           body.quiz_enabled ? (parseInt(body.quiz_pass_mark) || 70) : null,
      quiz_mode:                body.quiz_enabled ? (body.quiz_mode || "standard") : null,
      quiz_duration:            body.quiz_enabled ? (parseInt(body.quiz_duration) || 20) : null,
      quiz_question_count:      body.quiz_enabled ? (parseInt(body.quiz_question_count) || 20) : null,
      custom_questions:         body.quiz_enabled
                                  ? (body.custom_questions ?? []).filter((q: string) => q.trim() !== "")
                                  : [],
      description:              body.description,
      required_qualifications:  body.required_qualifications,
      preferred_qualifications: body.preferred_qualifications || null,
      deadline:                 body.deadline,
      status:                   "active",
    }

    const { data: newJob, error: insertError } = await supabase
      .from("jobs")
      .insert(jobPayload)
      .select("id, title")

    if (insertError) {
      console.error("Job insert error:", insertError)
      return NextResponse.json({ error: insertError.message || "Failed to create job" }, { status: 500 })
    }

    const job = (newJob ?? [])[0]
    return NextResponse.json({ success: true, job: { id: job?.id, title: job?.title } })
  } catch (err) {
    console.error("POST /api/school/jobs error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to post job" }, { status: 500 })
  }
}
