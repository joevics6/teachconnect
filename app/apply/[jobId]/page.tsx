"use client"

// ============================================================
// app/apply/[jobId]/page.tsx
// Direct application for jobs without quiz screening
// ============================================================

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  Send,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

interface JobDetails {
  id: string
  title: string
  subject: string
  teaching_levels: string[]
  employment_type: string
  salary_min: number
  salary_max: number
  deadline: string
  quiz_enabled: boolean
  school_name: string
  school_logo_url: string | null
  school_state: string
  school_lga: string
  description: string
  required_qualifications: string
}

interface TeacherProfile {
  full_name: string
  subjects: string[]
  teaching_levels: string[]
  years_experience: number
  trcn_status: string
  state: string
  cv_url: string | null
}

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [job, setJob] = useState<JobDetails | null>(null)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, profileRes] = await Promise.all([
          fetch(`/api/jobs/${jobId}`),
          fetch("/api/teacher/profile"),
        ])

        // Not logged in — redirect to login
        if (profileRes.status === 401) {
          router.replace(`/login?next=/apply/${jobId}`)
          return
        }

        const [jobData, profileData] = await Promise.all([
          jobRes.json(),
          profileRes.json(),
        ])

        if (!jobRes.ok) {
          setError("Job not found")
          return
        }

        // If job requires quiz, redirect to quiz page
        if (jobData.job?.quiz_enabled) {
          router.replace(`/quiz/${jobId}`)
          return
        }

        setJob(jobData.job)
        setAlreadyApplied(jobData.has_applied || false)
        setProfile(profileData.profile)
      } catch (err) {
        setError("Failed to load job details")
      } finally {
        setIsLoading(false)
      }
    }

    if (jobId) fetchData()
  }, [jobId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          mode: null,
          answers: {},
          score: null,
          passed: null,
          time_taken: 0,
          cover_letter: coverLetter,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setAlreadyApplied(true)
          return
        }
        throw new Error(data.error || "Application failed")
      }

      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link href="/jobs">
            <Button className="bg-green-600 hover:bg-green-700 text-white">Browse Jobs</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 text-sm mb-2">
            Your application for <span className="font-semibold text-gray-700">{job?.title}</span> at{" "}
            <span className="font-semibold text-gray-700">{job?.school_name}</span> has been sent.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            The school will review your profile and contact you if you are shortlisted.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/teacher/applications">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">View My Applications</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" className="w-full">Browse More Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const daysLeft = job ? Math.ceil(
    (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back */}
        <Link href={`/jobs/${jobId}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" />Back to job
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">

              {/* Job Header */}
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                  {job?.school_logo_url ? (
                    <img src={job.school_logo_url} alt={job?.school_name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{job?.title}</h1>
                  <p className="text-green-600 text-sm">{job?.school_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job?.school_lga}, {job?.school_state}</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job?.employment_type}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{daysLeft > 0 ? `${daysLeft} days left` : "Closed"}</span>
                  </div>
                </div>
              </div>

              {/* Already Applied */}
              {alreadyApplied && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-5">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Already Applied</p>
                    <p className="text-green-600 text-xs">You have already submitted an application for this position.</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-5 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Closed Warning */}
              {daysLeft <= 0 && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-5 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  This job posting has closed and is no longer accepting applications.
                </div>
              )}

              {/* Your Profile Preview */}
              {profile && (
                <div className="mb-6">
                  <h2 className="font-bold text-gray-900 mb-3">Your Application Profile</h2>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Name</p>
                        <p className="font-medium text-gray-900">{profile.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Location</p>
                        <p className="font-medium text-gray-900">{profile.state}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Experience</p>
                        <p className="font-medium text-gray-900">{profile.years_experience} years</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">TRCN Status</p>
                        <p className={`font-medium capitalize ${profile.trcn_status === "registered" ? "text-green-600" : "text-gray-700"}`}>
                          {profile.trcn_status.replace("-", " ")}
                        </p>
                      </div>
                    </div>
                    {profile.subjects.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-400 mb-1.5">Subjects</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.subjects.slice(0, 5).map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-lg">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!profile.cv_url && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-orange-600">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        No CV uploaded. <Link href="/profile/teacher/me" className="underline">Add a CV</Link> to strengthen your application.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {!alreadyApplied && daysLeft > 0 && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={6}
                      placeholder="Tell the school why you are a great fit for this role. Mention your relevant experience, teaching approach, and why you are interested in this position..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">{coverLetter.length} characters</p>
                  </div>

                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-xs text-gray-500">
                      By applying, your profile and CV will be shared with the school.
                    </p>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
                      ) : (
                        <><Send className="h-4 w-4" />Submit Application</>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Job Summary Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Job Summary</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Salary</p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(job?.salary_min || 0)} – {formatCurrency(job?.salary_max || 0)}
                    <span className="text-xs font-normal text-gray-400">/mo</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Subject</p>
                  <p className="font-medium text-gray-900">{job?.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Levels</p>
                  <div className="flex flex-wrap gap-1">
                    {job?.teaching_levels.map((l) => (
                      <span key={l} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded uppercase">{l}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Deadline</p>
                  <p className={`font-medium ${daysLeft <= 3 ? "text-red-500" : "text-gray-900"}`}>
                    {job?.deadline ? formatDate(job.deadline) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Quiz Required</p>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                    <p className="font-medium text-gray-900">No — Direct Application</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <Link href={`/jobs/${jobId}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Full Job Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}