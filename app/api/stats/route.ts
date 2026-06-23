// ============================================================
// app/api/stats/route.ts
// GET /api/stats — platform stats for homepage
// ============================================================
 
// Create at: app/api/stats/route.ts
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function GET() {
  try {
    const supabase = await createClient()
 
    const { data: stats } = await supabase
      .from("platform_stats")
      .select("*")
      .eq("id", 1)
      .single()
 
    return NextResponse.json(stats || {
      teachers_registered: 0,
      schools_hiring: 0,
      states_covered: 30,
      jobs_posted: 0,
    })
  } catch (err) {
    console.error("GET stats error:", err)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}