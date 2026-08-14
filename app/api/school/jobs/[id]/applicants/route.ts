// ============================================================
// app/api/school/jobs/[id]/applicants/route.ts
// GET /api/school/jobs/[id]/applicants
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Query the base tables directly (teacher_id -> teacher_profiles.id and
    // quiz_attempt_id -> quiz_attempts.id are both real foreign keys, so
    // PostgREST can embed them) rather than the applications_with_details
    // view — the view was silently returning zero rows for jobs that do
    // have real applications, and its definition isn't tracked anywhere in
    // this repo so there was no way to diagnose it further. Building the
    // response directly from applications keeps this route self-contained
    // and debuggable.
    const { data: rawApplications, error } = await supabase
      .from("applications")
      .select(`
        id, teacher_id, pipeline_stage, school_notes, created_at,
        teacher_profiles (
          id, full_name, photo_url, state, subjects, teaching_levels,
          years_experience, trcn_status, trcn_number, cv_url,
          willing_to_relocate, accommodation_needed, salary_min, salary_max
        ),
        quiz_attempts (
          score, passed, time_taken_seconds
        )
      `)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })

    if (error) throw error

    const applicants = (rawApplications || []).map((a) => {
      const teacher = (Array.isArray(a.teacher_profiles) ? a.teacher_profiles[0] : a.teacher_profiles) as unknown as {
        id: string; full_name: string; photo_url: string | null; state: string
        subjects: string[]; teaching_levels: string[]; years_experience: number
        trcn_status: string; trcn_number: string | null; cv_url: string | null
        willing_to_relocate: boolean; accommodation_needed: boolean
        salary_min: number; salary_max: number
      } | null
      const attempt = (Array.isArray(a.quiz_attempts) ? a.quiz_attempts[0] : a.quiz_attempts) as unknown as {
        score: number | null; passed: boolean | null; time_taken_seconds: number | null
      } | null

      return {
        id: a.id,
        teacher_id: a.teacher_id,
        teacher_name: teacher?.full_name || "Unknown",
        teacher_photo_url: teacher?.photo_url ?? null,
        teacher_state: teacher?.state || "",
        teacher_subjects: teacher?.subjects || [],
        teacher_levels: teacher?.teaching_levels || [],
        years_experience: teacher?.years_experience ?? 0,
        trcn_status: teacher?.trcn_status || "unregistered",
        trcn_number: teacher?.trcn_number ?? null,
        cv_url: teacher?.cv_url ?? null,
        willing_to_relocate: teacher?.willing_to_relocate ?? false,
        accommodation_needed: teacher?.accommodation_needed ?? false,
        teacher_salary_min: teacher?.salary_min ?? 0,
        teacher_salary_max: teacher?.salary_max ?? 0,
        quiz_score: attempt?.score ?? null,
        quiz_passed: attempt?.passed ?? null,
        quiz_time_taken: attempt?.time_taken_seconds ?? null,
        pipeline_stage: a.pipeline_stage,
        school_notes: a.school_notes,
        created_at: a.created_at,
      }
    })

    // CV downloads for a school's own applicants are free on every plan —
    // someone who applied to your job isn't a "discovery" the way talent
    // search is, so there's no reason to withhold their CV once they've
    // applied. (Talent-page browsing is the paid gate — see
    // lib/school-plan.ts hasTalentAccess.)
    const jobInfo = {
      ...job,
      total_applicants: applicants?.length || 0,
      passed_quiz: applicants?.filter((a) => a.quiz_passed).length || 0,
    }

    return NextResponse.json({
      job: jobInfo,
      applicants: applicants || [],
      cv_downloads_locked: false,
    })
  } catch (err) {
    console.error("GET applicants error:", err)
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 }
    )
  }
}
