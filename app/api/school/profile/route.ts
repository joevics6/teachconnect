import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let { data: schoolRows, error } = await supabase
      .from("school_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    let school = (schoolRows ?? [])[0] ?? null

    // ── Auto-create profile if missing ──────────────────────────────────────
    // This happens when registration created the auth user but the DB insert
    // failed. Use metadata to seed the profile so the dashboard isn't broken.
    if (!school) {
      const meta = user.user_metadata || {}
      const seed = {
        user_id:           user.id,
        school_name:       (meta.school_name as string) || (meta.full_name as string) || "My School",
        school_type:       (meta.school_type as string) || "private",
        school_levels:     [],
        state:             (meta.state as string) || "",
        lga:               (meta.lga as string) || "",
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
      }

      const { data: created, error: createError } = await supabase
        .from("school_profiles")
        .insert(seed)
        .select()

      if (!createError && created?.[0]) {
        school = created[0]
        // Also create free subscription
        try {
          await supabase.from("subscriptions").insert({
            school_id:   school.id,
            plan_type:   "free",
            amount_paid: 0,
            is_active:   true,
          })
        } catch { /* non-fatal */ }
      } else {
        console.error("Auto-create school profile failed:", createError)
        return NextResponse.json({ error: "School profile not found" }, { status: 404 })
      }
    }

    // Active jobs count
    const [{ count: totalJobs }, { count: activeJobCount }] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact" }).eq("school_id", school.id),
      supabase.from("jobs").select("id", { count: "exact" }).eq("school_id", school.id).eq("status", "active"),
    ])

    return NextResponse.json({
      school,
      stats: {
        total_jobs:  totalJobs  || 0,
        active_jobs: activeJobCount || 0,
        total_hired: 0,
      },
      viewer_role: "school",
    })
  } catch (err) {
    console.error("GET school profile error:", err)
    return NextResponse.json({ error: "Failed to fetch school profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const allowedFields = [
      "school_name", "school_type", "school_levels",
      "state", "lga", "address", "website",
      "contact_name", "contact_role", "contact_email",
      "contact_phone", "contact_phone_alt",
      "cac_number", "logo_url",
    ]

    const updates: Record<string, unknown> = {}
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) updates[field] = body[field]
    })

    // Upsert — works whether or not the row exists
    const { data, error } = await supabase
      .from("school_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()

    if (error) throw error

    return NextResponse.json({ school: (data ?? [])[0] ?? null })
  } catch (err) {
    console.error("PATCH school profile error:", err)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
