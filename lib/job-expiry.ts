// ============================================================
// lib/job-expiry.ts
// Expired jobs stay public, indexed and in the sitemap (they keep ranking
// and send visitors to current vacancies), but the way to apply is removed:
// the contact value is stripped on the server so it never reaches the page
// or the JSON the browser receives, and the UI shows "This job has expired".
// ============================================================

export function isJobExpired(deadline: string | null | undefined): boolean {
  if (!deadline) return false
  return deadline.slice(0, 10) < new Date().toISOString().slice(0, 10)
}

/** Returns the job with its contact details removed when it has expired. */
export function hideExpiredContact<T extends { deadline?: string | null }>(job: T): T {
  if (!isJobExpired(job.deadline)) return job
  return { ...job, external_apply_enabled: false, external_apply_value: null }
}
