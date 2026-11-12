import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getExamBySlug, getExamSubjects } from "@/lib/cache/cbt"
import { CBT_DISCLAIMER } from "@/lib/cbt"
import { CbtRunner } from "@/components/cbt/CbtRunner"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { absoluteUrl, SITE_NAME } from "@/lib/site"

export const revalidate = 300

type Props = { params: Promise<{ exam: string; subject: string }> }

async function load(examSlug: string, subjectSlug: string) {
  const exam = await getExamBySlug(examSlug)
  if (!exam) return null
  const subject = (await getExamSubjects(exam.id)).find((s) => s.slug === subjectSlug)
  return subject ? { exam, subject } : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam: e, subject: s } = await params
  const found = await load(e, s)
  if (!found) return { title: "Not found", robots: { index: false } }
  const { exam, subject } = found
  const title = `${exam.short_name} ${subject.name} CBT Practice – Free Past Questions`
  const description = `Practise ${exam.name} ${subject.name} past questions in a timed CBT. ${subject.question_count} questions with instant scoring and explanations. Free.`
  return {
    title,
    description,
    alternates: { canonical: `/cbt/${exam.slug}/${subject.slug}` },
    openGraph: { title, description, url: absoluteUrl(`/cbt/${exam.slug}/${subject.slug}`), siteName: SITE_NAME, type: "website" },
  }
}

export default async function CbtSubjectPage({ params }: Props) {
  const { exam: e, subject: s } = await params
  const found = await load(e, s)
  if (!found) notFound()
  const { exam, subject } = found

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          className="mb-5"
          items={[
            { name: "Home", href: "/" },
            { name: "CBT Practice", href: "/cbt" },
            { name: exam.name, href: `/cbt/${exam.slug}` },
            { name: subject.name },
          ]}
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {exam.short_name} {subject.name} CBT Practice
        </h1>
        <p className="text-gray-500 mb-6">
          {subject.question_count} past questions. Choose how many to answer, then start the test.
        </p>

        <CbtRunner
          examSlug={exam.slug}
          subjectSlug={subject.slug}
          examName={exam.name}
          subjectName={subject.name}
          total={subject.question_count}
          years={subject.years}
          defaultCount={exam.default_question_count}
        />

        <p className="text-xs text-gray-400 mt-10">{CBT_DISCLAIMER}</p>
      </div>
    </div>
  )
}
