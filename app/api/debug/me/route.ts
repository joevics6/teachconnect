// TEMPORARY DEBUG ROUTE — delete after fixing
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const [{ data: profile, error: pErr }, { data: onboarding, error: oErr }] = await Promise.all([
    supabase.from("teacher_profiles").select("id, user_id, full_name, state, profile_completion").eq("user_id", user.id).single(),
    supabase.from("onboarding_data").select("user_id, cv_name, cv_skills").eq("user_id", user.id).single(),
  ])

  return NextResponse.json({
    auth_user_id: user.id,
    auth_email: user.email,
    teacher_profile: profile ?? null,
    teacher_profile_error: pErr?.message ?? null,
    onboarding: onboarding ?? null,
    onboarding_error: oErr?.message ?? null,
  })
}
