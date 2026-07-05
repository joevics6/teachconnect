import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: schoolProfiles, error: spErr } = await supabase
    .from("school_profiles")
    .select("*")
    .eq("user_id", user.id)

  // Try to auto-create if missing
  let autoCreated = null
  let autoCreateError = null
  if (!schoolProfiles?.length) {
    const meta = user.user_metadata || {}
    const { data: created, error: cErr } = await supabase
      .from("school_profiles")
      .insert({
        user_id:       user.id,
        school_name:   (meta.school_name as string) || (meta.full_name as string) || "My School",
        school_type:   "private",
        state:         "",
        lga:           "",
        contact_name:  (meta.full_name as string) || "",
        contact_email: user.email || "",
        contact_phone: (meta.phone as string) || "",
        is_verified:   false,
      })
      .select("*")
    autoCreated = created
    autoCreateError = cErr?.message || null
  }

  return NextResponse.json({
    user_id:             user.id,
    email:               user.email,
    role:                user.user_metadata?.role,
    school_profiles:     schoolProfiles ?? [],
    school_profiles_err: spErr?.message ?? null,
    auto_create_attempt: !schoolProfiles?.length,
    auto_created:        autoCreated,
    auto_create_error:   autoCreateError,
  })
}
