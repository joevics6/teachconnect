// app/api/school/profile/logo/route.ts
// POST — upload or replace school logo (image, max 5MB)

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get("logo") as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Logo must be an image file" }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Logo must be under 5MB" }, { status: 400 })
    }

    // Verify user owns a school profile
    const { data: school } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

    const ext = file.name.split(".").pop() || "jpg"
    const logoPath = `${user.id}/logo.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(logoPath, buffer, { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from("logos")
      .getPublicUrl(logoPath)

    // Cache-bust
    const logo_url = `${publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from("school_profiles")
      .update({ logo_url })
      .eq("user_id", user.id)

    if (updateError) throw updateError

    return NextResponse.json({ logo_url })
  } catch (err) {
    console.error("Logo upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
