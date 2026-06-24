// ============================================================
// app/api/school/jobs/[id]/route.ts
// PATCH — update job status (close, reopen)
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
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

    const body = await request.json()
    const allowed = ["status", "title", "description", "deadline",
      "salary_min", "salary_max", "is_featured", "is_private"]
    const updates: Record<string, unknown> = {}
    allowed.forEach((f) => { if (body[f] !== undefined) updates[f] = body[f] })

    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("school_id", school.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ job: data })
  } catch (err) {
    console.error("PATCH job error:", err)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}
