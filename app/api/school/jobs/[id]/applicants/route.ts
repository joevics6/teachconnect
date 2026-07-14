// ============================================================
// app/api/school/jobs/[id]/applicants/route.ts
// GET /api/school/jobs/[id]/applicants
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActivePlanType, isPremiumPlan } from "@/lib/school-plan"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: schoolRows } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const school = (schoolRows ?? [])[0] ?? null

    if (!school) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, subject, quiz_enabled, quiz_mode, quiz_pass_mark, status, deadline")
      .eq("id", jobId)
      .eq("school_id", school.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const { data: applicants, error } = await supabase
      .from("applications_with_details")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // CV downloads are a Standard/Term perk (see pricing page) — strip the
    // link for Free-plan schools rather than relying on the UI to hide it.
    const planType = await getActivePlanType(supabase, school.id)
    const shapedApplicants = isPremiumPlan(planType)
      ? (applicants || [])
      : (applicants || []).map((a) => ({ ...a, cv_url: null }))

    const jobInfo = {
      ...job,
      total_applicants: applicants?.length || 0,
      passed_quiz: applicants?.filter((a) => a.quiz_passed).length || 0,
    }

    return NextResponse.json({
      job: jobInfo,
      applicants: shapedApplicants,
      cv_downloads_locked: !isPremiumPlan(planType),
    })
  } catch (err) {
    console.error("GET applicants error:", err)
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 }
    )
  }
}
