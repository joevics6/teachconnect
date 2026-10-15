// ============================================================
// app/api/admin/seo-pages/route.ts
// GET — (add ?kind=category for job categories) every location with live jobs, its job count, whether its
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
import { categoryPath, categorySlug, landingPath, MIN_JOBS_FOR_LANDING } from "@/lib/landing"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const db = createAdminClient()

    if (new URL(request.url).searchParams.get("kind") === "category") {
      const t = new Date().toISOString().split("T")[0]
      const [{ data: jobs }, { data: pages }] = await Promise.all([
        db.from("jobs").select("role_category").eq("status", "active").eq("is_private", false).gte("deadline", t).not("role_category", "is", null),
        db.from("seo_landing_pages").select("key, title, meta_description, intro, body").eq("kind", "category"),
      ])
      const groups: Record<string, { names: Record<string, number>; count: number }> = {}
      for (const j of jobs || []) {
        const name = (j.role_category || "").trim()
        if (!name) continue
        const g = (groups[categorySlug(name)] ||= { names: {}, count: 0 })
        g.names[name] = (g.names[name] || 0) + 1
        g.count++
      }
      const byKey = new Map((pages || []).map((p) => [p.key as string, p]))
      const slugs = new Set([...Object.keys(groups), ...byKey.keys()])
      const locations = [...slugs]
        .map((slug) => {
          const g = groups[slug]
          const content = byKey.get(slug)
          const count = g?.count ?? 0
          const name = g ? Object.entries(g.names).sort((a, b) => b[1] - a[1])[0][0] : slug.replace(/-/g, " ")
          return {
            state: slug, // "state" doubles as the item key so the admin UI is shared
            name,
            count,
            live: count >= MIN_JOBS_FOR_LANDING,
            path: categoryPath(slug),
            hasContent: !!((content?.intro || "").trim() || (content?.body || "").trim()),
            title: content?.title ?? "",
            meta_description: content?.meta_description ?? "",
            intro: content?.intro ?? "",
            body: content?.body ?? "",
          }
        })
        .sort((a, b) => b.count - a.count)
      return NextResponse.json({ locations, minJobs: MIN_JOBS_FOR_LANDING })
    }

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
    const kind = body.kind === "category" ? "category" : "state"
    const state = typeof body.state === "string" ? body.state : ""
    if (kind === "state" && !(NIGERIAN_STATES as readonly string[]).includes(state)) {
      return NextResponse.json({ error: "Unknown state" }, { status: 400 })
    }
    if (kind === "category" && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(state)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }
    const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

    const { error } = await createAdminClient()
      .from("seo_landing_pages")
      .upsert(
        {
          kind,
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
