// TEMPORARY DEBUG ROUTE
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  // Check both getSession and getUser
  const { data: { session } } = await supabase.auth.getSession()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      session_exists: !!session,
      user: null,
      message: "No authenticated user found server-side"
    })
  }

  const { data: profiles } = await supabase
    .from("teacher_profiles")
    .select("id, user_id, full_name, state, created_at")
    .eq("user_id", user.id)

  const { data: onboardings } = await supabase
    .from("onboarding_data")
    .select("id, user_id, cv_name, created_at")
    .eq("user_id", user.id)

  return NextResponse.json({
    authenticated: true,
    auth_user_id: user.id,
    auth_email: user.email,
    user_metadata: user.user_metadata,
    session_exists: !!session,
    teacher_profiles_count: profiles?.length ?? 0,
    teacher_profiles: profiles ?? [],
    onboarding_count: onboardings?.length ?? 0,
    onboarding: onboardings ?? [],
  })
}
