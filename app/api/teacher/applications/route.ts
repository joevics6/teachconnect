// ============================================================
// app/api/teacher/applications/route.ts
// GET /api/teacher/applications
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: teacherRows } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const teacher = (teacherRows ?? [])[0] ?? null

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    const { data: applications, error } = await supabase
      .from("applications")
      .select(`
        id,
        pipeline_stage,
        created_at,
        quiz_attempt_id,
        jobs (
          id,
          title,
          subject,
          employment_type,
          salary_min,
          salary_max,
          deadline,
          teaching_levels,
          school_profiles (
            school_name,
            logo_url,
            state
          )
        ),
        quiz_attempts (
          score,
          passed,
          mode
        )
      `)
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formatted = (applications || []).map((app) => {
      const job = (Array.isArray(app.jobs) ? app.jobs[0] : app.jobs) as unknown as {
        id: string
        title: string
        subject: string
        employment_type: string
        salary_min: number
        salary_max: number
        deadline: string
        teaching_levels: string[]
        school_profiles: {
          school_name: string
          logo_url: string | null
          state: string
        }
      }
      const attempt = (Array.isArray(app.quiz_attempts) ? app.quiz_attempts[0] : app.quiz_attempts) as unknown as {
        score: number
        passed: boolean
        mode: string
      } | null

      return {
        id: app.id,
        job_id: job?.id,
        job_title: job?.title,
        school_name: job?.school_profiles?.school_name,
        school_logo_url: job?.school_profiles?.logo_url,
        school_state: job?.school_profiles?.state,
        subject: job?.subject,
        employment_type: job?.employment_type,
        salary_min: job?.salary_min,
        salary_max: job?.salary_max,
        deadline: job?.deadline,
        quiz_score: attempt?.score ?? null,
        quiz_passed: attempt?.passed ?? null,
        quiz_mode: attempt?.mode ?? null,
        pipeline_stage: app.pipeline_stage,
        applied_at: app.created_at,
      }
    })

    return NextResponse.json({ applications: formatted })
  } catch (err) {
    console.error("GET applications error:", err)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}