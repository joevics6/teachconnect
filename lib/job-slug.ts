// ============================================================
// lib/job-slug.ts
// Public job URLs use a slug (see supabase/job_slugs.sql, which creates it
// when the job is inserted). Jobs without one yet fall back to the id URL,
// and the job page redirects id URLs to the slug URL once it exists.
// ============================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: string) => UUID_RE.test(value)

/** Path of a job's public page: slug when it has one, id otherwise. */
export const jobPath = (job: { id: string; slug?: string | null }) => `/jobs/${job.slug || job.id}`
