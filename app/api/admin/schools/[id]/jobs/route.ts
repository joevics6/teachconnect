// ============================================================
// app/api/admin/schools/[id]/jobs/route.ts
// POST — create a job attributed to an admin-created ("ghost")
// school. Deliberately much simpler than api/school/jobs (POST):
// no plan limits, no premium-field gating, no featured-listing
// payment — admin isn't a paying customer posting through a plan,
// and the job goes straight to "active" instead of
// "pending_approval" since admin creating it IS the approval.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: schoolId } = await params
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const adminDb = createAdminClient()
    const { data: school } = await adminDb
      .from("school_profiles").select("id, created_by_admin").eq("id", schoolId).single()
    if (!school || !school.created_by_admin) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    const body = await request.json()
    const required = ["title", "subject", "employment_type", "description", "required_qualifications"]
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ error: `${field.replace(/_/g, " ")} is required` }, { status: 400 })
    }
    if (!body.teaching_levels?.length) {
      return NextResponse.json({ error: "At least one teaching level is required" }, { status: 400 })
    }

    let deadline = body.deadline
    if (!deadline) {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      deadline = d.toISOString().split("T")[0]
    }

    // Same salary normalization as the school-facing route: either
    // bound is enough, equal values collapse to max-only, reversed
    // values get swapped rather than erroring.
    let salaryMin = body.salary_min ? parseInt(body.salary_min) : 0
    let salaryMax = body.salary_max ? parseInt(body.salary_max) : 0
    if (!salaryMin && !salaryMax) {
      return NextResponse.json({ error: "Enter a minimum or maximum salary" }, { status: 400 })
    }
    if (salaryMin && salaryMax && salaryMin === salaryMax) {
      salaryMin = 0
    } else if (salaryMin && salaryMax && salaryMax < salaryMin) {
      ;[salaryMin, salaryMax] = [salaryMax, salaryMin]
    }

    if (body.quiz_enabled) {
      if (!body.quiz_subject_levels?.length) {
        return NextResponse.json({ error: "Select at least one quiz subject" }, { status: 400 })
      }
      if (body.quiz_subject_levels.length > 3) {
        return NextResponse.json({ error: "A quiz can test at most 3 subjects" }, { status: 400 })
      }
    }
    if (body.external_apply_enabled && !String(body.external_apply_value || "").trim()) {
      return NextResponse.json(
        { error: "Enter an email, phone number, or URL for external applications" },
        { status: 400 }
      )
    }

    const jobPayload = {
      school_id:                schoolId,
      title:                    body.title,
      subject:                  body.subject,
      teaching_levels:          body.teaching_levels,
      employment_type:          body.employment_type,
      positions:                parseInt(body.positions) || 1,
      salary_min:               salaryMin,
      salary_max:               salaryMax,
      accommodation_offered:    body.accommodation_offered ?? false,
      accommodation_type:       body.accommodation_offered ? (body.accommodation_type || null) : null,
      benefits:                 body.benefits ?? [],
      is_private:               false,
      is_featured:              body.is_featured ?? false,
      external_apply_enabled:   body.external_apply_enabled ?? false,
      external_apply_value:     body.external_apply_enabled ? String(body.external_apply_value || "").trim() : null,
      quiz_enabled:             body.quiz_enabled ?? false,
      quiz_subjects:            body.quiz_enabled ? (body.quiz_subject_levels || []).map((sl: { subject: string }) => sl.subject) : [],
      quiz_difficulty:          body.quiz_enabled ? (body.quiz_subject_levels?.[0]?.level || null) : null,
      quiz_subject_levels:      body.quiz_enabled ? (body.quiz_subject_levels || []) : null,
      quiz_pass_mark:           body.quiz_enabled ? (parseInt(body.quiz_pass_mark) || 70) : null,
      quiz_mode:                body.quiz_enabled ? (body.quiz_mode || "speed") : null,
      quiz_duration:            body.quiz_enabled ? (parseInt(body.quiz_duration) || 20) : null,
      quiz_question_count:      body.quiz_enabled ? (parseInt(body.quiz_question_count) || 20) : null,
      custom_questions:         [],
      description:              body.description,
      required_qualifications:  body.required_qualifications,
      preferred_qualifications: body.preferred_qualifications || null,
      deadline:                 deadline,
      // Admin posting it IS the approval — unlike school-submitted
      // jobs, this never sits in pending_approval.
      status:                   "active",
    }

    const { data: newJob, error: insertError } = await adminDb
      .from("jobs")
      .insert(jobPayload)
      .select("id, title")
      .single()

    if (insertError) {
      console.error("Admin job insert error:", insertError)
      return NextResponse.json({ error: "Something went wrong posting this job. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true, job: newJob })
  } catch (err) {
    console.error("POST admin school job error:", err)
    return NextResponse.json({ error: "Something went wrong posting this job. Please try again." }, { status: 500 })
  }
}
