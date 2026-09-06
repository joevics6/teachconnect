// Server component — renders with full SEO metadata, JSON-LD schemas,
// breadcrumbs, and no client-side loading state. Canonical URL is the
// school's slug; visiting by raw id (old links, or callers that
// haven't been updated) 308-redirects to the slug URL so search
// engines consolidate to one canonical page instead of treating the
// two as duplicate content.
import { Metadata } from "next"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import {
  MapPin, Briefcase, Star, CheckCircle2, ArrowLeft, Globe, Phone,
  Building2, Clock, Users, ChevronRight, Home, BookOpen, DollarSign,
  Lock, LogIn,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getPublicSchoolProfile, getSchoolContactInfo } from "@/lib/cache/schools"
import { formatSalaryRange, formatCurrency, getInitials } from "@/lib/utils"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://classhire.jobmeter.app"

// ─── Helpers ─────────────────────────────────────────────────

function getSchoolTypeLabel(type: string) {
  const map: Record<string, string> = {
    private: "Private School",
    public: "Public School",
    international: "International School",
    missionary: "Missionary School",
  }
  return map[type] || type
}

function getLevelLabel(level: string) {
  const map: Record<string, string> = {
    nursery: "Nursery",
    primary: "Primary",
    jss: "JSS",
    sss: "SSS",
    tertiary: "Tertiary",
    non_teaching: "Non-Teaching Staff",
  }
  return map[level] || level
}

