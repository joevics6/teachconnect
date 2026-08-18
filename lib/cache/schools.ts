// ============================================================
// lib/cache/schools.ts
// Cached reads for public school profile data — same pattern as
// lib/cache/jobs.ts. Tagged "schools" and bursted via
// revalidateTag("schools", "max") from the school-profile PATCH route and
// from any job-status change (since a job going active/closed
// changes the active-job count and listing shown on the school's
// public profile).
// ============================================================

import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"

const TAGS = ["schools"]
const REVALIDATE_SECONDS = 300

const SCHOOL_FIELDS = `id, school_name, school_type, school_levels,
  state, lga, address, website,
  contact_name, contact_role, contact_phone,
  logo_url, is_verified, created_at,
  about, curriculum, student_population,
  salary_range_min, salary_range_max, benefits,
  school_category`

const JOB_FIELDS = `id, title, subject, teaching_levels, employment_type,
  salary_min, salary_max, accommodation_offered, quiz_enabled,
  deadline, created_at`

export const getPublicSchoolProfile = unstable_cache(
  async (schoolId: string) => {
    const supabase = createPublicClient()
    const todayISO = new Date().toISOString().split("T")[0]

    const [{ data: schoolRows }, { data: jobs }, [{ count: totalJobs }, { count: activeJobs }], { data: allJobIds }] =
      await Promise.all([
        supabase.from("school_profiles").select(SCHOOL_FIELDS).eq("id", schoolId).limit(1),
        supabase
          .from("jobs").select(JOB_FIELDS)
          .eq("school_id", schoolId).eq("status", "active").eq("is_private", false)
          .gte("deadline", todayISO)
          .order("created_at", { ascending: false }),
        Promise.all([
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "active"),
        ]),
        supabase.from("jobs").select("id").eq("school_id", schoolId),
      ])

    const school = (schoolRows ?? [])[0] ?? null
    if (!school) return null

    const { count: totalHired } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("pipeline_stage", "hired")
      .in("job_id", (allJobIds ?? []).map((j) => j.id))

    return {
      school,
      active_jobs: jobs ?? [],
      stats: {
        total_jobs: totalJobs ?? 0,
        active_jobs: activeJobs ?? 0,
        total_hired: totalHired ?? 0,
      },
    }
  },
  ["school-public-profile"],
  { tags: TAGS, revalidate: REVALIDATE_SECONDS }
)
