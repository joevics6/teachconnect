// ============================================================
// app/api/admin/jobs/[id]/social/route.ts
// POST — (re)generate the social post for a job on demand. Used by
// the "Generate"/"Regenerate" button on /admin/jobs, and as a manual
// fallback for jobs approved before this feature existed, or for
// which the automatic generation on approval failed (e.g. Gemini
// quota exhausted at that moment).
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
import { generateAndSaveSocialPost } from "@/lib/social-post"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const post = await generateAndSaveSocialPost(id)
    if (!post) {
      return NextResponse.json({ error: "Failed to generate social post" }, { status: 500 })
    }

    return NextResponse.json({ social: post })
  } catch (err) {
    console.error("POST admin job social error:", err)
    return NextResponse.json({ error: "Failed to generate social post" }, { status: 500 })
  }
}
