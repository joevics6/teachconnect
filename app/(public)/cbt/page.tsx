import type { Metadata } from "next"
import Link from "next/link"
import { GraduationCap, ChevronRight } from "lucide-react"
import { getExamsWithQuestions } from "@/lib/cache/cbt"
import { CBT_DISCLAIMER } from "@/lib/cbt"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { absoluteUrl, SITE_NAME } from "@/lib/site"

export const revalidate = 300

const TITLE = "Free CBT Practice – JAMB, WAEC, NECO & Junior WAEC Past Questions"
const DESCRIPTION =
  "Practise past questions in a timed computer-based test. Choose your exam and subject, get instant scores, answer explanations and a weak-topic report. Free, no sign-up."

export async function generateMetadata(): Promise<Metadata> {
  const exams = await getExamsWithQuestions()
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/cbt" },
    // An empty practice index is a thin page: keep it out of search until there are questions.
    robots: exams.length === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/cbt"), siteName: SITE_NAME, type: "website" },
  }
}

export default async function CbtIndexPage() {
  const exams = await getExamsWithQuestions()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Breadcrumbs className="mb-4" items={[{ name: "Home", href: "/" }, { name: "CBT Practice" }]} />
          <div className="inline-flex items-center gap-2 text-ink-600 mb-3">
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">CBT Practice</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Free CBT Practice for Nigerian Exams</h1>
          <p className="text-gray-500 max-w-2xl">
            Practise past questions the way the real computer-based test works: timed, one question at a time, with instant scoring and explanations.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {exams.length === 0 ? (
          <p className="text-center text-gray-500 py-16">Practice questions are being added. Please check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {exams.map((e) => (
              <Link
                key={e.id}
                href={`/cbt/${e.slug}`}
                className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-ink-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{e.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{e.description}</p>
                    <p className="text-xs text-gray-400 mt-3">
                      {e.subject_count} subject{e.subject_count === 1 ? "" : "s"} · {e.question_count} questions
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-ink-500 flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-10 max-w-3xl">{CBT_DISCLAIMER}</p>
      </div>
    </div>
  )
}
