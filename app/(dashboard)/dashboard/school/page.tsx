"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Briefcase, Bell,
  ChevronRight, Plus, Menu, XCircle,
  CheckCircle2, Clock, Eye, Star, BookOpen, TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { SchoolSidebar } from "@/components/dashboard/SchoolSidebar"
import { LogoutButton } from "@/components/layout/LogoutButton"

interface Job {
  id: string; title: string; subject: string
  applicants_count: number; passed_quiz_count: number
  deadline: string; status: string; is_featured: boolean
}
interface Applicant {
  id: string; teacher_id: string; name: string; job_title: string
  quiz_score: number | null; quiz_passed: boolean | null
  experience: string; location: string; trcn: boolean
  stage: string; photo_url: string | null
}
interface Notification {
  id: string; title: string; message: string
  is_read: boolean; created_at: string
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
}
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
          <Skeleton className="h-8 w-12 mb-2" /><Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}
function JobsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
          <Skeleton className="w-9 h-9 flex-shrink-0" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}
function getStageBadge(stage: string) {
  switch (stage) {
    case "shortlisted": return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3" />Shortlisted</span>
    case "applied":     return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3" />Applied</span>
    case "hired":       return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Star className="h-3 w-3" />Hired</span>
    default:            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{stage}</span>
  }
}

