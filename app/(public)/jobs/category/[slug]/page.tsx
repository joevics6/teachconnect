// ============================================================
// app/(public)/jobs/category/[slug]/page.tsx
// Category landing page, e.g. /jobs/category/mathematics-teacher.
//  • 404 unless the category has MORE than 5 live jobs (lib/landing.ts).
//  • Indexable only once an admin has written copy for it
//    (/admin/seo-pages, Categories tab); until then it renders but is
//    noindex and out of the sitemap, so a thin page never competes
//    with /jobs.
// ============================================================

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Briefcase, Clock, MapPin } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { Markdown } from "@/components/ui/Markdown"
import { getCategoryIndex, getCategoryLandingJobs, getLandingContent } from "@/lib/cache/landing"
import { categoryPath, MIN_JOBS_FOR_LANDING, stateDisplayName } from "@/lib/landing"
import { absoluteUrl, oneLine, SITE_NAME, toJsonLdString, trimText } from "@/lib/site"
import { formatSalaryRange } from "@/lib/utils"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

const hasCopy = (c: { intro: string | null; body: string | null } | null) =>
  !!c && (!!(c.intro || "").trim() || !!(c.body || "").trim())

async function resolve(slug: string) {
  const index = await getCategoryIndex()
  const cat = index[slug]
  if (!cat || cat.count < MIN_JOBS_FOR_LANDING) return null
  return { slug, name: cat.name, count: cat.count, ids: cat.ids, index }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: raw } = await params
  const found = await resolve(raw)
  if (!found) return { title: "Page not found", robots: { index: false, follow: false } }

  const { slug, name, count } = found
  const content = await getLandingContent(slug, "category")

  const title = content?.title?.trim() || `${name} Jobs in Nigeria – ${count} Open Vacancies`
  const description = trimText(
    oneLine(
      content?.meta_description ||
        `Browse ${count} current ${name.toLowerCase()} jobs in Nigeria. Apply directly to schools on ${SITE_NAME}.`
    ),
    160
  )
  const url = absoluteUrl(categoryPath(slug))

  return {
    title,
    description,
    alternates: { canonical: categoryPath(slug) },
    robots: hasCopy(content) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function CategoryJobsPage({ params }: Props) {
  const { slug: raw } = await params
  const found = await resolve(raw)
  if (!found) notFound()

  const { slug, name, count, ids, index } = found
  const [jobs, content] = await Promise.all([getCategoryLandingJobs(ids), getLandingContent(slug, "category")])

  // Where these jobs are, and the other live categories — real internal links.
  const stateCounts = new Map<string, number>()
  for (const j of jobs) if (j.school_state) stateCounts.set(j.school_state, (stateCounts.get(j.school_state) || 0) + 1)
  const topStates = [...stateCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const otherCategories = Object.entries(index)
    .filter(([s, c]) => s !== slug && c.count >= MIN_JOBS_FOR_LANDING)
    .sort((a, b) => b[1].count - a[1].count)

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Jobs", href: "/jobs" },
    { name, href: undefined },
  ]
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Jobs", item: absoluteUrl("/jobs") },
      { "@type": "ListItem", position: 3, name: `${name} Jobs`, item: absoluteUrl(categoryPath(slug)) },
    ],
  }
  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${name} Jobs in Nigeria`,
    url: absoluteUrl(categoryPath(slug)),
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{name} Jobs in Nigeria</h1>
          <p className="text-gray-500">
            {count} open {name.toLowerCase()} vacancies across Nigeria, updated daily.
          </p>
          {content?.intro?.trim() && <Markdown className="mt-5">{content.intro}</Markdown>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {topStates.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Where {name.toLowerCase()} jobs are</h2>
            <div className="flex flex-wrap gap-2">
              {topStates.map(([st, n]) => (
                <span key={st} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg">
                  {stateDisplayName(st)} <span className="text-gray-400">({n})</span>
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

        {otherCategories.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Other job categories</h2>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map(([s, c]) => (
                <Link key={s} href={categoryPath(s)} className="px-3 py-1.5 bg-white border border-gray-200 text-ink-600 hover:border-ink-300 text-sm rounded-lg">
                  {c.name} ({c.count})
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
