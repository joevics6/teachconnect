import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: schoolRows } = await supabase
      .from("school_profiles").select("id").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1)
    const school = (schoolRows ?? [])[0] ?? null
    if (!school) return NextResponse.json({ metrics: { interviews: 0, offers: 0, hired: 0, avgScore: 0 } })

    // Get all job IDs for this school
    const { data: jobRows } = await supabase
      .from("jobs").select("id").eq("school_id", school.id)
    const jobIds = (jobRows ?? []).map((j) => j.id)

    if (!jobIds.length) {
      return NextResponse.json({ metrics: { interviews: 0, offers: 0, hired: 0, avgScore: 0 } })
    }

    // Pipeline stage counts
    const [
      { count: interviews },
      { count: offers },
      { count: hired },
    ] = await Promise.all([
      supabase.from("applications").select("id", { count: "exact", head: true })
        .in("job_id", jobIds).eq("pipeline_stage", "interview"),
      supabase.from("applications").select("id", { count: "exact", head: true })
        .in("job_id", jobIds).eq("pipeline_stage", "offered"),
      supabase.from("applications").select("id", { count: "exact", head: true })
        .in("job_id", jobIds).eq("pipeline_stage", "hired"),
    ])

    // Average quiz score across all quiz attempts for this school's jobs
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("score")
      .in("job_id", jobIds)
      .not("score", "is", null)

    const scores = (attempts ?? []).map((a) => a.score).filter((s) => s !== null)
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    return NextResponse.json({
      metrics: {
        interviews: interviews ?? 0,
        offers:     offers     ?? 0,
        hired:      hired      ?? 0,
        avgScore,
      },
    })
  } catch (err) {
    console.error("GET school metrics error:", err)
    return NextResponse.json({ metrics: { interviews: 0, offers: 0, hired: 0, avgScore: 0 } })
  }
}
