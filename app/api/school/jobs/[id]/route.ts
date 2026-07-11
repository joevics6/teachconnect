// ============================================================
// app/api/school/jobs/[id]/route.ts
// PATCH — update job status (close, reopen)
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkJobPostingLimit } from "@/lib/job-limits"

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
    const allowed = ["status", "title", "description", "deadline",
      "salary_min", "salary_max", "is_featured", "is_private"]
    const updates: Record<string, unknown> = {}
    allowed.forEach((f) => { if (body[f] !== undefined) updates[f] = body[f] })

    // If this update would turn a non-active job (e.g. a duplicated draft)
    // into active, it needs to pass the same plan-limit check as creating a
    // brand new job — otherwise duplicate + activate would bypass the paywall.
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
    return NextResponse.json({ job: data })
  } catch (err) {
    console.error("PATCH job error:", err)
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}
