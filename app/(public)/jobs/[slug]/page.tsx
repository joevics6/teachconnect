// ============================================================
// app/(public)/jobs/[slug]/page.tsx
// Server-rendered job page. The job (including the search content
// from lib/job-seo.ts) is fetched on the server so it's in the first
// HTML response, with per-job <title>/description/canonical, and
// schema.org JobPosting + breadcrumb data for Google for Jobs.
// The interactive parts (save, share, apply, per-user state) live in
// JobDetailClient.
// ============================================================

import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { getJobById, getJobIdBySlug, getRelatedJobs } from "@/lib/cache/jobs"
import { isUuid, jobPath } from "@/lib/job-slug"
import { jobLocationText } from "@/lib/job-location"
import {
  buildBreadcrumbJsonLd,
  buildJobPostingJsonLd,
  isConfidentialSchool,
  toJsonLdString,
  type JobLdInput,
} from "@/lib/job-jsonld"
import { SITE_URL } from "@/lib/site"
import JobDetailClient, { type JobWithSchool, type RelatedJob } from "./JobDetailClient"

export const revalidate = 300
import { hideExpiredContact, isJobExpired as isExpired } from "@/lib/job-expiry"

const UNAPPROVED = ["pending_approval", "rejected", "draft"]

// The URL segment is a slug. Old links used the job id, so a uuid is still
// accepted and (once the job has a slug) redirected to the slug URL.
type Props = { params: Promise<{ slug: string }> }

async function loadJob(param: string) {
  const id = isUuid(param) ? param : await getJobIdBySlug(param)
  return id ? getJobById(id) : null
}

const location = (j: { is_remote?: boolean | null; school_lga?: string | null; school_state?: string | null }) =>
  jobLocationText(j, "Nigeria")

const trim = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`)


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await loadJob(slug)

  // Unknown or not-yet-approved jobs: nothing to describe, nothing to index.
  if (!job || UNAPPROVED.includes(job.status)) {
    return { title: "Job", robots: { index: false, follow: false } }
  }

  const confidential = isConfidentialSchool(job.school_name)
  const where = location(job)
  const title = trim(
    confidential
      ? `${job.title} – ${where}`
      : `${job.title} at ${job.school_name} – ${where}`,
    62
  )
  const description = trim(
    job.meta_description ||
      `${confidential ? "A school" : job.school_name} is hiring a ${job.title} in ${where}. ${job.employment_type ?? ""} ${job.subject ?? ""} role. Apply on ClassHire.`
        .replace(/\s+/g, " "),
    160
  )
  const url = `${SITE_URL}${jobPath(job)}`
  // Expired jobs stay indexed (the page itself says the job has expired).
  const indexable = job.status === "active" || job.status === "closed"

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url, siteName: "ClassHire", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params
  const job = await loadJob(slug)
  if (!job) notFound()

  // One URL per job: id links (and any other spelling) go to the slug URL.
  // Not for unapproved jobs, which must not reveal anything publicly.
  if (!UNAPPROVED.includes(job.status) && job.slug && slug !== job.slug) {
    permanentRedirect(jobPath(job))
  }

  // Unapproved jobs are only visible to the owning school (checked, with
  // the visitor's session, by /api/jobs/[id]). Let the client component
  // do that fetch and render nothing job-specific from the server.
  if (UNAPPROVED.includes(job.status)) {
    return <JobDetailClient jobId={job.id} />
  }

  const related = (await getRelatedJobs(job.subject, job.id)) as RelatedJob[]

  const jobLd = buildJobPostingJsonLd(job as unknown as JobLdInput, SITE_URL)
  const crumbLd = buildBreadcrumbJsonLd(job, SITE_URL)
  // A job that's closed or past its deadline shouldn't be offered to
  // Google for Jobs as an open posting.
  const showJobLd = job.status === "active" && !isExpired(job.deadline)

  return (
    <>
      {showJobLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLdString(jobLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdString(crumbLd) }}
      />
      <JobDetailClient jobId={job.id} initialJob={hideExpiredContact(job) as unknown as JobWithSchool} initialRelated={related} />
    </>
  )
}
