import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()

    // ── Extract fields ──────────────────────────────────────────
    const school_name       = (formData.get("school_name")       as string || "").trim()
    const school_type       = (formData.get("school_type")       as string || "").trim()
    const school_levels     = JSON.parse((formData.get("school_levels") as string) || "[]")
    const state             = (formData.get("state")             as string || "").trim()
    const lga               = (formData.get("lga")               as string || "").trim()
    const address           = (formData.get("address")           as string || "").trim()
    const website           = (formData.get("website")           as string || "").trim() || null
    const cac_number        = (formData.get("cac_number")        as string || "").trim()
    const contact_name      = (formData.get("contact_name")      as string || "").trim()
    const contact_role      = (formData.get("contact_role")      as string || "").trim()
    const contact_email     = (formData.get("contact_email")     as string || "").trim()
    const password          = formData.get("password")           as string || ""
    const contact_phone     = (formData.get("contact_phone")     as string || "").trim()
    const contact_phone_alt = (formData.get("contact_phone_alt") as string || "").trim() || null

    // logo_file may be a File object or the string "null" / "" if not provided
    const logoRaw  = formData.get("logo_file")
    const logo_file = (logoRaw instanceof File && logoRaw.size > 0) ? logoRaw : null

    // ── Validation ──────────────────────────────────────────────
    if (!school_name || !contact_email || !password || !contact_phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // ── Create auth user ────────────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: contact_email,
      password,
      options: { data: { role: "school", full_name: contact_name, school_name } },
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("unique")) {
        return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }

    const userId = authData.user.id

    // ── Upload logo (non-fatal) ─────────────────────────────────
    let logo_url: string | null = null
    if (logo_file) {
      try {
        const ext      = logo_file.name.split(".").pop() || "jpg"
        const logoPath = `${userId}/logo.${ext}`
        const buffer   = await logo_file.arrayBuffer()

        const { error: uploadErr } = await supabase.storage
          .from("logos")
          .upload(logoPath, buffer, { contentType: logo_file.type, upsert: true })

        if (!uploadErr) {
          const { data: pub } = supabase.storage.from("logos").getPublicUrl(logoPath)
          logo_url = `${pub.publicUrl}?t=${Date.now()}`
        }
      } catch (logoErr) {
        console.error("Logo upload failed (non-fatal):", logoErr)
      }
    }

    // ── Insert school profile ───────────────────────────────────
    const { error: profileError } = await supabase
      .from("school_profiles")
      .insert({
        user_id:           userId,
        school_name,
        school_type:       school_type || "private",
        school_levels:     school_levels || [],
        state,
        lga,
        address,
        website,
        contact_name,
        contact_role,
        contact_email,
        contact_phone,
        contact_phone_alt,
        cac_number,
        logo_url,
        is_verified:       false,
      })

    if (profileError) {
      console.error("school_profiles insert error:", profileError)
      // Don't delete the auth user — they can still log in and auto-create will fix the profile
      return NextResponse.json(
        { error: `Account created but profile setup failed: ${profileError.message}. Please log in and complete your profile.` },
        { status: 207 }
      )
    }

    // ── Create free subscription (non-fatal) ────────────────────
    try {
      const { data: schoolRows } = await supabase
        .from("school_profiles")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (schoolRows?.[0]?.id) {
        await supabase.from("subscriptions").insert({
          school_id:   schoolRows[0].id,
          plan_type:   "free",
          amount_paid: 0,
          is_active:   true,
        })
      }
    } catch (subErr) {
      console.error("Subscription insert failed (non-fatal):", subErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("School register error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed. Please try again." },
      { status: 500 }
    )
  }
}
