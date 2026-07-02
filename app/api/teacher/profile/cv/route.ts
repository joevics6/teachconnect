// app/api/teacher/profile/cv/route.ts
// POST — upload or replace teacher CV (PDF only, max 10MB)

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get("cv") as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "CV must be a PDF file" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "CV must be under 10MB" }, { status: 400 })
    }

    const cvPath = `${user.id}/cv.pdf`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(cvPath, buffer, { contentType: "application/pdf", upsert: true })

    if (uploadError) throw uploadError

    // Signed URL valid for 1 year (CVs are private bucket)
    const { data: signedUrl } = await supabase.storage
      .from("cvs")
      .createSignedUrl(cvPath, 60 * 60 * 24 * 365)

    if (!signedUrl?.signedUrl) throw new Error("Failed to generate signed URL")

    const cv_url = signedUrl.signedUrl

    const { error: updateError } = await supabase
      .from("teacher_profiles")
      .update({ cv_url })
      .eq("user_id", user.id)

    if (updateError) throw updateError

    return NextResponse.json({ cv_url })
  } catch (err) {
    console.error("CV upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
