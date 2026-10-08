import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getFeaturedJobs, getJobsSearch } from "@/lib/cache/jobs"
import { getStateJobCounts } from "@/lib/cache/landing"
import { MIN_JOBS_FOR_LANDING, landingPath, stateDisplayName } from "@/lib/landing"
import { absoluteUrl, toJsonLdString } from "@/lib/site"
import JobsClient, { type InitialJobs, type JobWithSchool } from "./JobsClient"

export const revalidate = 300

const TITLE = "Teaching Jobs in Nigeria – Latest Teacher Vacancies"
const DESCRIPTION =
  "Browse the latest teaching jobs in Nigeria: primary, secondary, nursery and non-teaching school roles in Lagos, Abuja, Port Harcourt and other states. Apply directly to schools."

type Props = { searchParams: Promise<{ page?: string }> }

const JOBS_PER_PAGE = 20

function pageNumber(raw: string | undefined) {
  const n = parseInt(raw || "1", 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = pageNumber((await searchParams).page)
  const title = page > 1 ? `${TITLE} – Page ${page}` : TITLE
  const path = page > 1 ? `/jobs?page=${page}` : "/jobs"
  return {
    title,
    description: DESCRIPTION,
    // Each page of results is its own canonical URL; page 1 is plain /jobs.
    alternates: { canonical: path },
    openGraph: { title, description: DESCRIPTION, url: absoluteUrl(path), siteName: "ClassHire", type: "website" },
  }
}

export default async function JobsPage({ searchParams }: Props) {
  const page = pageNumber((await searchParams).page)
  let initial: InitialJobs | undefined
  let pastTheEnd = false
  try {
    const [{ jobs, total }, featured] = await Promise.all([
      getJobsSearch({
        keyword: "", subject: "", level: "", state: "", employment_type: "",
        salary_min: "", salary_max: "", accommodation: false, sort: "newest", page, limit: JOBS_PER_PAGE,
      }),
      page === 1 ? getFeaturedJobs() : Promise.resolve([]),
    ])
    pastTheEnd = page > 1 && (jobs || []).length === 0
    initial = {
      jobs: (jobs || []) as JobWithSchool[],
      featured: (featured || []) as JobWithSchool[],
      total: total || 0,
      page,
    }
  } catch (err) {
    // Fall back to the client-side fetch rather than failing the page.
    console.error("Jobs page: server fetch failed:", err)
  }
  // A page number past the end isn't a real page. (Outside the try —
  // notFound() works by throwing.)
  if (pastTheEnd) notFound()

  // Crawlable links to the location landing pages that are live.
  const stateCounts = await getStateJobCounts().catch(() => ({} as Record<string, number>))
  const liveLocations = Object.entries(stateCounts)
    .filter(([, n]) => n >= MIN_JOBS_FOR_LANDING)
    .sort((a, b) => b[1] - a[1])

  const listed = initial ? [...initial.featured, ...initial.jobs] : []
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: listed.map((j, i) => ({
      "@type": "ListItem",
      position: (page - 1) * JOBS_PER_PAGE + i + 1,
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
      {liveLocations.length > 0 && (
        <nav aria-label="Teaching jobs by location" className="max-w-6xl mx-auto px-4 pb-10">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Browse teaching jobs by location</h2>
          <div className="flex flex-wrap gap-2">
            {liveLocations.map(([state, n]) => (
              <Link key={state} href={landingPath(state)} className="px-3 py-1.5 bg-white border border-gray-200 text-ink-600 hover:border-ink-300 text-sm rounded-lg">
                Teaching jobs in {stateDisplayName(state)} ({n})
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  )
}
