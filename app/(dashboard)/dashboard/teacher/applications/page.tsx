"use client"

// ============================================================
// app/(dashboard)/dashboard/teacher/applications/page.tsx
// ============================================================

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  ChevronRight,
  Loader2,
  AlertCircle,
  MapPin,
  BookOpen as QuizIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard/teacher", label: "Overview", icon: GraduationCap },
  { href: "/dashboard/teacher/applications", label: "My Applications", icon: Briefcase },
  { href: "/dashboard/teacher/saved-jobs", label: "Saved Jobs", icon: BookOpen },
  { href: "/dashboard/teacher/quiz-results", label: "Quiz Results", icon: Star },
  { href: "/dashboard/teacher/specialization-quiz", label: "Subject Mastery", icon: Zap },
  { href: "/profile/teacher/me", label: "My Profile", icon: User },
  { href: "/dashboard/teacher/settings", label: "Settings", icon: Settings },
]

type PipelineStage =
  | "applied"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"

interface Application {
  id: string
  job_id: string
  job_title: string
  school_name: string
  school_logo_url: string | null
  school_state: string
  subject: string
  employment_type: string
  salary_min: number
  salary_max: number
  quiz_score: number | null
  quiz_passed: boolean | null
  quiz_mode: string | null
  pipeline_stage: PipelineStage
  applied_at: string
  deadline: string
}

function getStageInfo(stage: PipelineStage) {
  const map = {
    applied: { label: "Applied", color: "text-gray-600", bg: "bg-gray-100", icon: Clock },
    shortlisted: { label: "Shortlisted", color: "text-blue-700", bg: "bg-blue-100", icon: CheckCircle2 },
    interview: { label: "Interview", color: "text-purple-700", bg: "bg-purple-100", icon: Eye },
    offered: { label: "Offered", color: "text-orange-700", bg: "bg-orange-100", icon: Star },
    hired: { label: "Hired 🎉", color: "text-green-700", bg: "bg-green-100", icon: CheckCircle2 },
    rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-100", icon: XCircle },
  }
  return map[stage] || map.applied
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function ApplicationCard({ app }: { app: Application }) {
  const stage = getStageInfo(app.pipeline_stage)
  const StageIcon = stage.icon
  const daysLeft = Math.ceil(
    (new Date(app.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className={`bg-white border rounded-xl p-5 transition-all ${
      app.pipeline_stage === "rejected" ? "border-gray-100 opacity-70" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
    }`}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
          {app.school_logo_url ? (
            <img src={app.school_logo_url} alt={app.school_name} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-gray-600 font-bold text-sm">{getInitials(app.school_name)}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{app.job_title}</h3>
              <p className="text-xs text-gray-500">{app.school_name}</p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${stage.bg} ${stage.color}`}>
              <StageIcon className="h-3 w-3" />
              {stage.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              {app.school_state}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{app.subject}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 capitalize">{app.employment_type}</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(app.salary_min)} – {formatCurrency(app.salary_max)}
                <span className="text-xs font-normal text-gray-400">/mo</span>
              </p>
              {app.quiz_score !== null && (
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  app.quiz_passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  <QuizIcon className="h-3 w-3" />
                  Quiz: {app.quiz_score}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                Applied {new Date(app.applied_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              </span>
              <Link href={`/jobs/${app.job_id}`}>
                <Button size="sm" variant="outline" className="text-xs h-7 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  View Job
                </Button>
              </Link>
            </div>
          </div>

          {app.pipeline_stage === "shortlisted" && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              You have been shortlisted. The school may contact you soon.
            </div>
          )}

          {app.pipeline_stage === "offered" && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-700">
              <Star className="h-3.5 w-3.5 flex-shrink-0" />
              You have received a job offer. Check your notifications.
            </div>
          )}

          {app.pipeline_stage === "hired" && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              Congratulations! You have been hired for this position.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ApplicationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<PipelineStage | "all">("all")

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch("/api/teacher/applications")
        const data = await response.json()
        setApplications(data.applications || [])
      } catch (err) {
        console.error("Failed to fetch applications:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const filtered = activeFilter === "all"
    ? applications
    : applications.filter((a) => a.pipeline_stage === activeFilter)

  const stageCounts = {
    all: applications.length,
    applied: applications.filter((a) => a.pipeline_stage === "applied").length,
    shortlisted: applications.filter((a) => a.pipeline_stage === "shortlisted").length,
    interview: applications.filter((a) => a.pipeline_stage === "interview").length,
    offered: applications.filter((a) => a.pipeline_stage === "offered").length,
    hired: applications.filter((a) => a.pipeline_stage === "hired").length,
    rejected: applications.filter((a) => a.pipeline_stage === "rejected").length,
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white p-1.5 rounded-lg"><GraduationCap className="h-4 w-4" /></div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-xs text-gray-900">JobMeter</span>
              <span className="font-bold text-xs text-green-600">TeachConnect</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><span className="text-green-700 font-bold text-sm">AO</span></div>
            <div><p className="font-semibold text-gray-900 text-sm">Adaeze Okafor</p><p className="text-xs text-gray-500">Mathematics • Lagos</p></div>
          </div>
        </div>
        <nav className="p-3">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mb-0.5">
              <item.icon className="h-4 w-4 flex-shrink-0" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition w-full"><LogOut className="h-4 w-4" />Log Out</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-gray-600" /></button>
          <h1 className="text-lg font-bold text-gray-900">My Applications</h1>
          <Link href="/jobs" className="ml-auto">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Browse Jobs</Button>
          </Link>
        </header>

        <div className="p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total", value: stageCounts.all, color: "text-gray-700" },
              { label: "Shortlisted", value: stageCounts.shortlisted, color: "text-blue-600" },
              { label: "Offered", value: stageCounts.offered, color: "text-orange-600" },
              { label: "Hired", value: stageCounts.hired, color: "text-green-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 flex-wrap">
            {(["all", "applied", "shortlisted", "interview", "offered", "hired", "rejected"] as const).map((stage) => (
              <button
                key={stage}
                onClick={() => setActiveFilter(stage)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 capitalize ${
                  activeFilter === stage ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {stage}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeFilter === stage ? "bg-green-500" : "bg-gray-100 text-gray-600"}`}>
                  {stageCounts[stage]}
                </span>
              </button>
            ))}
          </div>

          {/* Applications List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-500 text-sm mb-5">Start applying to teaching jobs across Nigeria.</p>
              <Link href="/jobs"><Button className="bg-green-600 hover:bg-green-700 text-white">Browse Jobs</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((app) => <ApplicationCard key={app.id} app={app} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}