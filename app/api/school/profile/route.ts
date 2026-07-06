import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let { data: schoolRows } = await supabase
      .from("school_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    let school = (schoolRows ?? [])[0] ?? null

    // Auto-create if missing
    if (!school) {
      const meta = user.user_metadata || {}
      const { data: created } = await supabase
        .from("school_profiles")
        .insert({
          user_id: user.id,
          school_name: (meta.school_name as string) || (meta.full_name as string) || "My School",
          school_type: "private", school_levels: [], state: "", lga: "",
          address: "", website: null, contact_name: (meta.full_name as string) || "",
          contact_role: "", contact_email: user.email || "", contact_phone: "",
          contact_phone_alt: null, cac_number: "", logo_url: null, is_verified: false,
          about: null, curriculum: [], student_population: null,
          salary_range_min: null, salary_range_max: null, benefits: [],
          school_category: null, verification_status: "unverified",
        })
        .select("*")
      school = created?.[0] ?? null
      if (!school) return NextResponse.json({ error: "Could not create profile" }, { status: 500 })
      try {
        await supabase.from("subscriptions").insert({ school_id: school.id, plan_type: "free", amount_paid: 0, is_active: true })
      } catch { /* non-fatal */ }
    }

    const [{ count: totalJobs }, { count: activeJobCount }] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("school_id", school.id),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("status", "active"),
    ])

    return NextResponse.json({ school, stats: { total_jobs: totalJobs || 0, active_jobs: activeJobCount || 0 } })
  } catch (err) {
    console.error("GET school profile error:", err)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const allowedFields = [
      "school_name", "school_type", "school_levels", "state", "lga", "address", "website",
      "contact_name", "contact_role", "contact_email", "contact_phone", "contact_phone_alt",
      "logo_url", "cac_number",
      // New fields
      "about", "curriculum", "student_population",
      "salary_range_min", "salary_range_max", "benefits",
      "school_category",
    ]
    const updates: Record<string, unknown> = {}
    allowedFields.forEach((f) => { if (body[f] !== undefined) updates[f] = body[f] })

    // When cac_number is added, move to pending
    if (updates.cac_number && String(updates.cac_number).trim()) {
      updates.verification_status = "pending"
    }

    const { data, error } = await supabase
      .from("school_profiles").update(updates).eq("user_id", user.id).select()
    if (error) throw error
    return NextResponse.json({ school: (data ?? [])[0] ?? null })
  } catch (err) {
    console.error("PATCH school profile error:", err)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
