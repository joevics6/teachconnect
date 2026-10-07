// ============================================================
// app/api/admin/jobs/[id]/seo/route.ts
// POST — (re)generate the search-oriented content for one job
// (about_role, who_apply, standout, responsibilities, skills,
// meta description, ...) and return it. Used by the "Generate"
// button on /admin/jobs/[id]/edit, including to backfill jobs that
// went live before this feature existed.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
import { ensureJobSeoContent } from "@/lib/job-seo"
import { revalidateTag } from "next/cache"

export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const content = await ensureJobSeoContent(id, { force: true })
    if (!content) {
      return NextResponse.json({ error: "Couldn't generate content. Try again in a moment." }, { status: 502 })
    }

    revalidateTag("jobs", "max")
    return NextResponse.json({ content })
  } catch (err) {
    console.error("POST admin job seo error:", err)
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
  }
}
