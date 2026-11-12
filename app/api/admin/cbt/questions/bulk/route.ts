// POST { action: "publish" | "unpublish" | "delete", ids?: string[], filter?: { exam_id, subject_id, status, import_batch } }
// Acts on explicit ids, or on everything matching a filter (needs at least exam_id + subject_id or an import batch).
import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const body = await request.json()
    const action = body.action as string
    if (!["publish", "unpublish", "delete"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    const db = createAdminClient()
    const ids: string[] | null = Array.isArray(body.ids) && body.ids.length > 0 ? body.ids : null
    const f = body.filter || {}
    if (!ids && !(f.import_batch || (f.exam_id && f.subject_id))) {
      return NextResponse.json({ error: "Choose an exam and subject (or a batch) first" }, { status: 400 })
    }

    // Filters are applied BEFORE .select(), so they run on the real filter builder.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apply = (q: any) => {
      if (ids) return q.in("id", ids)
      for (const key of ["exam_id", "subject_id", "status", "import_batch"] as const) if (f[key]) q = q.eq(key, f[key])
      return q
    }

    let affected = 0
    if (action === "delete") {
      const { data, error } = await apply(db.from("cbt_questions").delete()).select("id")
      if (error) throw error
      affected = (data as unknown[] | null)?.length ?? 0
    } else {
      const patch = { status: action === "publish" ? "published" : "draft", updated_at: new Date().toISOString() }
      const { data, error } = await apply(db.from("cbt_questions").update(patch)).select("id")
      if (error) throw error
      affected = (data as unknown[] | null)?.length ?? 0
    }
    revalidateTag("cbt", "max")
    return NextResponse.json({ affected })
  } catch (err) {
    console.error("POST admin cbt bulk error:", err)
    return NextResponse.json({ error: "Bulk action failed" }, { status: 500 })
  }
}
