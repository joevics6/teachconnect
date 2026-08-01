import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasTalentAccess } from "@/lib/school-plan"
import type { PlanType } from "@/lib/school-plan"

// ── Match score calculator ────────────────────────────────────
function calcMatchScore(
  teacher: Record<string, unknown>,
  filters: { subject: string; level: string; state: string }
): number {
  let score = 0

  // Subject match — 30 pts
  if (filters.subject && Array.isArray(teacher.subjects)) {
    if ((teacher.subjects as string[]).includes(filters.subject)) score += 30
  } else if (!filters.subject) {
    score += 15 // neutral when no filter
  }

  // Teaching level match — 20 pts
  if (filters.level && Array.isArray(teacher.teaching_levels)) {
    if ((teacher.teaching_levels as string[]).includes(filters.level)) score += 20
  } else if (!filters.level) {
    score += 10
  }

  // Location match — 20 pts
  if (filters.state && teacher.state) {
    if (teacher.state === filters.state) score += 20
    else if ((teacher.willing_to_relocate as boolean)) score += 10
  } else if (!filters.state) {
    score += 10
  }

  // TRCN registered — 15 pts
  if (teacher.trcn_status === "registered") score += 15

  // Availability — 15 pts
  if (teacher.availability === "immediate") score += 15
  else if (teacher.availability === "2-weeks") score += 10
  else if (teacher.availability === "1-month") score += 5

  return Math.min(score, 100)
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Auth — use metadata role (avoids users table)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (user.user_metadata?.role !== "school") {
      return NextResponse.json({ error: "Only schools can browse talent" }, { status: 403 })
    }

    // Check subscription
    const { data: schoolRows } = await supabase
      .from("school_profiles").select("id").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1)
    const school = (schoolRows ?? [])[0] ?? null

    let isPremium = false
    if (school) {
      const { data: subRows } = await supabase
        .from("subscriptions").select("id, plan_type")
        .eq("school_id", school.id).eq("is_active", true)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(1)
      isPremium = hasTalentAccess(((subRows ?? [])[0]?.plan_type as PlanType) || "free")
    }

    // Filters
    const keyword     = searchParams.get("keyword")     || ""
    const subject     = searchParams.get("subject")     || ""
    const level       = searchParams.get("level")       || ""
    const state       = searchParams.get("state")       || ""
    const trcn_only   = searchParams.get("trcn_only")   === "true"
    const relocate    = searchParams.get("relocate")    === "true"
    const accommodation = searchParams.get("accommodation") === "true"
    const experience_min = searchParams.get("experience_min") || ""
    const availability = searchParams.get("availability") || ""

    let query = supabase
      .from("teacher_profiles")
      .select(
        `id, full_name, state, lga, subjects, teaching_levels, level_subjects,
         years_experience, trcn_status, willing_to_relocate,
         accommodation_needed, salary_min, salary_max, photo_url,
         bio, profile_completion, availability, demo_video_url`,
        { count: "exact" }
      )
      .eq("is_visible", true)

    if (keyword)          query = query.ilike("full_name", `%${keyword}%`)
    // Coarse pre-filter at the DB level (fast, indexable) — narrowed further
    // below when BOTH subject and level are given, since a teacher can teach
    // one subject at one level and a different subject at another.
    if (subject)          query = query.contains("subjects", [subject])
    if (level)            query = query.contains("teaching_levels", [level])
    if (state)            query = query.eq("state", state)
    if (trcn_only)        query = query.eq("trcn_status", "registered")
    if (relocate)         query = query.eq("willing_to_relocate", true)
    if (accommodation)    query = query.eq("accommodation_needed", true)
    if (experience_min)   query = query.gte("years_experience", parseInt(experience_min))
    if (availability)     query = query.eq("availability", availability)

    query = query.order("profile_completion", { ascending: false })

    const { data: teachers, count, error } = await query
    if (error) throw error

    // Precise pairing: when both subject and level are specified, require the
    // teacher to actually teach that subject AT that level (not just teach
    // that subject somewhere and that level for something else).
    const filtered = subject && level
      ? (teachers || []).filter((t) => {
          const pairs = (t.level_subjects as { level: string; subjects: string[] }[] | null) || []
          return pairs.some((p) => p.level === level && p.subjects.includes(subject))
        })
      : (teachers || [])

    // Calculate and attach match scores, then sort by score desc
    const scored = filtered.map((t) => ({
      ...t,
      match_score: calcMatchScore(t as Record<string, unknown>, { subject, level, state }),
    })).sort((a, b) => b.match_score - a.match_score)

    return NextResponse.json({ teachers: scored, total: subject && level ? filtered.length : (count || 0), is_premium: isPremium })
  } catch (err) {
    console.error("GET /api/talent error:", err)
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 })
  }
}
