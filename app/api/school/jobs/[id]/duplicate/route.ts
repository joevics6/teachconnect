// ============================================================
// app/api/school/jobs/[id]/duplicate/route.ts
// POST — duplicate a job as draft
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: school } = await supabase
      .from("school_profiles").select("id").eq("user_id", user.id).single()
    if (!school) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: original, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .eq("school_id", school.id)
      .single()

    if (fetchError || !original) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const newDeadline = new Date()
    newDeadline.setDate(newDeadline.getDate() + 30)

    const { id: _id, created_at, updated_at, views, ...jobData } = original

    const { data: duplicate, error } = await supabase
      .from("jobs")
      .insert({
        ...jobData,
        title: `${original.title} (Copy)`,
        status: "draft",
        deadline: newDeadline.toISOString().split("T")[0],
        views: 0,
        is_featured: false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ job: { ...duplicate, applicants_count: 0, passed_quiz_count: 0 } })
  } catch (err) {
    console.error("POST duplicate job error:", err)
    return NextResponse.json({ error: "Failed to duplicate job" }, { status: 500 })
  }
}