export default function SchoolDashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [planType, setPlanType]               = useState<"free" | "standard" | "term">("free")
  const [jobs, setJobs]                       = useState<Job[]>([])
  const [recentApplicants, setRecentApplicants] = useState<Applicant[]>([])
  const [notifications, setNotifications]     = useState<Notification[]>([])
  const [schoolName, setSchoolName]           = useState("School")

  const [loadingProfile, setLoadingProfile]         = useState(true)
  const [accountDisabled, setAccountDisabled]       = useState(false)
  const [loadingJobs, setLoadingJobs]               = useState(true)
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [loadingApplicants, setLoadingApplicants]   = useState(false)
  const [metrics, setMetrics] = useState({
    interviews: 0, offers: 0, hired: 0, avgScore: 0
  })

  // ── Load all data via API routes (same pattern as teacher dashboard) ──
  useEffect(() => {
    // School profile
    fetch("/api/school/profile")
      .then(async (res) => {
        if (res.status === 401) { router.push("/login"); return }
        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}))
          if (errData.account_disabled) { setAccountDisabled(true); return }
        }
        if (!res.ok) return
        const data = await res.json()
        if (data.school) {
          setSchoolName(data.school.school_name || "School")
        }
      })
      .catch(console.error)
      .finally(() => setLoadingProfile(false))

    // Subscription
    fetch("/api/school/subscription")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setPlanType(data.subscription?.plan_type || "free")
      })
      .catch(console.error)

    // Jobs
    fetch("/api/school/jobs")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        const jobList: Job[] = (data.jobs || []).slice(0, 3)
        setJobs(jobList)

        // Load applicants for first active job
        const activeJob = jobList.find((j) => j.status === "active")
        if (activeJob) {
          setLoadingApplicants(true)
          fetch(`/api/school/jobs/${activeJob.id}/applicants`)
            .then(async (r) => {
              if (!r.ok) return
              const appData = await r.json()
              setRecentApplicants(
                (appData.applicants || []).slice(0, 3).map((a: {
                  id: string; teacher_id?: string; teacher_name: string; quiz_score: number | null
                  quiz_passed: boolean | null; years_experience: number
                  teacher_state: string; trcn_status: string
                  pipeline_stage: string; teacher_photo_url: string | null
                }) => ({
                  id: a.id,
                  teacher_id: a.teacher_id || a.id,
                  name: a.teacher_name,
                  job_title: activeJob.title,
                  quiz_score: a.quiz_score,
                  quiz_passed: a.quiz_passed,
                  experience: `${a.years_experience} yr${a.years_experience !== 1 ? "s" : ""}`,
                  location: a.teacher_state,
                  trcn: a.trcn_status === "registered",
                  stage: a.pipeline_stage,
                  photo_url: a.teacher_photo_url,
                }))
              )
            })
            .catch(console.error)
            .finally(() => setLoadingApplicants(false))
        }
      })
      .catch(console.error)
      .finally(() => setLoadingJobs(false))

    // Recruiter metrics from applications
    fetch("/api/school/metrics")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setMetrics(data.metrics || { interviews: 0, offers: 0, hired: 0, avgScore: 0 })
      })
      .catch(console.error)

    // Notifications
    fetch("/api/teacher/notifications")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setNotifications(data.notifications || [])
      })
      .catch(() => {})
      .finally(() => setLoadingNotifications(false))
  }, [router])

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return
    try {
      await fetch("/api/teacher/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error("Mark all read error:", err)
    }
  }

  const unreadCount     = notifications.filter((n) => !n.is_read).length
  const activeJobs      = jobs.filter((j) => j.status === "active").length
  const totalApplicants = jobs.reduce((s, j) => s + (j.applicants_count || 0), 0)
  const totalPassed     = jobs.reduce((s, j) => s + (j.passed_quiz_count || 0), 0)

  if (accountDisabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Account disabled</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your account has been disabled. If you believe this is a mistake, please contact support.
          </p>
          <LogoutButton
            label="Log Out"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      <SchoolSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-gray-600" /></button>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => document.getElementById("notifications-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            <Link href="/dashboard/school/post-job">
              <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5">
                <Plus className="h-4 w-4" />Post a Job
              </Button>
            </Link>
          </div>
        </header>

        <div className="p-6 space-y-6">

          {/* Welcome */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-1">Welcome back, {schoolName} 👋</h2>
            <p className="text-blue-100 text-sm mb-4">
              {loadingJobs
                ? "Loading your activity..."
                : `${totalApplicants} applicant${totalApplicants !== 1 ? "s" : ""} across ${activeJobs} active job${activeJobs !== 1 ? "s" : ""}.${totalPassed > 0 ? ` ${totalPassed} passed the quiz.` : ""}`
              }
            </p>
            <Link href="/dashboard/school/post-job">
              <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50">
                <Plus className="h-4 w-4 mr-1.5" />Post New Job
              </Button>
            </Link>
          </div>

          {/* Stats */}
          {loadingJobs ? <StatsSkeleton /> : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Active Jobs",      value: activeJobs,      color: "text-blue-600"   },
                { label: "Total Applicants", value: totalApplicants, color: "text-green-600"  },
                { label: "Passed Quiz",      value: totalPassed,     color: "text-purple-600" },
                {
                  label: "Pass Rate",
                  value: totalApplicants > 0 ? `${Math.round((totalPassed / totalApplicants) * 100)}%` : "—",
                  color: "text-orange-600",
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recruiter Metrics */}
          {!loadingJobs && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Interviews",    value: metrics.interviews, color: "text-blue-600",   icon: TrendingUp  },
                { label: "Offers Sent",   value: metrics.offers,     color: "text-purple-600", icon: Star        },
                { label: "Teachers Hired",value: metrics.hired,      color: "text-green-600",  icon: BookOpen    },
                { label: "Avg Quiz Score",value: metrics.avgScore > 0 ? `${metrics.avgScore}%` : "—", color: "text-orange-600", icon: TrendingUp },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={`text-2xl font-bold mb-1 ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-gray-500">{m.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Saved Teachers quick link */}
          <div className="flex justify-end">
            <Link href="/dashboard/school/saved-teachers">
              <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition">
                <Star className="h-4 w-4" />View Saved Teachers
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Jobs */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">Active Jobs</h3>
                <Link href="/dashboard/school/jobs" className="text-sm text-blue-600 hover:underline">View all</Link>
              </div>
              {loadingJobs ? <JobsSkeleton /> : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No jobs posted yet.</p>
                  <Link href="/dashboard/school/post-job">
                    <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">Post First Job</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm truncate">{job.title}</p>
                            {job.is_featured && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium flex-shrink-0">Featured</span>}
                          </div>
                          <p className="text-xs text-gray-500">
                            Deadline: {new Date(job.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-500">Applicants</p>
                          <p className="text-sm font-bold text-gray-900">
                            {job.applicants_count}
                            <span className="text-green-600 font-normal text-xs ml-1">({job.passed_quiz_count} passed)</span>
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${job.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {job.status}
                        </span>
                        <Link href={`/dashboard/school/jobs/${job.id}/applicants`}>
                          <Button size="sm" variant="outline" className="text-xs hidden sm:flex">
                            <Eye className="h-3 w-3 mr-1" />Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div id="notifications-panel" className="bg-white rounded-xl border border-gray-200 p-5 scroll-mt-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                )}
              </div>
              {loadingNotifications ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gray-50 space-y-2">
                      <Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No notifications yet</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-lg text-xs ${n.is_read ? "bg-gray-50" : "bg-blue-50 border border-blue-100"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900">{n.title}</p>
                        {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Applicants */}
          {(loadingApplicants || recentApplicants.length > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">Recent Applicants</h3>
                <Link href="/dashboard/school/jobs" className="text-sm text-blue-600 hover:underline">View all</Link>
              </div>
              {loadingApplicants ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentApplicants.map((applicant) => (
                    <div key={applicant.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {applicant.photo_url
                            ? <img src={applicant.photo_url} alt={applicant.name} className="w-full h-full object-cover" />
                            : <span className="text-sm font-bold text-gray-600">{getInitials(applicant.name)}</span>
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{applicant.name}</p>
                            {applicant.trcn && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">TRCN</span>}
                          </div>
                          <p className="text-xs text-gray-500">{applicant.job_title} • {applicant.experience} • {applicant.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {applicant.quiz_score !== null && (
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-500">Quiz</p>
                            <p className={`text-sm font-bold ${applicant.quiz_passed ? "text-green-600" : "text-red-500"}`}>{applicant.quiz_score}%</p>
                          </div>
                        )}
                        {getStageBadge(applicant.stage)}
                        <Link href={`/profile/teacher/${applicant.teacher_id || applicant.id}`}>
                          <Button size="sm" variant="outline" className="text-xs hidden sm:flex">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upgrade CTA */}
          {!loadingProfile && planType === "free" && (
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-white">
                <h3 className="font-bold text-lg mb-1">Unlock Full Access</h3>
                <p className="text-gray-400 text-sm">Browse all teacher profiles, send direct messages, and post unlimited jobs.</p>
              </div>
              <Link href="/dashboard/school/subscription" className="flex-shrink-0">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                  <ChevronRight className="h-4 w-4 mr-1" />Upgrade Plan
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
