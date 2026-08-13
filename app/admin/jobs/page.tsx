"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle, XCircle, ShieldCheck, ShieldOff } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import { AdminShell } from "@/components/admin/AdminShell"

interface AdminJob {
  id: string
  title: string
  subject: string
  employment_type: string
  salary_min: number | null
  salary_max: number | null
  state: string
  status: string
  is_private: boolean
  is_featured: boolean
  quiz_enabled: boolean
  deadline: string
  created_at: string
  school_id: string
  school_profiles: { school_name: string; is_verified: boolean; logo_url: string | null } | null
}

const STATUS_TABS = [
  { value: "pending_approval", label: "Pending Approval" },
  { value: "active",           label: "Active" },
  { value: "rejected",         label: "Rejected" },
  { value: "closed",           label: "Closed" },
  { value: "all",              label: "All" },
] as const

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_TABS[number]["value"]>("pending_approval")
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    fetch(`/api/admin/jobs?status=${statusFilter}`)
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setJobs(data.jobs || [])
      })
      .catch((err) => console.error("Failed to load jobs:", err))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const handleAction = async (job: AdminJob, action: "approve" | "reject") => {
    setBusyId(job.id)
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        // The job no longer matches the current filter once actioned —
        // just drop it from the list rather than refetching.
        setJobs((prev) => prev.filter((j) => j.id !== job.id))
      }
    } catch (err) {
      console.error("Action failed:", err)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Jobs</h1>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition ${
                statusFilter === t.value ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-ink-600 animate-spin" /></div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
            No jobs in this status.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium capitalize">
                      {job.status.replace("_", " ")}
                    </span>
                    {job.is_private && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">Private</span>
                    )}
                    {job.quiz_enabled && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">Quiz</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {job.school_profiles?.school_name || "Unknown school"}
                    {job.school_profiles && (
                      job.school_profiles.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 ml-2">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 ml-2">
                          <ShieldOff className="h-3 w-3" /> Unverified
                        </span>
                      )
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {job.subject} • {job.employment_type} • {job.state}
                    {job.salary_min ? ` • ${formatCurrency(job.salary_min)}${job.salary_max ? `–${formatCurrency(job.salary_max)}` : ""}` : ""}
                    {" • "}Posted {formatDate(job.created_at)}
                    {" • "}Deadline {formatDate(job.deadline)}
                  </p>
                </div>

                {job.status === "pending_approval" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(job, "reject")}
                      disabled={busyId === job.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {busyId === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(job, "approve")}
                      disabled={busyId === job.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-700 hover:bg-ink-800 text-white flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {busyId === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
