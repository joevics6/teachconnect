import type { Metadata } from "next"
import { getFeaturedJobs, getJobsSearch } from "@/lib/cache/jobs"
import { absoluteUrl, toJsonLdString } from "@/lib/site"
import JobsClient, { type InitialJobs, type JobWithSchool } from "./JobsClient"

export const revalidate = 300

const TITLE = "Teaching Jobs in Nigeria – Latest Teacher Vacancies"
const DESCRIPTION =
  "Browse the latest teaching jobs in Nigeria: primary, secondary, nursery and non-teaching school roles in Lagos, Abuja, Port Harcourt and other states. Apply directly to schools."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/jobs" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/jobs"), siteName: "ClassHire", type: "website" },
}

export default async function JobsPage() {
  let initial: InitialJobs | undefined
  try {
    const [{ jobs, total }, featured] = await Promise.all([
      getJobsSearch({
        keyword: "", subject: "", level: "", state: "", employment_type: "",
        salary_min: "", salary_max: "", accommodation: false, sort: "newest", page: 1, limit: 20,
      }),
      getFeaturedJobs(),
    ])
    initial = {
      jobs: (jobs || []) as JobWithSchool[],
      featured: (featured || []) as JobWithSchool[],
      total: total || 0,
    }
  } catch (err) {
    // Fall back to the client-side fetch rather than failing the page.
    console.error("Jobs page: server fetch failed:", err)
  }

  const listed = initial ? [...initial.featured, ...initial.jobs] : []
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: listed.map((j, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/jobs/${j.id}`),
      name: j.title,
    })),
  }

  return (
    <>
      {listed.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(listLd) }} />
      )}
      <JobsClient initial={initial} />
    </>
  )
}
