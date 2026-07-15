"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Briefcase,
  CheckCircle2,
  Eye,
  Loader2,
  Menu,
  Plus,
  Users,
  Clock,
  Star,
  Copy,
  XCircle,
  AlertCircle,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SchoolSidebar } from "@/components/dashboard/SchoolSidebar"

interface Job {
  id: string
  title: string
  subject: string
  teaching_levels: string[]
  employment_type: string
  salary_min: number
  salary_max: number
  accommodation_offered: boolean
  is_private: boolean
  is_featured: boolean
  quiz_enabled: boolean
  quiz_mode: string
  positions: number
  deadline: string
  status: "active" | "closed" | "draft"
  applicants_count: number
  passed_quiz_count: number
  views: number
  created_at: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    notation: "compact",
  }).format(amount)
}

function getDaysLeft(deadline: string) {
  return Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
}

function getStatusBadge(status: string, daysLeft: number) {
  if (status === "draft") {
    return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Draft</span>
  }
  if (status === "closed" || daysLeft <= 0) {
    return <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">Closed</span>
  }
  return <span className="px-2.5 py-1 bg-ink-100 text-ink-700 text-xs rounded-full font-medium">Active</span>
}

function JobActionsMenu({
  job,
  onClose,
  onDuplicate,
}: {
  job: Job
  onClose: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition"
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            <Link
              href={`/dashboard/school/jobs/${job.id}/applicants`}
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setOpen(false)}
            >
              <Eye className="h-3.5 w-3.5 text-blue-500" />
              View Applicants
            </Link>
            <Link
              href={`/jobs/${job.id}`}
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setOpen(false)}
            >
              <Eye className="h-3.5 w-3.5 text-gray-400" />
              Preview Listing
            </Link>
            <button
              onClick={() => { onDuplicate(job.id); setOpen(false) }}
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition w-full"
            >
              <Copy className="h-3.5 w-3.5 text-ink-500" />
              Duplicate Job
            </button>
            {job.status === "active" && (
              <button
                onClick={() => { onClose(job.id); setOpen(false) }}
                className="flex items-center gap-2 px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 transition w-full"
              >
                <XCircle className="h-3.5 w-3.5" />
                Close Job
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function SchoolJobsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "closed" | "draft">("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/school/jobs")
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (err) {
      console.error("Failed to fetch jobs:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = async (jobId: string) => {
    setActionLoading(jobId)
    try {
      await fetch(`/api/school/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      })
      setJobs((prev) =>
        prev.map((j) => j.id === jobId ? { ...j, status: "closed" } : j)
      )
      setSuccessMessage("Job closed successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async (jobId: string) => {
    setActionLoading(jobId)
    try {
      const response = await fetch(`/api/school/jobs/${jobId}/duplicate`, {
        method: "POST",
      })
      const data = await response.json()
      if (data.job) {
        setJobs((prev) => [data.job, ...prev])
        setSuccessMessage("Job duplicated as draft")
        setTimeout(() => setSuccessMessage(""), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = jobs.filter((j) => {
    if (activeFilter === "all") return true
    if (activeFilter === "active") return j.status === "active" && getDaysLeft(j.deadline) > 0
    if (activeFilter === "closed") return j.status === "closed" || getDaysLeft(j.deadline) <= 0
    return j.status === activeFilter
  })

  const counts = {
    all: jobs.length,
    active: jobs.filter((j) => j.status === "active" && getDaysLeft(j.deadline) > 0).length,
    closed: jobs.filter((j) => j.status === "closed" || getDaysLeft(j.deadline) <= 0).length,
    draft: jobs.filter((j) => j.status === "draft").length,
  }

  const totalApplicants = jobs.reduce((s, j) => s + j.applicants_count, 0)
  const totalPassed = jobs.reduce((s, j) => s + j.passed_quiz_count, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex">

      <SchoolSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-gray-600" /></button>
          <h1 className="text-lg font-bold text-gray-900">My Jobs</h1>
          <Link href="/dashboard/school/post-job" className="ml-auto">
            <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5">
              <Plus className="h-4 w-4" />Post a Job
            </Button>
          </Link>
        </header>

        <div className="p-6 space-y-5">

          {/* Success message */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-ink-50 border border-ink-200 rounded-xl text-ink-700 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Jobs", value: jobs.length, color: "text-blue-600" },
              { label: "Active", value: counts.active, color: "text-ink-600" },
              { label: "Total Applicants", value: totalApplicants, color: "text-purple-600" },
              { label: "Passed Quiz", value: totalPassed, color: "text-orange-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1">
            {(["all", "active", "closed", "draft"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 capitalize flex-1 justify-center ${
                  activeFilter === filter ? "bg-blue-700 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {filter}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeFilter === filter ? "bg-blue-600" : "bg-gray-100 text-gray-600"}`}>
                  {counts[filter]}
                </span>
              </button>
            ))}
          </div>

          {/* Jobs List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-500 text-sm mb-5">Post your first teaching vacancy to start receiving applications.</p>
              <Link href="/dashboard/school/post-job">
                <Button className="bg-blue-700 hover:bg-blue-800 text-white">Post a Job</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((job) => {
                const daysLeft = getDaysLeft(job.deadline)
                return (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-gray-900 text-sm">{job.title}</h3>
                          {job.is_featured && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                              <Star className="h-2.5 w-2.5" />Featured
                            </span>
                          )}
                          {job.is_private && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-medium">Private</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{job.subject} • {job.teaching_levels.join(", ").toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(job.status, daysLeft)}
                        {actionLoading === job.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : (
                          <JobActionsMenu job={job} onClose={handleClose} onDuplicate={handleDuplicate} />
                        )}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                        <p className="text-lg font-bold text-gray-900">{job.applicants_count}</p>
                        <p className="text-xs text-gray-500">Applicants</p>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                        <p className="text-lg font-bold text-ink-600">{job.passed_quiz_count}</p>
                        <p className="text-xs text-gray-500">Passed Quiz</p>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                        <p className="text-lg font-bold text-blue-600">{job.views}</p>
                        <p className="text-xs text-gray-500">Views</p>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                        <p className={`text-lg font-bold ${daysLeft <= 3 ? "text-red-500" : "text-gray-900"}`}>
                          {daysLeft <= 0 ? "Closed" : `${daysLeft}d`}
                        </p>
                        <p className="text-xs text-gray-500">Days Left</p>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatCurrency(job.salary_min)} – {formatCurrency(job.salary_max)}/mo</span>
                        <span>•</span>
                        <span className="capitalize">{job.employment_type}</span>
                        {job.quiz_enabled && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600 capitalize">{job.quiz_mode} quiz</span>
                          </>
                        )}
                        {daysLeft <= 3 && daysLeft > 0 && (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertCircle className="h-3 w-3" />Closing soon
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(job.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </span>
                        <Link href={`/dashboard/school/jobs/${job.id}/applicants`}>
                          <Button size="sm" className="text-xs h-7 bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Review Applicants
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}