// ============================================================
// lib/job-jsonld.ts
// Structured data for the public job page: schema.org JobPosting
// (what Google for Jobs reads) and a breadcrumb trail.
// Plain functions, no React — rendered by app/(public)/jobs/[id]/page.tsx.
// ============================================================

export interface JobLdInput {
  id: string
  slug?: string | null
  title: string
  subject: string | null
  description: string
  required_qualifications: string | null
  employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  benefits: string[] | null
  deadline: string | null
  created_at: string
  school_name: string
  school_logo_url: string | null
  school_lga: string | null
  school_state: string | null
  is_remote?: boolean | null
  external_apply_enabled?: boolean | null
  role_category?: string | null
  responsibilities?: string[] | null
  skills_required?: string[] | null
  experience_level?: string | null
  about_role?: string | null
}

const EMPLOYMENT_TYPES: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  temporary: "TEMPORARY",
  internship: "INTERN",
  intern: "INTERN",
  volunteer: "VOLUNTEER",
}

// Months of experience, for experienceRequirements. Unknown levels are
// left out rather than guessed.
const EXPERIENCE_MONTHS: Record<string, number> = {
  entry: 0,
  "entry-level": 0,
  junior: 12,
  mid: 36,
  "mid-level": 36,
  senior: 60,
  lead: 84,
}

const normalise = (v: string) => v.toLowerCase().trim().replace(/[\s_]+/g, "-")

/** A job's own public URL path: the slug when it has one, the id otherwise. */
const jobUrlPath = (job: { id: string; slug?: string | null }) => `/jobs/${job.slug || job.id}`

// Google needs a validThrough date for the posting to count as open. Jobs
// without a deadline get 30 days from the day they were posted.
function validThrough(job: JobLdInput): string {
  if (job.deadline) {
    return job.deadline.length === 10 ? `${job.deadline}T23:59:59+01:00` : job.deadline
  }
  const base = new Date(job.created_at)
  if (Number.isNaN(base.getTime())) base.setTime(Date.now())
  base.setDate(base.getDate() + 30)
  return `${base.toISOString().slice(0, 10)}T23:59:59+01:00`
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export const isConfidentialSchool = (name: string | null | undefined) =>
  !name || /confidential/i.test(name)

/** Serialises JSON-LD safely for use inside a <script> tag. */
export const toJsonLdString = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c")

function toHtml(job: JobLdInput): string {
  const parts: string[] = []
  for (const p of job.description.split(/\n\s*\n|\n/).map((x) => x.trim()).filter(Boolean)) {
    parts.push(`<p>${esc(p)}</p>`)
  }
  if (job.responsibilities?.length) {
    parts.push(`<p><strong>Responsibilities</strong></p><ul>${job.responsibilities.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`)
  }
  if (job.required_qualifications) {
    const lines = job.required_qualifications.split("\n").map((x) => x.replace(/^[\s•\-*]+/, "").trim()).filter(Boolean)
    if (lines.length) parts.push(`<p><strong>Qualifications</strong></p><ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`)
  }
  if (job.about_role) {
    for (const p of job.about_role.split(/\n\s*\n|\n/).map((x) => x.trim()).filter(Boolean)) parts.push(`<p>${esc(p)}</p>`)
  }
  // Google rejects an empty description, so never emit one.
  if (parts.length === 0) parts.push(`<p>${esc(job.title)}</p>`)
  return parts.join("")
}

export function buildJobPostingJsonLd(job: JobLdInput, siteUrl: string) {
  const confidential = isConfidentialSchool(job.school_name)
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: toHtml(job),
    datePosted: job.created_at.slice(0, 10),
    identifier: { "@type": "PropertyValue", name: "ClassHire", value: job.id },
    url: `${siteUrl}${jobUrlPath(job)}`,
    industry: "Education",
    directApply: !job.external_apply_enabled,
    hiringOrganization: {
      "@type": "Organization",
      name: confidential ? "Confidential School" : job.school_name,
      ...(!confidential && job.school_logo_url ? { logo: job.school_logo_url } : {}),
    },
    // Remote jobs have no place of work: Google wants TELECOMMUTE plus the
    // countries applicants may live in, and no jobLocation.
    ...(job.is_remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "Nigeria" },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              // addressLocality is what Google reads as the town/city; fall back to
              // the state, then the country, so a job with no LGA still has one.
              addressLocality: job.school_lga || job.school_state || "Nigeria",
              ...(job.school_state ? { addressRegion: job.school_state } : {}),
              addressCountry: "NG",
            },
          },
        }),
  }

  ld.validThrough = validThrough(job)
  const type = job.employment_type ? EMPLOYMENT_TYPES[normalise(job.employment_type)] : undefined
  if (type) ld.employmentType = type
  const months = job.experience_level ? EXPERIENCE_MONTHS[normalise(job.experience_level)] : undefined
  if (months !== undefined) {
    ld.experienceRequirements = { "@type": "OccupationalExperienceRequirements", monthsOfExperience: months }
  }
  if (job.role_category) ld.occupationalCategory = job.role_category
  if (job.skills_required?.length) ld.skills = job.skills_required.join(", ")
  if (job.responsibilities?.length) ld.responsibilities = job.responsibilities.join(" ")
  if (job.required_qualifications) ld.qualifications = job.required_qualifications
  if (job.benefits?.length) ld.jobBenefits = job.benefits.join(", ")

  const min = job.salary_min || 0
  const max = job.salary_max || 0
  if (min || max) {
    const value =
      min && max
        ? { "@type": "QuantitativeValue", minValue: min, maxValue: max, unitText: "MONTH" }
        : { "@type": "QuantitativeValue", value: min || max, unitText: "MONTH" }
    ld.baseSalary = { "@type": "MonetaryAmount", currency: "NGN", value }
  }
  return ld
}

export function buildBreadcrumbJsonLd(job: { id: string; slug?: string | null; title: string }, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Jobs", item: `${siteUrl}/jobs` },
      { "@type": "ListItem", position: 3, name: job.title, item: `${siteUrl}${jobUrlPath(job)}` },
    ],
  }
}
