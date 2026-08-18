// ============================================================
// app/api/schools/[id]/route.ts
// GET — public school profile with active jobs + stats
// Backed by lib/cache/schools.ts — see that file for the caching/
// invalidation strategy. Same underlying data as app/api/school/[id]
// (kept as a separate route since both are already in use by the
// frontend), so both now share one cache entry per school instead
// of querying Supabase independently.
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { getPublicSchoolProfile } from "@/lib/cache/schools"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getPublicSchoolProfile(id)

    if (!result) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("GET public school profile error:", err)
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 })
  }
}
