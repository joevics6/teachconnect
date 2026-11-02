import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { TOOLS } from "@/lib/tools/registry"
import { absoluteUrl, SITE_NAME } from "@/lib/site"

const TITLE = "Free Tools for Nigerian Teachers and Schools"
const DESCRIPTION =
  "Free tools for Nigerian teachers, schools and parents: lesson note generator, CV and application letter makers, scheme of work, report card comments and more."

// A page that lists one or two tools is thin; keep it out of search until
// there are enough to be a useful index.
const INDEXABLE = TOOLS.length >= 3

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools" },
  robots: INDEXABLE ? undefined : { index: false, follow: true },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/tools"), siteName: SITE_NAME, type: "website" },
}

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Free Tools" }]} className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Free Tools for Nigerian Teachers and Schools</h1>
      <p className="mt-3 text-gray-700">
        Free generators and calculators built for the Nigerian classroom. No sign-up needed.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <li key={t.slug}>
            <Link href={`/tools/${t.slug}`} className="block h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-ink-300 hover:shadow">
              <h2 className="font-semibold text-gray-900">{t.name}</h2>
              <p className="mt-1 text-sm text-gray-600">{t.blurb}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ink-600">Open tool <ArrowRight className="h-4 w-4" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
