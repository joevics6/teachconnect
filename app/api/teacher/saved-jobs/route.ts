// ============================================================
// app/api/teacher/saved-jobs/route.ts
// GET  — fetch saved jobs
// POST — save a job
// DELETE — unsave a job
// ============================================================

// Create at: app/api/teacher/saved-jobs/route.ts

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: teacher } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { data: saved, error } = await supabase
      .from("saved_jobs")
      .select(`
        id,
        created_at,
        jobs (
          id, title, subject, teaching_levels, employment_type,
          salary_min, salary_max, accommodation_offered,
          quiz_enabled, deadline,
          school_profiles (
            school_name, logo_url, state
          )
        )
      `)
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Check which saved jobs teacher has already applied to
    const jobIds = (saved || []).map((s) => ((Array.isArray(s.jobs) ? s.jobs[0] : s.jobs) as unknown as { id: string })?.id)
    const { data: appliedJobs } = await supabase
      .from("applications")
      .select("job_id")
      .eq("teacher_id", teacher.id)
      .in("job_id", jobIds)

    const appliedSet = new Set((appliedJobs || []).map((a) => a.job_id))

    const formatted = (saved || []).map((s) => {
      const job = (Array.isArray(s.jobs) ? s.jobs[0] : s.jobs) as unknown as {
        id: string
        title: string
        subject: string
        teaching_levels: string[]
        employment_type: string
        salary_min: number
        salary_max: number
        accommodation_offered: boolean
        quiz_enabled: boolean
        deadline: string
        school_profiles: { school_name: string; logo_url: string | null; state: string }
      }
      return {
        id: s.id,
        job_id: job.id,
        title: job.title,
        school_name: job.school_profiles?.school_name,
        school_logo_url: job.school_profiles?.logo_url,
        school_state: job.school_profiles?.state,
        subject: job.subject,
        teaching_levels: job.teaching_levels,
        employment_type: job.employment_type,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        accommodation_offered: job.accommodation_offered,
        quiz_enabled: job.quiz_enabled,
        deadline: job.deadline,
        saved_at: s.created_at,
        has_applied: appliedSet.has(job.id),
      }
    })

    return NextResponse.json({ saved_jobs: formatted })
  } catch (err) {
    console.error("GET saved jobs error:", err)
    return NextResponse.json({ error: "Failed to fetch saved jobs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { job_id } = await request.json()
    const { data: teacher } = await supabase
      .from("teacher_profiles").select("id").eq("user_id", user.id).single()

    if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { data, error } = await supabase
      .from("saved_jobs")
      .insert({ teacher_id: teacher.id, job_id })
      .select().single()

    if (error) throw error
    return NextResponse.json({ saved: data })
  } catch (err) {
    console.error("POST save job error:", err)
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { job_id } = await request.json()
    const { data: teacher } = await supabase
      .from("teacher_profiles").select("id").eq("user_id", user.id).single()

    if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("teacher_id", teacher.id)
      .eq("job_id", job_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE saved job error:", err)
    return NextResponse.json({ error: "Failed to unsave job" }, { status: 500 })
  }
}