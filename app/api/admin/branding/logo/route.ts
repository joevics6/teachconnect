// ============================================================
// app/api/admin/branding/logo/route.ts
// POST — upload/replace the site logo at site-assets/logo.png
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const adminDb = createAdminClient()

    const formData = await request.formData()
    const file = formData.get("logo") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const ALLOWED = ["image/png", "image/svg+xml", "image/webp", "image/jpeg"]
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Only PNG, SVG, WEBP, or JPEG are supported" }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 2MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Fixed filename (site-assets/logo.png) — new uploads overwrite the
    // old one, so nothing else in the app needs to change to pick it up.
    const { error: uploadError } = await adminDb.storage
      .from("site-assets")
      .upload("logo.png", buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error("Logo upload error:", uploadError)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const { data: urlData } = adminDb.storage.from("site-assets").getPublicUrl("logo.png")

    return NextResponse.json({ logo_url: `${urlData.publicUrl}?v=${Date.now()}` })
  } catch (err) {
    console.error("POST logo upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
