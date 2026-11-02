import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { ToolRenderer } from "@/components/tools"
import { getTool, TOOLS } from "@/lib/tools/registry"
import { absoluteUrl, SITE_NAME, toJsonLdString } from "@/lib/site"

export const dynamicParams = false
export const generateStaticParams = () => TOOLS.map((t) => ({ slug: t.slug }))

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getTool((await params).slug)
  if (!tool) return {}
  const url = absoluteUrl(`/tools/${tool.slug}`)
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: { title: tool.metaTitle, description: tool.metaDescription, url, siteName: SITE_NAME, type: "website" },
  }
}

const CTA = {
  teachers: { text: "Looking for a teaching job?", link: "/jobs", label: "Browse teaching jobs in Nigeria" },
  schools: { text: "Hiring teachers for your school?", link: "/talent", label: "Find teachers on ClassHire" },
  parents: { text: "Choosing a school for your child?", link: "/schools", label: "Browse schools" },
} as const

export default async function ToolPage({ params }: Props) {
  const tool = getTool((await params).slug)
  if (!tool) notFound()

  const url = absoluteUrl(`/tools/${tool.slug}`)
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url,
    description: tool.metaDescription,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    inLanguage: "en-NG",
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
  }
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Free Tools", item: absoluteUrl("/tools") },
      { "@type": "ListItem", position: 3, name: tool.name, item: url },
    ],
  }
  const cta = CTA[tool.audience]
  const related = TOOLS.filter((t) => t.slug !== tool.slug).slice(0, 4)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(crumbLd) }} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Free Tools", href: "/tools" }, { name: tool.name }]} className="mb-4" />

        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{tool.h1}</h1>
        <div className="mt-3 space-y-3 text-gray-700">
          {tool.intro.map((p, i) => <p key={i}>{p}</p>)}
        </div>

        <div className="mt-6"><ToolRenderer slug={tool.slug} /></div>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900">How to use the {tool.name}</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-gray-700">
            {tool.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </section>

        {tool.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="text-xl font-bold text-gray-900">{s.heading}</h2>
            <div className="mt-3 space-y-3 text-gray-700">{s.body.map((p, i) => <p key={i}>{p}</p>)}</div>
          </section>
        ))}

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">Frequently asked questions</h2>
          <div className="mt-3 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
            {tool.faqs.map((f) => (
              <details key={f.q} className="group px-4 py-3">
                <summary className="cursor-pointer list-none font-medium text-gray-900">{f.q}</summary>
                <p className="mt-2 text-sm text-gray-700">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <aside className="mt-10 flex flex-col items-start justify-between gap-3 rounded-xl bg-ink-50 p-5 sm:flex-row sm:items-center">
          <p className="font-medium text-ink-700">{cta.text}</p>
          <Link href={cta.link} className="inline-flex items-center gap-1.5 rounded-lg bg-ink-600 px-4 py-2 text-sm font-medium text-white hover:bg-ink-700">
            {cta.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-gray-900">More free tools</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {related.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tools/${t.slug}`} className="block rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-ink-700 hover:bg-gray-50">{t.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
