import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()

    // ── Extract fields ──────────────────────────────────────────
    const school_name       = formData.get("school_name")       as string
    const school_type       = formData.get("school_type")       as string
    const school_levels     = JSON.parse((formData.get("school_levels") as string) || "[]")
    const state             = formData.get("state")             as string
    const lga               = formData.get("lga")               as string
    const address           = formData.get("address")           as string
    const website           = formData.get("website")           as string || null
    const is_registered     = formData.get("is_registered")     as string || "no"
    const cac_number        = formData.get("cac_number")        as string || null
    const contact_name      = formData.get("contact_name")      as string
    const contact_role      = formData.get("contact_role")      as string || null
    const contact_email     = formData.get("contact_email")     as string
    const password          = formData.get("password")          as string
    const contact_phone     = formData.get("contact_phone")     as string
    const contact_phone_alt = formData.get("contact_phone_alt") as string || null
    const logo_file         = formData.get("logo_file")         as File | null

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
      options: { data: { role: "school", full_name: contact_name } },
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }
      throw authError
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }

    const userId = authData.user.id

    // ── Upload logo ─────────────────────────────────────────────
    let logo_url: string | null = null
    if (logo_file && logo_file.size > 0) {
      try {
        const ext      = logo_file.name.split(".").pop() || "jpg"
        const logoPath = `${userId}/logo.${ext}`
        const buffer   = await logo_file.arrayBuffer()

        // Try "avatars" bucket first (confirmed to exist), fall back to "logos"
        let bucket = "avatars"
        const { error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(logoPath, buffer, { contentType: logo_file.type, upsert: true })

        if (uploadErr) {
          // Try logos bucket
          bucket = "logos"
          const { error: uploadErr2 } = await supabase.storage
            .from(bucket)
            .upload(logoPath, buffer, { contentType: logo_file.type, upsert: true })
          if (uploadErr2) throw uploadErr2
        }

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(logoPath)
        logo_url = `${pub.publicUrl}?t=${Date.now()}`
      } catch (logoErr) {
        // Logo upload failure is non-fatal — log and continue
        console.error("Logo upload failed (non-fatal):", logoErr)
      }
    }

    // ── Insert school profile ───────────────────────────────────
    // Only include columns we know exist; use a safe subset
    const profilePayload: Record<string, unknown> = {
      user_id:      userId,
      school_name,
      school_type,
      state,
      lga,
      address:      address || "",   // NOT NULL — always include
      contact_name,
      contact_email,
      contact_phone,
      is_verified:  false,
    }
    // Optional fields — add only if non-empty to avoid column-not-found errors
    if (school_levels?.length)  profilePayload.school_levels    = school_levels
    if (website)                profilePayload.website           = website
    if (contact_role)           profilePayload.contact_role      = contact_role
    if (contact_phone_alt)      profilePayload.contact_phone_alt = contact_phone_alt
    if (cac_number)             profilePayload.cac_number        = cac_number
    if (logo_url)               profilePayload.logo_url          = logo_url
    if (is_registered)          profilePayload.is_registered     = is_registered === "yes"

    const { error: profileError } = await supabase
      .from("school_profiles")
      .insert(profilePayload)

    if (profileError) {
      console.error("school_profiles insert error:", profileError)
      // Try a minimal insert as fallback (only guaranteed columns)
      const { error: minimalError } = await supabase
        .from("school_profiles")
        .insert({
          user_id:      userId,
          school_name,
          school_type,
          state,
          lga,
          address:      address || "",
          contact_name,
          contact_email,
          contact_phone,
          is_verified:  false,
        })
      if (minimalError) {
        // Clean up the auth user since profile creation failed
        try { await supabase.auth.admin.deleteUser(userId) } catch { /* best effort */ }
        throw minimalError
      }
    }

    // ── Create free subscription ────────────────────────────────
    try {
      const { data: schoolRow } = await supabase
        .from("school_profiles")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (schoolRow?.[0]?.id) {
        await supabase.from("subscriptions").insert({
          school_id:  schoolRow[0].id,
          plan_type:  "free",
          amount_paid: 0,
          is_active:  true,
        })
      }
    } catch (subErr) {
      // Subscription creation is non-fatal
      console.error("Subscription insert failed (non-fatal):", subErr)
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, email: contact_email, role: "school" },
    })
  } catch (err) {
    console.error("School register error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed. Please try again." },
      { status: 500 }
    )
  }
}
