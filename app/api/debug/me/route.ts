import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: schoolProfiles } = await supabase
    .from("school_profiles")
    .select("*")
    .eq("user_id", user.id)

  return NextResponse.json({
    user_id:        user.id,
    email:          user.email,
    role:           user.user_metadata?.role,
    school_profiles_count: schoolProfiles?.length ?? 0,
    school_profile: (schoolProfiles ?? [])[0] ?? null,
  })
}
