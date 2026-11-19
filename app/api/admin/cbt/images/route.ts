// ============================================================
// app/api/admin/cbt/images/route.ts
// POST multipart/form-data { file } — upload ONE small question image
// (diagram, graph, table screenshot) to the public 'cbt-images' bucket and
// return its public URL. The admin page then saves that URL on the question.
// The browser shrinks screenshots first; this only enforces the hard limit.
// ============================================================

import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

export const CBT_IMAGE_MAX_BYTES = 200 * 1024
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose an image" }, { status: 400 })
    const ext = EXT[file.type]
    if (!ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 400 })
    if (file.size > CBT_IMAGE_MAX_BYTES) {
      return NextResponse.json({ error: `Image is ${Math.round(file.size / 1024)} KB. Keep it under 200 KB (crop tighter).` }, { status: 413 })
    }

    const db = createAdminClient()
    const path = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${ext}`
    const { error } = await db.storage.from("cbt-images").upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    })
    if (error) throw error
    const { data } = db.storage.from("cbt-images").getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error("POST admin cbt image error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
