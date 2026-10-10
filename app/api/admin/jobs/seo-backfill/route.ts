// ============================================================
// app/api/admin/jobs/seo-backfill/route.ts
// GET  — how many live jobs have no search content yet.
// POST — generate it for up to BATCH_LIMIT of them in the background
//        (lib/job-seo.ts, a few at a time), then burst the jobs cache.
//        Run again for the next batch if more remain.
// ============================================================

import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { after } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { ensureJobSeoContent } from "@/lib/job-seo"

export const maxDuration = 300

const BATCH_LIMIT = 100
const CONCURRENCY = 3

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { count, error } = await createAdminClient()
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("about_role", null)
    if (error) throw error
    return NextResponse.json({ missing: count ?? 0, batchLimit: BATCH_LIMIT })
  } catch (err) {
    console.error("GET seo-backfill error:", err)
    return NextResponse.json({ error: "Failed to count jobs" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data, error } = await createAdminClient()
      .from("jobs")
      .select("id")
      .eq("status", "active")
      .is("about_role", null)
      .order("created_at", { ascending: false })
      .limit(BATCH_LIMIT)
    if (error) throw error

    const ids = (data || []).map((j) => j.id as string)

    after(async () => {
      for (let i = 0; i < ids.length; i += CONCURRENCY) {
        await Promise.all(ids.slice(i, i + CONCURRENCY).map((id) => ensureJobSeoContent(id)))
      }
      revalidateTag("jobs", "max")
    })

    return NextResponse.json({ queued: ids.length })
  } catch (err) {
    console.error("POST seo-backfill error:", err)
    return NextResponse.json({ error: "Failed to start" }, { status: 500 })
  }
}
