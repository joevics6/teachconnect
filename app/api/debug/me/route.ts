// TEMPORARY DEBUG ROUTE — delete after fixing
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const [{ data: profiles, error: pErr }, { data: onboardings, error: oErr }] = await Promise.all([
    supabase.from("teacher_profiles").select("id, user_id, full_name, state, profile_completion, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("onboarding_data").select("user_id, cv_name, cv_skills, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ])

  return NextResponse.json({
    auth_user_id: user.id,
    auth_email: user.email,
    teacher_profiles_count: profiles?.length ?? 0,
    teacher_profiles: profiles ?? [],
    teacher_profile_error: pErr?.message ?? null,
    onboarding_count: onboardings?.length ?? 0,
    onboarding: onboardings ?? [],
    onboarding_error: oErr?.message ?? null,
  })
}
