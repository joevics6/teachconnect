// GET ?exam_id&subject_id&status&year&page — paged question list for review (all statuses).
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

const PAGE_SIZE = 20

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const url = new URL(request.url)
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10) || 1, 1)
    const db = createAdminClient()

    let q = db
      .from("cbt_questions")
      .select("*, passage:cbt_passages(body)", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    for (const key of ["exam_id", "subject_id", "status", "import_batch"] as const) {
      const v = url.searchParams.get(key)
      if (v) q = q.eq(key, v)
    }
    const year = parseInt(url.searchParams.get("year") || "", 10)
    if (!Number.isNaN(year)) q = q.eq("year", year)

    const { data, count, error } = await q
    if (error) throw error
    return NextResponse.json({ questions: data || [], total: count ?? 0, page, page_size: PAGE_SIZE })
  } catch (err) {
    console.error("GET admin cbt questions error:", err)
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 })
  }
}
