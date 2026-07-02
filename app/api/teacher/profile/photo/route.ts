import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get("photo") as File | null
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate type and size (max 5MB)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "jpg"
    const path = `${user.id}/avatar.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)

    // Bust the CDN cache by appending a timestamp
    const photo_url = `${publicUrl}?t=${Date.now()}`

    // Save to teacher_profiles
    const { error: updateError } = await supabase
      .from("teacher_profiles")
      .update({ photo_url })
      .eq("user_id", user.id)

    if (updateError) throw updateError

    return NextResponse.json({ photo_url })
  } catch (err) {
    console.error("Photo upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
