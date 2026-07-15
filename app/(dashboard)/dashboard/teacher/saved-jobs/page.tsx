"use client"

// ============================================================
// app/(dashboard)/dashboard/teacher/saved-jobs/page.tsx
// ============================================================

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Menu,
  MapPin,
  Clock,
  Home,
  Bookmark,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { TeacherSidebar } from "@/components/dashboard/TeacherSidebar"

interface SavedJob {
  id: string
  job_id: string
  title: string
  school_name: string
  school_logo_url: string | null
  school_state: string
  subject: string
  teaching_levels: string[]
  employment_type: string
  salary_min: number
  salary_max: number
  accommodation_offered: boolean
  quiz_enabled: boolean
  deadline: string
  saved_at: string
  has_applied: boolean
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function SavedJobsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const response = await fetch("/api/teacher/saved-jobs")
        const data = await response.json()
        setSavedJobs(data.saved_jobs || [])
      } catch (err) {
        console.error("Failed to fetch saved jobs:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSaved()
  }, [])

  const handleRemove = async (savedId: string, jobId: string) => {
    setRemovingId(savedId)
    try {
      await fetch("/api/teacher/saved-jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      })
      setSavedJobs((prev) => prev.filter((s) => s.id !== savedId))
    } catch (err) {
      console.error(err)
    } finally {
      setRemovingId(null)
    }
  }

  const daysLeft = (deadline: string) =>
    Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TeacherSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-gray-600" /></button>
          <h1 className="text-lg font-bold text-gray-900">Saved Jobs</h1>
          <span className="ml-2 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{savedJobs.length}</span>
          <Link href="/jobs" className="ml-auto">
            <Button size="sm" className="bg-ink-600 hover:bg-ink-700 text-white">Browse More Jobs</Button>
          </Link>
        </header>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-ink-600 animate-spin" />
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No saved jobs</h3>
              <p className="text-gray-500 text-sm mb-5">Save jobs you&apos;re interested in to apply later.</p>
              <Link href="/jobs"><Button className="bg-ink-600 hover:bg-ink-700 text-white">Browse Jobs</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {savedJobs.map((saved) => {
                const days = daysLeft(saved.deadline)
                const isClosed = days <= 0
                return (
                  <div key={saved.id} className={`bg-white border rounded-xl p-5 transition-all ${isClosed ? "border-gray-100 opacity-60" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden">
                        {saved.school_logo_url
                          ? <img src={saved.school_logo_url} alt={saved.school_name} className="w-full h-full object-contain p-1" />
                          : <span className="text-gray-600 font-bold text-sm">{getInitials(saved.school_name)}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">{saved.title}</h3>
                            <p className="text-xs text-gray-500">{saved.school_name}</p>
                          </div>
                          {isClosed && (
                            <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium flex-shrink-0">Closed</span>
                          )}
                          {saved.has_applied && !isClosed && (
                            <span className="px-2.5 py-1 bg-ink-100 text-ink-700 text-xs rounded-full font-medium flex-shrink-0">Applied</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg">{saved.subject}</span>
                          {saved.teaching_levels.map((l) => (
                            <span key={l} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-lg uppercase">{l}</span>
                          ))}
                          {saved.accommodation_offered && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-lg">
                              <Home className="h-3 w-3" />Accommodation
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(saved.salary_min)} – {formatCurrency(saved.salary_max)}
                              <span className="text-xs font-normal text-gray-400">/mo</span>
                            </p>
                            <span className={`flex items-center gap-1 text-xs ${days <= 3 && !isClosed ? "text-red-500" : "text-gray-400"}`}>
                              <Clock className="h-3 w-3" />
                              {isClosed ? "Closed" : `${days} days left`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="h-3 w-3" />{saved.school_state}
                            </span>
                            <button
                              onClick={() => handleRemove(saved.id, saved.job_id)}
                              disabled={removingId === saved.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                            >
                              {removingId === saved.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                            <Link href={`/jobs/${saved.job_id}`}>
                              <Button size="sm" variant="outline" className="text-xs h-7 flex items-center gap-1">
                                <Eye className="h-3 w-3" />View
                              </Button>
                            </Link>
                            {!isClosed && !saved.has_applied && (
                              <Link href={saved.quiz_enabled ? `/quiz/${saved.job_id}` : `/apply/${saved.job_id}`}>
                                <Button size="sm" className="text-xs h-7 bg-ink-600 hover:bg-ink-700 text-white">Apply</Button>
                              </Link>
                            )}
                          </div>
                        </div>
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