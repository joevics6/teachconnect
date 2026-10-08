// ============================================================
// app/(public)/jobs/[id]/page.tsx
// Server-rendered job page. The job (including the search content
// from lib/job-seo.ts) is fetched on the server so it's in the first
// HTML response, with per-job <title>/description/canonical, and
// schema.org JobPosting + breadcrumb data for Google for Jobs.
// The interactive parts (save, share, apply, per-user state) live in
// JobDetailClient.
// ============================================================

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getJobById, getRelatedJobs } from "@/lib/cache/jobs"
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

const UNAPPROVED = ["pending_approval", "rejected", "draft"]

type Props = { params: Promise<{ id: string }> }

const location = (j: { school_lga?: string | null; school_state?: string | null }) =>
  [j.school_lga, j.school_state].filter(Boolean).join(", ") || "Nigeria"

const trim = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`)

function isExpired(deadline: string | null | undefined) {
  if (!deadline) return false
  return deadline.slice(0, 10) < new Date().toISOString().slice(0, 10)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const job = await getJobById(id)

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
  const url = `${SITE_URL}/jobs/${job.id}`
  const indexable = job.status === "active" && !isExpired(job.deadline)

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
  const { id } = await params
  const job = await getJobById(id)
  if (!job) notFound()

  // Unapproved jobs are only visible to the owning school (checked, with
  // the visitor's session, by /api/jobs/[id]). Let the client component
  // do that fetch and render nothing job-specific from the server.
  if (UNAPPROVED.includes(job.status)) {
    return <JobDetailClient jobId={id} />
  }

  const related = (await getRelatedJobs(job.subject, id)) as RelatedJob[]

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
      <JobDetailClient jobId={id} initialJob={job as unknown as JobWithSchool} initialRelated={related} />
    </>
  )
}
