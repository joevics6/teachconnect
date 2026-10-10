import { getJobById } from "@/lib/cache/jobs"
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

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJobById(id)
  if (!job) return ogCard({ kicker: "Teaching job", title: "Teaching jobs in Nigeria" })

  const confidential = isConfidentialSchool(job.school_name)
  const where = [job.school_lga, job.school_state].filter(Boolean).join(", ")
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
