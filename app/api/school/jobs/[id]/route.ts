// ============================================================
// app/api/school/jobs/[id]/route.ts
// GET — fetch one of the logged-in school's own jobs, full detail,
// for the edit page.
// PATCH — update job status (close, reopen) or edit its content.
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkJobPostingLimit } from "@/lib/job-limits"
import { getActivePlanType, isPremiumPlan, hasExternalApplyAccess } from "@/lib/school-plan"
import { revalidateTag } from "next/cache"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: schoolRows } = await supabase
      .from("school_profiles").select("id").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const school = (schoolRows ?? [])[0] ?? null
    if (!school) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .eq("school_id", school.id)
      .single()

    if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    return NextResponse.json({ job })
  } catch (err) {
    console.error("GET school job error:", err)
    return NextResponse.json({ error: "Failed to load job" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: schoolRows } = await supabase
      .from("school_profiles").select("id").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const school = (schoolRows ?? [])[0] ?? null
    if (!school) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const allowed = [
      "status", "title", "subject", "teaching_levels", "description", "deadline",
      "employment_type", "positions", "salary_min", "salary_max",
      "accommodation_offered", "accommodation_type", "benefits",
      "required_qualifications", "preferred_qualifications",
      "is_featured", "is_private",
      "external_apply_enabled", "external_apply_value",
      "quiz_enabled", "quiz_pass_mark", "quiz_mode", "quiz_duration", "quiz_question_count"]
    const updates: Record<string, unknown> = {}
    allowed.forEach((f) => { if (body[f] !== undefined) updates[f] = body[f] })

    // quiz_subjects/quiz_difficulty are derived from quiz_subject_levels,
    // same as job creation (api/school/jobs POST) — never trust a raw
    // pass-through value for these, they need to stay in sync with
    // whatever level/subject pairs were actually picked.
    if (body.quiz_subject_levels !== undefined || body.quiz_enabled !== undefined) {
      const quizEnabled = body.quiz_enabled ?? false
      const subjectLevels = body.quiz_subject_levels || []
      updates.quiz_subjects = quizEnabled ? subjectLevels.map((sl: { subject: string }) => sl.subject) : []
      updates.quiz_difficulty = quizEnabled ? (subjectLevels[0]?.level || null) : null
      updates.quiz_subject_levels = quizEnabled ? subjectLevels : null
    }

    // Same premium gate as job creation — otherwise a Free-plan school
    // could create a plain job then PATCH it into private/featured after
    // the fact, bypassing the check entirely.
    if (updates.is_private === true || updates.is_featured === true) {
      const planType = await getActivePlanType(supabase, school.id)
      if (!isPremiumPlan(planType)) {
        if (updates.is_private === true) {
          return NextResponse.json(
            { error: "Private postings require a paid plan (Single Post, Monthly, or Term).", upgrade_required: true },
            { status: 402 }
          )
        }
        return NextResponse.json(
          { error: "Featured listings aren't available on the Free plan yet.", upgrade_required: true },
          { status: 402 }
        )
      }
    }

    if (updates.external_apply_enabled === true) {
      const planType = await getActivePlanType(supabase, school.id)
      if (!hasExternalApplyAccess(planType)) {
        return NextResponse.json(
          { error: "External Application requires a Monthly or Term plan.", upgrade_required: true },
          { status: 402 }
        )
      }
    }

    // If this update would turn a non-active job (e.g. a duplicated draft,
    // or reopening a closed one) into active, it needs to pass the same
    // plan-limit check as creating a brand new job — otherwise duplicate +
    // activate would bypass the paywall. It also now goes to
    // 'pending_approval' rather than straight to 'active' — every job
    // needs admin review before going live, and a school directly PATCHing
    // status:"active" here shouldn't be able to skip that (see
    // app/api/school/jobs/route.ts for the same rule on brand-new jobs).
    if (updates.status === "active") {
      const { data: existing } = await supabase
        .from("jobs")
        .select("status")
        .eq("id", id)
        .eq("school_id", school.id)
        .single()

      if (existing && existing.status !== "active") {
        const limitCheck = await checkJobPostingLimit(supabase, school.id)
        if (!limitCheck.allowed) {
          return NextResponse.json({ error: limitCheck.error, upgrade_required: true }, { status: 402 })
        }
        updates.status = "pending_approval"
      }
    }

    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("school_id", school.id)
      .select()
      .single()

    if (error) throw error

    // Every field in `allowed` above can change what's shown on the
    // public job search, job detail page, or the school's public
    // profile — burst both caches rather than waiting on their TTL.
    // (Status changes, e.g. closing a job, also affect the school's
    // active-job count, hence "schools" too.)
    revalidateTag("jobs", "max")
    if (updates.status !== undefined) revalidateTag("schools", "max")

    return NextResponse.json({ job: data })
  } catch (err) {
    console.error("PATCH job error:", err)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}
