"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  MapPin,
  Briefcase,
  Star,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Globe,
  Phone,
  Building2,
  Clock,
  Users,
  ChevronRight,
  Home,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────

interface SchoolProfile {
  id: string
  school_name: string
  school_type: string
  school_levels: string[]
  state: string
  lga: string
  address: string
  website: string | null
  contact_name: string
  contact_role: string
  contact_phone: string
  logo_url: string | null
  is_verified: boolean
  created_at: string
}

interface ActiveJob {
  id: string
  title: string
  subject: string
  teaching_levels: string[]
  employment_type: string
  salary_min: number
  salary_max: number
  accommodation_offered: boolean
  quiz_enabled: boolean
  deadline: string
  created_at: string
}

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
  }
  return map[level] || level
}

function getDaysLeft(deadline: string) {
  return Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ─── Job Card ─────────────────────────────────────────────────

function JobCard({ job }: { job: ActiveJob }) {
  const daysLeft = getDaysLeft(job.deadline)

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="p-4 border border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/30 transition group">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-semibold text-gray-900 text-sm group-hover:text-green-600 transition-colors">
              {job.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{job.subject}</p>
          </div>
          <span
            className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${
              job.employment_type === "full-time"
                ? "bg-green-100 text-green-700"
                : job.employment_type === "part-time"
                ? "bg-purple-100 text-purple-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {job.employment_type}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {job.teaching_levels.map((level) => (
            <span
              key={level}
              className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded uppercase"
            >
              {level}
            </span>
          ))}
          {job.quiz_enabled && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Quiz
            </span>
          )}
          {job.accommodation_offered && (
            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded flex items-center gap-1">
              <Home className="h-3 w-3" />
              Accommodation
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(job.salary_min)} – {formatCurrency(job.salary_max)}
            <span className="text-xs font-normal text-gray-400">/mo</span>
          </p>
          <p
            className={`text-xs ${
              daysLeft <= 3 ? "text-red-500" : "text-gray-400"
            }`}
          >
            {daysLeft <= 0
              ? "Closed"
              : daysLeft === 1
              ? "Closes tomorrow"
              : `${daysLeft} days left`}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

// ─── Main Page ────────────────────────────────────────────────

export default function SchoolProfilePage() {
  const params = useParams()
  const schoolId = params.id as string
  const isOwnProfile = schoolId === "me"

  const [school, setSchool] = useState<SchoolProfile | null>(null)
  const [jobs, setJobs] = useState<ActiveJob[]>([])
  const [stats, setStats] = useState({ total_jobs: 0, total_hired: 0, active_jobs: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const url = isOwnProfile ? "/api/school/profile" : `/api/schools/${schoolId}`
        const response = await fetch(url)
        if (!response.ok) throw new Error("School not found")
        const data = await response.json()
        setSchool(data.school)
        setJobs(data.active_jobs || [])
        setStats(data.stats || { total_jobs: 0, total_hired: 0, active_jobs: 0 })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load school")
      } finally {
        setIsLoading(false)
      }
    }
    if (schoolId) fetchSchool()
  }, [schoolId, isOwnProfile])

  // Error state — only shown after fetch completes with an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">School Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link href="/jobs">
            <Button className="bg-blue-700 hover:bg-blue-800 text-white">Browse Jobs</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Back + Edit */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {isOwnProfile && (
            <Link href="/dashboard/school/settings">
              <Button
                size="sm"
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                Edit School Profile
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-5 flex-wrap">

                {/* Logo */}
                <div className="flex-shrink-0">
                  {isLoading ? (
                    <Skeleton className="w-20 h-20 rounded-xl" />
                  ) : school?.logo_url ? (
                    <img
                      src={school.logo_url}
                      alt={school.school_name}
                      className="w-20 h-20 rounded-xl object-contain border-2 border-gray-100 p-2"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center border-2 border-blue-50">
                      <span className="text-blue-700 font-black text-xl">
                        {getInitials(school?.school_name ?? "")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-56" />
                      <Skeleton className="h-4 w-32" />
                      <div className="flex gap-2 mt-3">
                        <Skeleton className="h-6 w-16 rounded-lg" />
                        <Skeleton className="h-6 w-16 rounded-lg" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 flex-wrap mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">
                          {school?.school_name}
                        </h1>
                        {school?.is_verified && (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium mt-1">
                            <Star className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mb-3">
                        {getSchoolTypeLabel(school?.school_type ?? "")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {school?.school_levels.map((level) => (
                          <span
                            key={level}
                            className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium"
                          >
                            {getLevelLabel(level)}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {isLoading ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                      <Skeleton className="h-8 w-8 rounded-lg mx-auto mb-2" />
                      <Skeleton className="h-7 w-10 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { label: "Jobs Posted",     value: stats.total_jobs,  icon: Briefcase,    color: "text-blue-600",   bg: "bg-blue-50" },
                    { label: "Active Now",       value: stats.active_jobs, icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50" },
                    { label: "Teachers Hired",  value: stats.total_hired, icon: Users,        color: "text-purple-600", bg: "bg-purple-50" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                      <div className={`inline-flex p-2 rounded-lg mb-2 ${stat.bg}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* School Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4 text-lg">School Information</h2>
              {isLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Address</p>
                      <p className="text-sm text-gray-700">
                        {school?.address}<br />
                        {school?.lga}, {school?.state} State
                      </p>
                    </div>
                  </div>

                  {school?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Website</p>
                        <a
                          href={school.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {school.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">School Type</p>
                      <p className="text-sm text-gray-700">{getSchoolTypeLabel(school?.school_type ?? "")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Member Since</p>
                      <p className="text-sm text-gray-700">
                        {school?.created_at && new Date(school.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Jobs */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 text-lg">
                  Current Vacancies
                  {!isLoading && jobs.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">({jobs.length})</span>
                  )}
                </h2>
                <Link
                  href={school ? `/jobs?school=${school.id}` : "/jobs"}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="p-4 border border-gray-100 rounded-xl space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-10 rounded" />
                        <Skeleton className="h-5 w-10 rounded" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
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

            {/* Contact Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>

              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <div className="space-y-3">
                    <div>
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ) : (
                <>
                  {school?.is_verified && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <Star className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <p className="text-xs text-blue-700 font-medium">
                        Verified School — Identity confirmed
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 mb-5">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Contact Person</p>
                      <p className="text-sm font-semibold text-gray-900">{school?.contact_name}</p>
                      <p className="text-xs text-gray-500">{school?.contact_role}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{school?.contact_phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{school?.lga}, {school?.state}</span>
                    </div>
                  </div>

                  {jobs.length > 0 && (
                    <Link href={`/jobs?school=${school?.id}`}>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4" />
                        View All Jobs
                      </Button>
                    </Link>
                  )}

                  {isOwnProfile && (
                    <Link href="/dashboard/school/post-job">
                      <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 text-sm mt-3">
                        <Briefcase className="h-4 w-4" />
                        Post a Job
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Register CTA for teachers */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-green-900 mb-1">
                Looking for a teaching job?
              </p>
              <p className="text-xs text-green-600 mb-3">
                Create a free profile and apply to this school and others.
              </p>
              <Link href="/register/teacher">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white w-full"
                >
                  Create Free Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}