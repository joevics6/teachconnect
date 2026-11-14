// DELETE — remove one saved item from the queue.
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(await createClient())
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { id } = await params
    const { error } = await createAdminClient().from("blog_queue").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE admin blog-queue error:", err)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
