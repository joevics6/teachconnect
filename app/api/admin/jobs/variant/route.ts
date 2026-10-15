// ============================================================
// app/api/admin/jobs/variant/route.ts
// POST — admin-only. For a posting split into several subject jobs,
// writes the unique title, description, qualifications and SEO
// content (accordions, responsibilities, meta description) for ONE
// of them, so each job page has original text. The admin "New Job"
// page calls this once per split and saves the result with the job.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"
import { generateJobVariant, type JobVariantInput } from "@/lib/job-seo"

export const maxDuration = 60

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)
const num = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null)
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [])

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const b = await request.json()
    const subject = str(b.subject)
    if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 })

    const input: JobVariantInput = {
      title: str(b.title) ?? subject,
      subject,
      teaching_levels: strList(b.teaching_levels),
      employment_type: str(b.employment_type),
      salary_min: num(b.salary_min),
      salary_max: num(b.salary_max),
      accommodation_offered: Boolean(b.accommodation_offered),
      benefits: strList(b.benefits),
      description: str(b.description),
      required_qualifications: str(b.required_qualifications),
      preferred_qualifications: str(b.preferred_qualifications),
      school_name: str(b.school?.school_name),
      school_type: str(b.school?.school_type),
      state: str(b.school?.state),
      lga: str(b.school?.lga),
      is_anonymous: Boolean(b.school?.is_anonymous),
      raw_post: str(b.raw_post)?.slice(0, 6000) ?? null,
      sibling_subjects: strList(b.sibling_subjects).filter((s) => s !== subject).slice(0, 30),
    }

    const variant = await generateJobVariant(input)
    return NextResponse.json({ variant })
  } catch (err) {
    console.error("Admin job variant error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate" },
      { status: 500 }
    )
  }
}
