// ============================================================
// app/(public)/jobs/in/[state]/page.tsx
// Location landing page, e.g. /jobs/in/lagos — "Teaching Jobs in Lagos".
//  • 404 unless the state has MORE than 5 live jobs (lib/landing.ts).
//  • Indexable only once an admin has written copy for it
//    (/admin/seo-pages); until then it renders but is noindex and out
//    of the sitemap, so a thin page never competes with /jobs.
// ============================================================

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Briefcase, Clock, MapPin } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { Markdown } from "@/components/ui/Markdown"
import { getLandingContent, getStateJobCounts, getStateLandingJobs } from "@/lib/cache/landing"
import { landingPath, MIN_JOBS_FOR_LANDING, stateDisplayName, stateFromSlug, stateSlug } from "@/lib/landing"
import { absoluteUrl, oneLine, SITE_NAME, toJsonLdString, trimText } from "@/lib/site"
import { formatSalaryRange } from "@/lib/utils"

export const revalidate = 300

type Props = { params: Promise<{ state: string }> }

const hasCopy = (c: { intro: string | null; body: string | null } | null) =>
  !!c && (!!(c.intro || "").trim() || !!(c.body || "").trim())

async function resolve(slug: string) {
  const state = stateFromSlug(slug)
  if (!state) return null
  const counts = await getStateJobCounts()
  const count = counts[state] ?? 0
  if (count < MIN_JOBS_FOR_LANDING) return null
  return { state, count, counts }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params
  const found = await resolve(slug)
  if (!found) return { title: "Page not found", robots: { index: false, follow: false } }

  const { state, count } = found
  const name = stateDisplayName(state)
  const content = await getLandingContent(state)

  const title = content?.title?.trim() || `Teaching Jobs in ${name} – ${count} Open Vacancies`
  const description = trimText(
    oneLine(
      content?.meta_description ||
        `Browse ${count} current teaching jobs in ${name}: primary, secondary, nursery and non-teaching school vacancies. Apply directly to schools on ${SITE_NAME}.`
    ),
    160
  )
  const url = absoluteUrl(landingPath(state))

  return {
    title,
    description,
    alternates: { canonical: landingPath(state) },
    robots: hasCopy(content) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function StateJobsPage({ params }: Props) {
  const { state: slug } = await params
  const found = await resolve(slug)
  if (!found) notFound()

  const { state, count, counts } = found
  const name = stateDisplayName(state)
  const [jobs, content] = await Promise.all([getStateLandingJobs(state), getLandingContent(state)])

  // Subject breakdown and other live locations — real internal links.
  const subjectCounts = new Map<string, number>()
  for (const j of jobs) if (j.subject) subjectCounts.set(j.subject, (subjectCounts.get(j.subject) || 0) + 1)
  const topSubjects = [...subjectCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const otherLocations = Object.entries(counts)
    .filter(([s, n]) => s !== state && n >= MIN_JOBS_FOR_LANDING)
    .sort((a, b) => b[1] - a[1])

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Jobs", href: "/jobs" },
    { name: `${name}`, href: undefined },
  ]
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Jobs", item: absoluteUrl("/jobs") },
      { "@type": "ListItem", position: 3, name: `Teaching Jobs in ${name}`, item: absoluteUrl(landingPath(state)) },
    ],
  }
  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Teaching Jobs in ${name}`,
    url: absoluteUrl(landingPath(state)),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: count,
      itemListElement: jobs.map((j, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/jobs/${j.id}`),
        name: j.title,
      })),
    },
  }

  // Server component: "days left" is computed once per (cached) render.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(crumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(listLd) }} />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Breadcrumbs items={crumbs} className="mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Teaching Jobs in {name}</h1>
          <p className="text-gray-500">
            {count} open teaching and school vacancies in {name}, updated daily.
          </p>
          {content?.intro?.trim() && <Markdown className="mt-5">{content.intro}</Markdown>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {topSubjects.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Popular roles in {name}</h2>
            <div className="flex flex-wrap gap-2">
              {topSubjects.map(([subject, n]) => (
                <span key={subject} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg">
                  {subject} <span className="text-gray-400">({n})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {jobs.map((job) => {
            const daysLeft = Math.ceil((new Date(job.deadline).getTime() - now) / 86_400_000)
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white border border-gray-200 rounded-2xl p-5 hover:border-ink-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 text-base">{job.title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{job.school_name}</p>
                  </div>
                  {job.is_featured && (
                    <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold flex-shrink-0">Featured</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{[job.school_lga, job.school_state].filter(Boolean).join(", ")}</span>
                  <span className="flex items-center gap-1.5 capitalize"><Briefcase className="h-4 w-4" />{job.employment_type}</span>
                  <span className="flex items-center gap-1.5" suppressHydrationWarning><Clock className="h-4 w-4" />{daysLeft <= 1 ? "Closes soon" : `${daysLeft} days left`}</span>
                  {(job.salary_min || job.salary_max) ? (
                    <span className="font-semibold text-gray-900">{formatSalaryRange(job.salary_min, job.salary_max)}<span className="font-normal text-gray-400">/mo</span></span>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center">
          <Link href="/jobs" className="text-ink-600 hover:underline text-sm font-medium">
            Search all teaching jobs in Nigeria →
          </Link>
        </div>

        {content?.body?.trim() && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
            <Markdown>{content.body}</Markdown>
          </section>
        )}

        {otherLocations.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Teaching jobs in other states</h2>
            <div className="flex flex-wrap gap-2">
              {otherLocations.map(([s, n]) => (
                <Link key={s} href={`/jobs/in/${stateSlug(s)}`} className="px-3 py-1.5 bg-white border border-gray-200 text-ink-600 hover:border-ink-300 text-sm rounded-lg">
                  {stateDisplayName(s)} ({n})
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
