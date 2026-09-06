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

const SCHOOL_FIELDS = `id, user_id, school_name, slug, school_type, school_levels,
  state, lga, town, address, website,
  logo_url, is_verified, created_at,
  about, long_description, faq, curriculum, student_population,
  salary_range_min, salary_range_max, benefits,
  school_category`

const JOB_FIELDS = `id, title, subject, teaching_levels, employment_type,
  salary_min, salary_max, accommodation_offered, quiz_enabled,
  deadline, created_at`

/**
 * Looks up a school by slug (the canonical public identifier) or,
 * failing that, by raw id — old links and any internal code that
 * hasn't been updated to pass a slug yet still resolve correctly.
 * Contact details (phone/name/role) are deliberately NOT included
 * here: this result is cached and shared across every visitor, and
 * this page is about to get a lot more public/SEO traffic, so a
 * school's direct phone number shouldn't be sitting in a payload
 * served to anonymous crawlers and scrapers. The route fetches those
 * separately, only for signed-in requesters — same pattern as
 * external_apply_value on job listings.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const getPublicSchoolProfile = unstable_cache(
  async (slugOrId: string) => {
    const supabase = createPublicClient()
    const todayISO = new Date().toISOString().split("T")[0]

    // `id` is a uuid column — passing a non-uuid slug into `id.eq.<slug>`
    // via .or() throws a DB type error rather than just not matching,
    // so only add that clause when slugOrId actually looks like a uuid.
    const filter = UUID_RE.test(slugOrId)
      ? `slug.eq.${slugOrId},id.eq.${slugOrId}`
      : `slug.eq.${slugOrId}`

    const { data: schoolRows } = await supabase
      .from("school_profiles")
      .select(SCHOOL_FIELDS)
      .or(filter)
      .limit(1)

    const school = (schoolRows ?? [])[0] ?? null
    if (!school) return null

    const [{ data: jobs }, [{ count: totalJobs }, { count: activeJobs }], { data: allJobIds }] =
      await Promise.all([
        supabase
          .from("jobs").select(JOB_FIELDS)
          .eq("school_id", school.id).eq("status", "active").eq("is_private", false)
          .gte("deadline", todayISO)
          .order("created_at", { ascending: false }),
        Promise.all([
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("school_id", school.id),
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("status", "active"),
        ]),
        supabase.from("jobs").select("id").eq("school_id", school.id),
      ])

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

/**
 * Contact details for a school — kept out of the cached, shared
 * getPublicSchoolProfile payload (see comment there). Deliberately
 * NOT cached: this is only ever called for a signed-in requester, a
 * tiny single-row query, and caching it under the school's id would
 * risk it leaking into a response for a future anonymous request if
 * the cache key ever got reused incorrectly.
 */
export async function getSchoolContactInfo(schoolId: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from("school_profiles")
    .select("contact_name, contact_role, contact_phone")
    .eq("id", schoolId)
    .single()
  return data
}
