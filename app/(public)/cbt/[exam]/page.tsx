import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { getExamBySlug, getExamSubjects } from "@/lib/cache/cbt"
import { CBT_DISCLAIMER } from "@/lib/cbt"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { absoluteUrl, SITE_NAME } from "@/lib/site"

export const revalidate = 300

type Props = { params: Promise<{ exam: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam: slug } = await params
  const exam = await getExamBySlug(slug)
  if (!exam) return { title: "Not found", robots: { index: false } }
  const subjects = await getExamSubjects(exam.id)
  const title = `${exam.name} CBT Practice – Free Past Questions by Subject`
  const description = `Practise ${exam.name} past questions online in a timed CBT. Pick a subject, get instant scores and explanations. Free, no sign-up.`
  return {
    title,
    description,
    alternates: { canonical: `/cbt/${exam.slug}` },
    robots: subjects.length === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: absoluteUrl(`/cbt/${exam.slug}`), siteName: SITE_NAME, type: "website" },
  }
}

export default async function CbtExamPage({ params }: Props) {
  const { exam: slug } = await params
  const exam = await getExamBySlug(slug)
  if (!exam) notFound()
  const subjects = await getExamSubjects(exam.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Breadcrumbs className="mb-4" items={[{ name: "Home", href: "/" }, { name: "CBT Practice", href: "/cbt" }, { name: exam.name }]} />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.name} CBT Practice</h1>
          <p className="text-gray-500 max-w-2xl">{exam.description} Choose a subject to start.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {subjects.length === 0 ? (
          <p className="text-center text-gray-500 py-16">Questions for this exam are being added. Please check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/cbt/${exam.slug}/${s.slug}`}
                className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-ink-300 hover:shadow-sm transition flex items-center justify-between gap-3"
              >
                <div>
                  <h2 className="font-semibold text-gray-900">{s.name}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {s.question_count} questions{s.years.length > 0 ? ` · ${s.years[s.years.length - 1]}–${s.years[0]}` : ""}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-ink-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-10 max-w-3xl">{CBT_DISCLAIMER}</p>
      </div>
    </div>
  )
}
