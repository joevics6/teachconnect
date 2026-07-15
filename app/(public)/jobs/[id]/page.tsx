"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  MapPin,
  Briefcase,
  Clock,
  Home,
  Star,
  BookOpen,
  ChevronRight,
  Share2,
  Bookmark,
  CheckCircle2,
  Users,
  Calendar,
  Building2,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Job } from "@/types"

interface JobWithSchool extends Job {
  school_name: string
  school_type: string
  school_state: string
  school_lga: string
  school_logo_url: string | null
  school_is_verified: boolean
}

interface RelatedJob {
  id: string
  title: string
  school_name: string
  school_state: string
  salary_min: number
  salary_max: number
  employment_type: string
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobWithSchool | null>(null)
  const [relatedJobs, setRelatedJobs] = useState<RelatedJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        if (!response.ok) throw new Error("Job not found")
        const data = await response.json()
        setJob(data.job)
        setRelatedJobs(data.related || [])
        setIsSaved(data.is_saved || false)
        setHasApplied(data.has_applied || false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job")
      } finally {
        setIsLoading(false)
      }
    }
    if (jobId) fetchJob()
  }, [jobId])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/teacher/saved-jobs", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      })
      if (response.status === 401) {
        router.push(`/login?next=/jobs/${jobId}`)
        return
      }
      if (!response.ok) throw new Error("Failed to save job")
      setIsSaved(!isSaved)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
    }
  }

  const handleApply = () => {
    if (!job) return
    if (job.quiz_enabled) {
      router.push(`/quiz/${job.id}`)
    } else {
      router.push(`/apply/${job.id}`)
    }
  }

  const daysLeft = job
    ? Math.ceil(
        (new Date(job.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-ink-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Job Not Found
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {error || "This job listing may have been removed or closed."}
          </p>
          <Link href="/jobs">
            <Button className="bg-ink-600 hover:bg-ink-700 text-white">
              Browse All Jobs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Back */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Job Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                  {job.school_logo_url ? (
                    <img
                      src={job.school_logo_url}
                      alt={job.school_name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Building2 className="h-7 w-7 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 mb-1">
                        {job.title}
                      </h1>
                      <Link
                        href={`/schools/${job.school_id}`}
                        className="text-sm text-ink-600 hover:underline flex items-center gap-1"
                      >
                        {job.school_name}
                        {job.school_is_verified && (
                          <Star className="h-3.5 w-3.5 text-blue-500" />
                        )}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShare}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                        title="Share job"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-ink-500" />
                        ) : (
                          <Share2 className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`p-2 rounded-lg border transition ${
                          isSaved
                            ? "border-ink-200 bg-ink-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        title={isSaved ? "Unsave job" : "Save job"}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${
                            isSaved ? "text-ink-600 fill-ink-600" : "text-gray-500"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {job.is_featured && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Featured
                  </span>
                )}
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${
                    job.employment_type === "full-time"
                      ? "bg-ink-100 text-ink-700"
                      : job.employment_type === "part-time"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {job.employment_type}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                  {job.subject}
                </span>
                {job.teaching_levels.map((level) => (
                  <span
                    key={level}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium capitalize"
                  >
                    {level.toUpperCase()}
                  </span>
                ))}
                {job.quiz_enabled && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Quiz Required
                  </span>
                )}
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Monthly Salary</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(job.salary_min)} –{" "}
                    {formatCurrency(job.salary_max)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {job.school_lga}, {job.school_state}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Positions</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {job.positions} position{job.positions > 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Deadline</p>
                  <p
                    className={`text-sm font-semibold flex items-center gap-1 ${
                      daysLeft <= 3 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {daysLeft <= 0
                      ? "Closed"
                      : daysLeft === 1
                      ? "Tomorrow"
                      : `${daysLeft} days`}
                  </p>
                </div>
              </div>
            </div>

            {/* Quiz Notice */}
            {job.quiz_enabled && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 flex gap-4">
                <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg h-fit">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 mb-1">
                    This job requires a subject quiz
                  </h3>
                  <p className="text-sm text-purple-700 leading-relaxed">
                    Before your application reaches the school, you must complete
                    a {job.quiz_subjects?.length ? job.quiz_subjects.join(" + ") : job.subject} quiz
                    and score at least {job.quiz_pass_mark}%. The quiz takes approximately
                    15–20 minutes.
                  </p>
                  <p className="text-xs text-purple-500 mt-2">
                    You can only attempt this quiz once for this job posting.
                  </p>
                </div>
              </div>
            )}

            {/* Accommodation Notice */}
            {job.accommodation_offered && (
              <div className="bg-ink-50 border border-ink-200 rounded-xl p-5 flex gap-4">
                <div className="flex-shrink-0 p-2 bg-ink-100 rounded-lg h-fit">
                  <Home className="h-5 w-5 text-ink-600" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 mb-1">
                    Accommodation Included
                  </h3>
                  <p className="text-sm text-ink-700">
                    This school provides{" "}
                    <span className="font-medium capitalize">
                      {job.accommodation_type?.replace("-", " ")}
                    </span>{" "}
                    accommodation for the successful candidate. This is ideal
                    for teachers willing to relocate.
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4 text-lg">
                About This Role
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4 text-lg">
                Requirements
              </h2>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-ink-500" />
                  Required Qualifications
                </h3>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pl-6 mb-5">
                  {job.required_qualifications}
                </div>
                {job.preferred_qualifications && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Preferred Qualifications
                    </h3>
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pl-6">
                      {job.preferred_qualifications}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Benefits */}
            {job.benefits.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-4 text-lg">
                  Benefits & Perks
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map((benefit) => (
                    <span
                      key={benefit}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-50 text-ink-700 text-sm rounded-lg font-medium"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-4 text-lg">
                  Similar Jobs
                </h2>
                <div className="space-y-3">
                  {relatedJobs.map((related) => (
                    <Link
                      key={related.id}
                      href={`/jobs/${related.id}`}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-ink-200 hover:bg-ink-50 transition group"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-ink-600 transition-colors">
                          {related.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {related.school_name} • {related.school_state}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium text-gray-700 hidden sm:block">
                          {formatCurrency(related.salary_min)}+
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Apply Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <div className="text-center mb-5">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(job.salary_min)} –{" "}
                  {formatCurrency(job.salary_max)}
                </p>
                <p className="text-sm text-gray-500">per month</p>
              </div>

              {hasApplied ? (
                <div className="flex items-center justify-center gap-2 p-3 bg-ink-50 border border-ink-200 rounded-xl mb-4">
                  <CheckCircle2 className="h-5 w-5 text-ink-600" />
                  <p className="text-sm font-medium text-ink-700">
                    You have applied for this job
                  </p>
                </div>
              ) : daysLeft <= 0 ? (
                <div className="flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm font-medium text-red-600">
                    This job has closed
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleApply}
                  className="w-full bg-ink-600 hover:bg-ink-700 text-white mb-3 py-3 text-base"
                >
                  {job.quiz_enabled ? (
                    <>
                      <BookOpen className="h-5 w-5 mr-2" />
                      Take Quiz & Apply
                    </>
                  ) : (
                    "Apply Now"
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full flex items-center justify-center gap-2 ${
                  isSaved ? "border-ink-300 text-ink-600" : ""
                }`}
              >
                <Bookmark
                  className={`h-4 w-4 ${isSaved ? "fill-ink-600" : ""}`}
                />
                {isSaved ? "Saved" : "Save Job"}
              </Button>

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="capitalize">{job.employment_type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {job.school_lga}, {job.school_state}
                  </span>
                </div>
                {job.accommodation_offered && (
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <Home className="h-4 w-4 flex-shrink-0" />
                    <span>Accommodation included</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>Posted {formatDate(job.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    Closes{" "}
                    <span
                      className={daysLeft <= 3 ? "text-red-600 font-medium" : ""}
                    >
                      {formatDate(job.deadline)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* School Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">About the School</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                  {job.school_logo_url ? (
                    <img
                      src={job.school_logo_url}
                      alt={job.school_name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {job.school_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded capitalize">
                      {job.school_type}
                    </span>
                    {job.school_is_verified && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                <MapPin className="h-3.5 w-3.5" />
                {job.school_lga}, {job.school_state}
              </div>
              <Link href={`/schools/${job.school_id}`}>
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View School Profile
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}