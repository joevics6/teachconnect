// GET — admin-only. Parse batch history + totals for /admin/parse-jobs/batches.

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data, error } = await createAdminClient()
      .from("job_batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) {
      // Table not created yet — tell the page how to fix it instead of a blank 500.
      return NextResponse.json({ batches: [], stats: null, missingTable: true })
    }

    const batches = data ?? []
    const stats = {
      totalBatches: batches.length,
      completedBatches: batches.filter((b) => b.status === "completed").length,
      totalJobsProcessed: batches.reduce((n, b) => n + (b.processed_jobs || 0), 0),
      totalJobsFailed: batches.reduce((n, b) => n + (b.failed_jobs || 0), 0),
    }
    return NextResponse.json({ batches, stats })
  } catch (err) {
    console.error("GET admin batches error:", err)
    return NextResponse.json({ error: "Failed to load batches" }, { status: 500 })
  }
}
