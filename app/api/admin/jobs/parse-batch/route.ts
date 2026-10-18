// ============================================================
// app/api/admin/jobs/parse-batch/route.ts
// POST { jobText } — admin-only. Parses pasted text containing one or
// many job postings into individual, individually written jobs
// (lib/job-parser.ts) and returns the batch result.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
import { MAX_PARSE_CHARS, parseJobBatch } from "@/lib/job-parser"

export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { jobText } = await request.json()
    const text = typeof jobText === "string" ? jobText.trim() : ""
    if (!text) return NextResponse.json({ success: false, error: "Please enter job text to parse" }, { status: 400 })
    if (text.length > MAX_PARSE_CHARS) {
      return NextResponse.json(
        { success: false, error: `That is too long to parse in one go (max ${MAX_PARSE_CHARS.toLocaleString()} characters). Split it into smaller pastes.` },
        { status: 400 }
      )
    }

    return NextResponse.json(await parseJobBatch(text))
  } catch (err) {
    console.error("Admin parse-batch error:", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to parse jobs" },
      { status: 500 }
    )
  }
}
