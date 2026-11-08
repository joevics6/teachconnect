// ============================================================
// lib/job-location.ts
// One place that turns a job's location into display text. A remote job
// has no country/state/LGA and reads "Remote"; everything else is
// "LGA, State". Missing parts are skipped instead of printing "undefined".
// ============================================================

interface LocatedJob {
  is_remote?: boolean | null
  school_lga?: string | null
  school_state?: string | null
}

export function jobLocationText(job: LocatedJob, fallback = ""): string {
  if (job.is_remote) return "Remote"
  return [job.school_lga, job.school_state].filter(Boolean).join(", ") || fallback
}
