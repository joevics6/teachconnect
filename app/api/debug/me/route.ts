// TEMPORARY DEBUG ROUTE
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const role = user.user_metadata?.role || "unknown"

  const [{ data: teacherProfiles }, { data: schoolProfiles }] = await Promise.all([
    supabase.from("teacher_profiles").select("id, user_id, full_name, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("school_profiles").select("id, user_id, school_name, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ])

  return NextResponse.json({
    auth_user_id:    user.id,
    auth_email:      user.email,
    role,
    user_metadata:   user.user_metadata,
    teacher_profiles_count: teacherProfiles?.length ?? 0,
    teacher_profiles: teacherProfiles ?? [],
    school_profiles_count: schoolProfiles?.length ?? 0,
    school_profiles: schoolProfiles ?? [],
  })
}
