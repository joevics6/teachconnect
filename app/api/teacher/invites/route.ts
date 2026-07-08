import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get teacher profile
    const { data: teacherRows } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const teacher = (teacherRows ?? [])[0] ?? null
    if (!teacher) return NextResponse.json({ invites: [], total: 0 })

    const { data: invites, error } = await supabase
      .from("school_invites")
      .select(`
        id, status, created_at,
        jobs ( id, title, subject, deadline ),
        school_profiles!school_id ( id, school_name, logo_url, state )
      `)
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const shaped = (invites ?? []).map((inv) => {
      const job    = (Array.isArray(inv.jobs)            ? inv.jobs[0]            : inv.jobs)            as { id: string; title: string; subject: string; deadline: string } | null
      const school = (Array.isArray(inv.school_profiles) ? inv.school_profiles[0] : inv.school_profiles) as { id: string; school_name: string; logo_url: string | null; state: string } | null
      return {
        id:          inv.id,
        status:      inv.status,
        created_at:  inv.created_at,
        job_id:      job?.id,
        job_title:   job?.title,
        job_subject: job?.subject,
        deadline:    job?.deadline,
        school_id:   school?.id,
        school_name: school?.school_name,
        school_logo: school?.logo_url,
        school_state: school?.state,
      }
    })

    const pending = shaped.filter((i) => i.status === "pending").length

    return NextResponse.json({ invites: shaped, total: shaped.length, pending })
  } catch (err) {
    console.error("GET teacher invites error:", err)
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 })
  }
}

// PATCH — accept or decline an invite
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { invite_id, status } = await request.json()
    if (!invite_id || !["accepted", "declined"].includes(status)) {
      return NextResponse.json({ error: "invite_id and valid status required" }, { status: 400 })
    }

    const { data: teacherRows } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const teacher = (teacherRows ?? [])[0] ?? null
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })

    const { error } = await supabase
      .from("school_invites")
      .update({ status })
      .eq("id", invite_id)
      .eq("teacher_id", teacher.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("PATCH teacher invite error:", err)
    return NextResponse.json({ error: "Failed to update invite" }, { status: 500 })
  }
}
