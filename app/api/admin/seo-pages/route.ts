// ============================================================
// app/api/admin/seo-pages/route.ts
// GET — every location with live jobs, its job count, whether its
//       landing page is live (> MIN_JOBS_FOR_LANDING - 1 jobs) and
//       the copy written for it so far.
// PUT — save the copy for one location.
// ============================================================

import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"
import { NIGERIAN_STATES } from "@/lib/constants"
import { landingPath, MIN_JOBS_FOR_LANDING } from "@/lib/landing"

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const db = createAdminClient()
    const today = new Date().toISOString().split("T")[0]
    const [{ data: jobs }, { data: pages }] = await Promise.all([
      db.from("jobs_with_school").select("school_state").eq("status", "active").eq("is_private", false).gte("deadline", today),
      db.from("seo_landing_pages").select("key, title, meta_description, intro, body, updated_at").eq("kind", "state"),
    ])

    const counts: Record<string, number> = {}
    for (const j of jobs || []) if (j.school_state) counts[j.school_state] = (counts[j.school_state] || 0) + 1
    const byKey = new Map((pages || []).map((p) => [p.key as string, p]))

    const locations = (NIGERIAN_STATES as readonly string[])
      .filter((s) => (counts[s] ?? 0) > 0 || byKey.has(s))
      .map((state) => {
        const content = byKey.get(state)
        const count = counts[state] ?? 0
        return {
          state,
          count,
          live: count >= MIN_JOBS_FOR_LANDING,
          path: landingPath(state),
          hasContent: !!((content?.intro || "").trim() || (content?.body || "").trim()),
          title: content?.title ?? "",
          meta_description: content?.meta_description ?? "",
          intro: content?.intro ?? "",
          body: content?.body ?? "",
        }
      })
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ locations, minJobs: MIN_JOBS_FOR_LANDING })
  } catch (err) {
    console.error("GET admin seo-pages error:", err)
    return NextResponse.json({ error: "Failed to load pages" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const state = typeof body.state === "string" ? body.state : ""
    if (!(NIGERIAN_STATES as readonly string[]).includes(state)) {
      return NextResponse.json({ error: "Unknown state" }, { status: 400 })
    }
    const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

    const { error } = await createAdminClient()
      .from("seo_landing_pages")
      .upsert(
        {
          kind: "state",
          key: state,
          title: clean(body.title),
          meta_description: clean(body.meta_description),
          intro: clean(body.intro),
          body: clean(body.body),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "kind,key" }
      )
    if (error) throw error

    revalidateTag("landing", "max")
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("PUT admin seo-pages error:", err)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
