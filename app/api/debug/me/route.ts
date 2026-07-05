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

  let autoCreated = null
  let autoCreateError = null

  if (!schoolProfiles?.length) {
    const meta = user.user_metadata || {}
    const { data: created, error: cErr } = await supabase
      .from("school_profiles")
      .insert({
        user_id:           user.id,
        school_name:       (meta.full_name as string) || "My School",
        school_type:       "private",
        school_levels:     [],
        state:             "",
        lga:               "",
        address:           "",
        website:           null,
        contact_name:      (meta.full_name as string) || "",
        contact_role:      "",
        contact_email:     user.email || "",
        contact_phone:     "",
        contact_phone_alt: null,
        cac_number:        "",
        logo_url:          null,
        is_verified:       false,
      })
      .select("*")
    autoCreated = created
    autoCreateError = cErr?.message ?? null
  }

  return NextResponse.json({
    user_id:           user.id,
    email:             user.email,
    role:              user.user_metadata?.role,
    school_profiles:   schoolProfiles ?? [],
    auto_created:      autoCreated,
    auto_create_error: autoCreateError,
  })
}
