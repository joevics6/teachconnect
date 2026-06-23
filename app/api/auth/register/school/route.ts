// ============================================================
// app/api/auth/register/school/route.ts
// POST — register school, create profile, upload logo
// ============================================================
 
// Create at: app/api/auth/register/school/route.ts
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
 
    // ── Extract fields ──────────────────────────────────────
    const school_name = formData.get("school_name") as string
    const school_type = formData.get("school_type") as string
    const school_levels = JSON.parse(formData.get("school_levels") as string || "[]")
    const state = formData.get("state") as string
    const lga = formData.get("lga") as string
    const address = formData.get("address") as string
    const website = formData.get("website") as string || null
    const contact_name = formData.get("contact_name") as string
    const contact_role = formData.get("contact_role") as string
    const contact_email = formData.get("contact_email") as string
    const password = formData.get("password") as string
    const contact_phone = formData.get("contact_phone") as string
    const contact_phone_alt = formData.get("contact_phone_alt") as string || null
    const cac_number = formData.get("cac_number") as string
    const logo_file = formData.get("logo_file") as File | null
 
    // ── Validation ──────────────────────────────────────────
    if (!school_name || !contact_email || !password || !contact_phone || !cac_number) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
 
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }
 
    // ── Create Supabase auth user ───────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: contact_email,
      password,
      options: {
        data: {
          role: "school",
          full_name: contact_name,
        },
      },
    })
 
    if (authError) {
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        )
      }
      throw authError
    }
 
    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }
 
    const userId = authData.user.id
 
    // ── Upload logo ─────────────────────────────────────────
    let logo_url: string | null = null
    if (logo_file && logo_file.size > 0) {
      const ext = logo_file.name.split(".").pop()
      const logoPath = `${userId}/logo.${ext}`
      const logoBuffer = await logo_file.arrayBuffer()
 
      const { error: logoError } = await supabase.storage
        .from("logos")
        .upload(logoPath, logoBuffer, {
          contentType: logo_file.type,
          upsert: true,
        })
 
      if (!logoError) {
        const { data: publicUrl } = supabase.storage
          .from("logos")
          .getPublicUrl(logoPath)
        logo_url = publicUrl.publicUrl
      }
    }
 
    // ── Create school profile ───────────────────────────────
    const { error: profileError } = await supabase
      .from("school_profiles")
      .insert({
        user_id: userId,
        school_name,
        school_type,
        school_levels,
        state,
        lga,
        address,
        website: website || null,
        contact_name,
        contact_role,
        contact_email,
        contact_phone,
        contact_phone_alt: contact_phone_alt || null,
        cac_number,
        logo_url,
        is_verified: false,
      })
 
    if (profileError) {
      await supabase.auth.admin.deleteUser(userId)
      throw profileError
    }
 
    // ── Create free subscription ────────────────────────────
    const { data: schoolProfile } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", userId)
      .single()
 
    if (schoolProfile) {
      await supabase.from("subscriptions").insert({
        school_id: schoolProfile.id,
        plan_type: "free",
        amount_paid: 0,
        is_active: true,
      })
    }
 
    return NextResponse.json({
      success: true,
      user: { id: userId, email: contact_email, role: "school" },
      redirectTo: "/dashboard/school",
    })
  } catch (err) {
    console.error("School register error:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again.",
      },
      { status: 500 }
    )
  }
}