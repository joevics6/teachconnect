import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getSchoolId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("school_profiles").select("id").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1)
  return (data ?? [])[0]?.id ?? null
}

// GET — list saved teachers (optionally by folder)
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const schoolId = await getSchoolId(supabase, user.id)
    if (!schoolId) return NextResponse.json({ error: "School not found" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get("folder")

    let query = supabase
      .from("school_saved_teachers")
      .select(`
        id, folder, notes, created_at,
        teacher_profiles!teacher_id (
          id, full_name, state, subjects, teaching_levels,
          years_experience, trcn_status, photo_url, availability, bio
        )
      `)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })

    if (folder) query = query.eq("folder", folder) as typeof query

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ saved: data ?? [] })
  } catch (err) {
    console.error("GET saved teachers error:", err)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

// POST — save a teacher
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const schoolId = await getSchoolId(supabase, user.id)
    if (!schoolId) return NextResponse.json({ error: "School not found" }, { status: 404 })

    const { teacher_id, folder = "excellent", notes } = await request.json()
    if (!teacher_id) return NextResponse.json({ error: "teacher_id required" }, { status: 400 })

    const { data, error } = await supabase
      .from("school_saved_teachers")
      .upsert({ school_id: schoolId, teacher_id, folder, notes: notes ?? null },
               { onConflict: "school_id,teacher_id" })
      .select()

    if (error) throw error
    return NextResponse.json({ saved: (data ?? [])[0] })
  } catch (err) {
    console.error("POST save teacher error:", err)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}

// DELETE — unsave a teacher
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const schoolId = await getSchoolId(supabase, user.id)
    if (!schoolId) return NextResponse.json({ error: "School not found" }, { status: 404 })

    const { teacher_id } = await request.json()
    const { error } = await supabase
      .from("school_saved_teachers")
      .delete()
      .eq("school_id", schoolId)
      .eq("teacher_id", teacher_id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE saved teacher error:", err)
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 })
  }
}
