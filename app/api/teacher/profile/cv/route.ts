// app/api/teacher/profile/cv/route.ts
// POST — upload or replace teacher CV (PDF, DOC/DOCX, JPG, or PNG — max 5MB)

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cvStoragePath } from "@/lib/cv-storage"
import { isAcceptedDocumentType, ACCEPTED_DOCUMENT_LABEL, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/document-extract"

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
    if (!isAcceptedDocumentType(file.type)) {
      return NextResponse.json({ error: `CV must be one of: ${ACCEPTED_DOCUMENT_LABEL}` }, { status: 400 })
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 })
    }

    const cvPath = cvStoragePath(user.id, file.type)
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(cvPath, buffer, { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    // The 'cvs' bucket is private (see supabase/cvs_private_bucket.sql) —
    // this column is now just a "has uploaded a CV" marker + its exact
    // storage path, not a usable link. Actual downloads always go
    // through /api/teacher/cv-signed-url, which generates a fresh
    // short-lived link at the moment it's needed.
    const cv_url = cvPath

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