function getDaysLeft(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// ─── Data fetching ────────────────────────────────────────────

async function getSchoolData(slugOrId: string) {
  const result = await getPublicSchoolProfile(slugOrId)
  if (!result) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = !!(user && user.id === result.school.user_id)
  const contact = user ? await getSchoolContactInfo(result.school.id) : null

  return { ...result, viewer: { isSignedIn: !!user, isOwnProfile }, contact }
}

// ─── generateMetadata ─────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const data = await getSchoolData(slug)
  if (!data) return { title: "School Not Found — ClassHire" }

  const { school, active_jobs } = data
  const location = [school.town, school.lga, school.state].filter(Boolean).join(", ")
  const title = `${school.school_name} — Teaching Jobs & Profile in ${school.lga}, ${school.state} | ClassHire`
  const description =
    school.long_description?.slice(0, 155) ||
    school.about?.slice(0, 155) ||
    `${school.school_name} is a ${getSchoolTypeLabel(school.school_type).toLowerCase()} in ${location}. ${active_jobs.length > 0 ? `${active_jobs.length} teaching job${active_jobs.length !== 1 ? "s" : ""} currently open.` : "See current teaching vacancies on ClassHire."}`
  const url = `${SITE_URL}/schools/${school.slug}`
  const image = school.logo_url || `${SITE_URL}/og-default.png`

  // Thin pages (no AI/manually written long-form content yet) shouldn't
  // be indexed — they'd read as low-value/duplicate to search engines.
  // Once a school fills this in (dashboard/school/edit-profile), the
  // page becomes indexable automatically on next crawl.
  const hasSubstantialContent = !!school.long_description

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "ClassHire Nigeria",
      images: [{ url: image, width: 1200, height: 630, alt: school.school_name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
    robots: hasSubstantialContent ? undefined : { index: false, follow: true },
  }
}

// ─── JSON-LD Schemas ──────────────────────────────────────────

function SchoolSchema({ school, activeJobCount }: { school: NonNullable<Awaited<ReturnType<typeof getSchoolData>>>["school"]; activeJobCount: number }) {
  const url = `${SITE_URL}/schools/${school.slug}`
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: school.school_name,
    url,
    ...(school.logo_url ? { logo: school.logo_url, image: school.logo_url } : {}),
    ...(school.website ? { sameAs: [school.website] } : {}),
    description: school.long_description || school.about || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: school.address || undefined,
      addressLocality: [school.town, school.lga].filter(Boolean).join(", ") || school.lga,
      addressRegion: school.state,
      addressCountry: "NG",
    },
    ...(activeJobCount > 0 ? { numberOfEmployees: undefined } : {}),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

function FAQSchema({ faq }: { faq: { question: string; answer: string }[] }) {
  if (!faq?.length) return null
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

function BreadcrumbSchema({ school }: { school: { school_name: string; slug: string } }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Schools", item: `${SITE_URL}/jobs` },
      { "@type": "ListItem", position: 3, name: school.school_name, item: `${SITE_URL}/schools/${school.slug}` },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

// ─── Breadcrumb UI ────────────────────────────────────────────

function Breadcrumbs({ schoolName }: { schoolName: string }) {
  return (
    <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200 px-4 py-3">
      <ol className="max-w-5xl mx-auto flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <li><Link href="/" className="hover:text-ink-600 transition">Home</Link></li>
        <li className="text-gray-300">/</li>
        <li><Link href="/jobs" className="hover:text-ink-600 transition">Teaching Jobs</Link></li>
        <li className="text-gray-300">/</li>
        <li className="text-gray-900 font-medium truncate max-w-xs" aria-current="page">{schoolName}</li>
      </ol>
    </nav>
  )
}

// ─── Job Card ─────────────────────────────────────────────────

function JobCard({ job }: { job: { id: string; title: string; subject: string; teaching_levels: string[]; employment_type: string; salary_min: number; salary_max: number; accommodation_offered: boolean; quiz_enabled: boolean; deadline: string } }) {
  const daysLeft = getDaysLeft(job.deadline)
  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="p-4 border border-gray-100 rounded-xl hover:border-ink-200 hover:bg-ink-50/30 transition group">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-ink-600 transition-colors">{job.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{job.subject}</p>
          </div>
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${
            job.employment_type === "full-time" ? "bg-ink-100 text-ink-700"
              : job.employment_type === "part-time" ? "bg-purple-100 text-purple-700"
              : "bg-orange-100 text-orange-700"
          }`}>
            {job.employment_type}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {job.teaching_levels.map((level) => (
            <span key={level} className="px-2 py-0.5 bg-ink-50 text-ink-600 text-xs rounded uppercase">
              {level === "non_teaching" ? "Staff" : level}
            </span>
          ))}
          {job.quiz_enabled && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded flex items-center gap-1">
              <BookOpen className="h-3 w-3" />Quiz
            </span>
          )}
          {job.accommodation_offered && (
            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded flex items-center gap-1">
              <Home className="h-3 w-3" />Accommodation
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">
            {formatSalaryRange(job.salary_min, job.salary_max)}
            {(job.salary_min || job.salary_max) ? <span className="text-xs font-normal text-gray-400">/mo</span> : null}
          </p>
          <p className={`text-xs ${daysLeft <= 3 ? "text-red-500" : "text-gray-400"}`}>
            {daysLeft <= 0 ? "Closed" : daysLeft === 1 ? "Closes tomorrow" : `${daysLeft} days left`}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default async function SchoolProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getSchoolData(slug)
  if (!data) notFound()

  const { school, active_jobs: jobs, stats, viewer, contact } = data

  // Reached via a non-canonical identifier (raw id, or an old slug
  // after a rename) — 308 to the real one so search engines and
  // future visits consolidate onto a single URL.
  if (school.slug && school.slug !== slug) {
    permanentRedirect(`/schools/${school.slug}`)
  }

  return (
    <>
      <SchoolSchema school={school} activeJobCount={jobs.length} />
      <FAQSchema faq={school.faq} />
      <BreadcrumbSchema school={school} />
      <Breadcrumbs schoolName={school.school_name} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero band */}
        <div className="bg-gradient-to-br from-ink-700 to-ink-800 text-white">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-ink-100 hover:text-white mb-6 transition">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Link>

            <div className="flex items-start gap-5 flex-wrap">
              <div className="flex-shrink-0">
                {school.logo_url ? (
                  <img
                    src={school.logo_url}
                    alt={school.school_name}
                    className="w-20 h-20 rounded-xl object-contain bg-white p-2 border-2 border-white/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                    <span className="text-white font-black text-xl">{getInitials(school.school_name)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">{school.school_name}</h1>
                  {school.is_verified ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-white/15 text-white text-xs rounded-full font-medium mt-1.5">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified School
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-white/10 text-ink-100 text-xs rounded-full font-medium mt-1.5">
                      Not Verified
                    </span>
                  )}
                </div>
                <p className="text-ink-100 text-sm mb-1">{getSchoolTypeLabel(school.school_type)}</p>
                <p className="flex items-center gap-1.5 text-ink-100 text-sm mb-3">
                  <MapPin className="h-3.5 w-3.5" />
                  {[school.town, school.lga, school.state].filter(Boolean).join(", ")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {school.school_levels.map((level: string) => (
                    <span key={level} className="px-2.5 py-1 bg-white/10 text-white text-xs rounded-lg font-medium">
                      {getLevelLabel(level)}
                    </span>
                  ))}
                </div>
              </div>

              {viewer.isOwnProfile && (
                <Link href="/dashboard/school/edit-profile" className="flex-shrink-0">
                  <Button size="sm" className="bg-white text-ink-700 hover:bg-ink-50">
                    Edit School Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-5">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Jobs Posted", value: stats.total_jobs, icon: Briefcase, color: "text-ink-600", bg: "bg-ink-50" },
                  { label: "Active Now", value: stats.active_jobs, icon: CheckCircle2, color: "text-ink-600", bg: "bg-ink-50" },
                  { label: "Teachers Hired", value: stats.total_hired, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className={`inline-flex p-2 rounded-lg mb-2 ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* About — long-form SEO content leads; falls back to the
                  short `about` field for schools that haven't generated
                  this yet */}
              {(school.long_description || school.about) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-bold text-gray-900 mb-3 text-lg">About {school.school_name}</h2>
                  <div className="text-sm text-gray-600 leading-relaxed space-y-3">
                    {(school.long_description || school.about || "")
                      .split(/\n{2,}/)
                      .map((para: string, i: number) => <p key={i}>{para}</p>)}
                  </div>
                </div>
              )}

              {/* School Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-4 text-lg">School Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Address</p>
                      <p className="text-sm text-gray-700">
                        {school.address && <>{school.address}<br /></>}
                        {[school.town, school.lga].filter(Boolean).join(", ")}, {school.state} State
                      </p>
                    </div>
                  </div>

                  {school.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Website</p>
                        <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-600 hover:underline">
                          {school.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">School Type</p>
                      <p className="text-sm text-gray-700">{getSchoolTypeLabel(school.school_type)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Member Since</p>
                      <p className="text-sm text-gray-700">
                        {new Date(school.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {school.school_category && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">School Category</p>
                        <p className="text-sm text-gray-700 capitalize">{school.school_category === "both" ? "Day & Boarding" : school.school_category}</p>
                      </div>
                    </div>
                  )}

                  {school.student_population && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Student Population</p>
                        <p className="text-sm text-gray-700">{school.student_population.toLocaleString()} students</p>
                      </div>
                    </div>
                  )}

                  {(school.salary_range_min || school.salary_range_max) && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Salary Range (Monthly)</p>
                        <p className="text-sm text-gray-700">
                          {formatCurrency(school.salary_range_min ?? 0)} – {formatCurrency(school.salary_range_max ?? 0)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Curriculum & Benefits */}
              {(school.curriculum?.length > 0 || school.benefits?.length > 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                  {school.curriculum?.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Curriculum</h3>
                      <div className="flex flex-wrap gap-2">
                        {school.curriculum.map((c: string) => (
                          <span key={c} className="px-3 py-1 bg-ink-50 text-ink-700 text-xs rounded-full font-medium">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {school.benefits?.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Staff Benefits</h3>
                      <div className="flex flex-wrap gap-2">
                        {school.benefits.map((b: string) => (
                          <span key={b} className="px-3 py-1 bg-ink-50 text-ink-700 text-xs rounded-full font-medium">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FAQ — plain <details>/<summary>, no JS needed, fully
                  crawlable, matches the FAQPage schema above */}
              {school.faq?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-bold text-gray-900 mb-4 text-lg">Frequently Asked Questions</h2>
                  <div className="divide-y divide-gray-100">
                    {school.faq.map((item: { question: string; answer: string }, i: number) => (
                      <details key={i} className="group py-3 first:pt-0 last:pb-0">
                        <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-900 list-none">
                          {item.question}
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-90" />
                        </summary>
                        <p className="text-sm text-gray-600 leading-relaxed mt-2">{item.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Jobs */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-gray-900 text-lg">
                    Current Vacancies
                    {jobs.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({jobs.length})</span>}
                  </h2>
                  <Link href={`/jobs?school=${school.id}`} className="text-sm text-ink-600 hover:underline flex items-center gap-1">
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No active vacancies at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => <JobCard key={job.id} job={job} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>

                {school.is_verified && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-ink-50 border border-ink-100 rounded-xl">
                    <Star className="h-4 w-4 text-ink-600 flex-shrink-0" />
                    <p className="text-xs text-ink-700 font-medium">Verified School — Identity confirmed</p>
                  </div>
                )}

                {contact ? (
                  <div className="space-y-4 mb-5">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Contact Person</p>
                      <p className="text-sm font-semibold text-gray-900">{contact.contact_name}</p>
                      <p className="text-xs text-gray-500">{contact.contact_role}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{contact.contact_phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{[school.town, school.lga].filter(Boolean).join(", ")}, {school.state}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{[school.town, school.lga].filter(Boolean).join(", ")}, {school.state}</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <Lock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500">
                        Sign in to view the school&apos;s contact person and phone number.
                      </p>
                    </div>
                    <Link href={`/login?next=/schools/${school.slug}`} className="block mt-2">
                      <Button variant="outline" size="sm" className="w-full flex items-center gap-1.5 text-xs">
                        <LogIn className="h-3.5 w-3.5" />
                        Sign In
                      </Button>
                    </Link>
                  </div>
                )}

                {jobs.length > 0 && (
                  <Link href={`/jobs?school=${school.id}`}>
                    <Button className="w-full bg-ink-600 hover:bg-ink-700 text-white flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4" />
                      View All Jobs
                    </Button>
                  </Link>
                )}

                {viewer.isOwnProfile && (
                  <Link href="/dashboard/school/post-job">
                    <Button className="w-full bg-ink-700 hover:bg-ink-800 text-white flex items-center gap-2 text-sm mt-3">
                      <Briefcase className="h-4 w-4" />
                      Post a Job
                    </Button>
                  </Link>
                )}
              </div>

              <div className="bg-ink-50 border border-ink-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-ink-900 mb-1">Looking for a teaching job?</p>
                <p className="text-xs text-ink-600 mb-3">Create a free profile and apply to this school and others.</p>
                <Link href="/register/teacher">
                  <Button size="sm" className="bg-ink-600 hover:bg-ink-700 text-white w-full">
                    Create Free Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
