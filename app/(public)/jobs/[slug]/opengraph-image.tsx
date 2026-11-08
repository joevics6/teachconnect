import { getJobById, getJobIdBySlug } from "@/lib/cache/jobs"
import { isUuid } from "@/lib/job-slug"
import { jobLocationText } from "@/lib/job-location"
import { isConfidentialSchool } from "@/lib/job-jsonld"
import { ogCard, OG_SIZE } from "@/lib/og-card"

export const alt = "Teaching job on ClassHire"
export const size = OG_SIZE
export const contentType = "image/png"
export const revalidate = 300

// The card font has no naira glyph, so spell the currency out ("NGN").
const n = (v: number) => v.toLocaleString("en-NG")
function salaryPill(min: number | null, max: number | null) {
  if (!min && !max) return null
  const range = min && max ? `${n(min)} – ${n(max)}` : min ? `${n(min)}+` : `Up to ${n(max!)}`
  return `NGN ${range} / month`
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const id = isUuid(slug) ? slug : await getJobIdBySlug(slug)
  const job = id ? await getJobById(id) : null
  if (!job || ["pending_approval", "rejected", "draft"].includes(job.status)) return ogCard({ kicker: "Teaching job", title: "Teaching jobs in Nigeria" })

  const confidential = isConfidentialSchool(job.school_name)
  const where = jobLocationText(job)
  return ogCard({
    kicker: "Teaching job",
    title: job.title,
    subtitle: [confidential ? null : job.school_name, where].filter(Boolean).join(" · "),
    pills: [
      job.employment_type ? job.employment_type.replace("-", " ") : null,
      salaryPill(job.salary_min, job.salary_max),
      job.accommodation_offered ? "Accommodation" : null,
    ],
  })
}
