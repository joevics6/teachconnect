// ============================================================
// lib/cache/jobs.ts
// Cached reads for public job data. Wrapped in unstable_cache so
// repeat requests (job search, job detail, related jobs) are
// served from Next's data cache instead of round-tripping to
// Supabase every time — and tagged "jobs" so every write path
// that can change what's publicly visible (admin approve/reject,
// a school closing/editing a job, a featured/extended add-on
// payment) bursts the cache immediately via revalidateTag("jobs", "max")
// instead of waiting out a TTL.
//
// The `revalidate: 300` below is just a safety net for any job
// mutation that ever slips through without calling revalidateTag
// — normal invalidation is tag-based and near-instant.
// ============================================================

import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"

const TAGS = ["jobs"]
const REVALIDATE_SECONDS = 300

export interface JobSearchFilters {
  keyword: string
  subject: string
  level: string
  state: string
  employment_type: string
  salary_min: string
  salary_max: string
  accommodation: boolean
  sort: string
  page: number
  limit: number
}

/**
 * Non-featured, filtered/paginated job search. Every unique
 * combination of filters gets its own cache entry (unstable_cache
 * derives the cache key from the arguments), which is the right
 * tradeoff here — the common case (no filters, page 1) gets a very
 * high hit rate, and rare filter combinations just cost a normal
 * Supabase round trip the first time.
 */
export const getJobsSearch = unstable_cache(
  async (filters: JobSearchFilters) => {
    const supabase = createPublicClient()
    const offset = (filters.page - 1) * filters.limit

    let query = supabase
      .from("jobs_with_school")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .eq("is_private", false)
      .gte("deadline", new Date().toISOString().split("T")[0])

    if (filters.keyword) {
      query = query.or(
        `title.ilike.%${filters.keyword}%,subject.ilike.%${filters.keyword}%,school_name.ilike.%${filters.keyword}%`
      )
    }
    if (filters.subject) query = query.eq("subject", filters.subject)
    if (filters.level) query = query.contains("teaching_levels", [filters.level])
    if (filters.state) query = query.eq("school_state", filters.state)
    if (filters.employment_type) query = query.eq("employment_type", filters.employment_type)
    if (filters.salary_min) query = query.gte("salary_max", parseInt(filters.salary_min))
    if (filters.salary_max) query = query.lte("salary_min", parseInt(filters.salary_max))
    if (filters.accommodation) query = query.eq("accommodation_offered", true)

    switch (filters.sort) {
      case "salary_high":
        query = query.order("salary_max", { ascending: false })
        break
      case "deadline":
        query = query.order("deadline", { ascending: true })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    const { data, count, error } = await query
      .eq("is_featured", false)
      .range(offset, offset + filters.limit - 1)

    if (error) throw error
    return { jobs: data || [], total: count || 0 }
  },
  ["jobs-search"],
  { tags: TAGS, revalidate: REVALIDATE_SECONDS }
)

export const getFeaturedJobs = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from("jobs_with_school")
      .select("*")
      .eq("status", "active")
      .eq("is_private", false)
      .eq("is_featured", true)
      .gte("deadline", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false })
      .limit(4)
    return data || []
  },
  ["jobs-featured"],
  { tags: TAGS, revalidate: REVALIDATE_SECONDS }
)

/**
 * Raw job row by id, INCLUDING non-active statuses — the caller
 * (app/api/jobs/[id]/route.ts) still does its own live ownership
 * check for pending/rejected/draft jobs before deciding whether to
 * serve this to the requester. That check itself is cheap and not
 * cached, so a job's approval status can never be bypassed by a
 * stale cache entry — and every mutation that changes job.status
 * calls revalidateTag("jobs", "max"), so this cache entry is invalidated
 * the moment a job's status actually changes rather than lagging
 * behind it.
 */
export const getJobById = unstable_cache(
  async (jobId: string) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from("jobs_with_school")
      .select("*")
      .eq("id", jobId)
      .single()
    return data || null
  },
  ["job-by-id"],
  { tags: TAGS, revalidate: REVALIDATE_SECONDS }
)

export const getRelatedJobs = unstable_cache(
  async (subject: string, excludeId: string) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from("jobs_with_school")
      .select("id, title, school_name, school_state, salary_min, salary_max, employment_type")
      .eq("subject", subject)
      .eq("status", "active")
      .eq("is_private", false)
      .neq("id", excludeId)
      .gte("deadline", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false })
      .limit(4)
    return data || []
  },
  ["jobs-related"],
  { tags: TAGS, revalidate: REVALIDATE_SECONDS }
)
