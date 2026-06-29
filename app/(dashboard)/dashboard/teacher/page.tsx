"use client"

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
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Menu,
  X,
  Loader2,
  Zap,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const NAV_ITEMS = [
  { href: "/dashboard/teacher", label: "Overview", icon: GraduationCap },
  { href: "/dashboard/teacher/applications", label: "My Applications", icon: Briefcase },
  { href: "/dashboard/teacher/saved-jobs", label: "Saved Jobs", icon: BookOpen },
  { href: "/dashboard/teacher/quiz-results", label: "Quiz Results", icon: Star },
  { href: "/dashboard/teacher/specialization-quiz", label: "Subject Mastery", icon: Zap },
  { href: "/dashboard/teacher/edit-profile", label: "Edit Profile", icon: User },
  { href: "/dashboard/teacher/settings", label: "Settings", icon: Settings },
]

interface TeacherProfile {
  id: string
  full_name: string
  state: string
  lga: string | null
  subjects: string[]
  teaching_levels: string[]
  photo_url: string | null
  profile_completion: number
  is_visible: boolean
  trcn_status: string
  bio: string | null
  cv_url: string | null
  phone: string
  trcn_number: string | null
  years_experience: number
  availability: string | null
  salary_min: number | null
  willing_to_relocate: boolean | null
}

interface OnboardingData {
  cv_name: string | null
  cv_summary: string | null
  cv_skills: string[] | null
  cv_roles: string[] | null
  cv_languages: string[] | null
  cv_certifications: string[] | null
  cv_linkedin: string | null
  cv_work_experience: Array<{
    title: string
    organization: string
    location?: string
    start_date?: string
    end_date?: string
    description?: string
  }> | null
  cv_education: Array<{
    degree: string
    institution: string
    field?: string
    year?: string
    grade?: string
  }> | null
  cv_awards: string[] | null
  cv_interests: string[] | null
  curriculum_experience: string[] | null
  teaching_style: string[] | null
  lesson_delivery_mode: string[] | null
  talent_pool: boolean | null
  years_of_teaching_experience: number | null
  experience_level: string | null
  preferred_states: string[] | null
  accommodation_needed: boolean | null
  sector: string | null
  job_type: string | null
}

interface Application {
  id: string
  job_id: string
  job_title: string
  school_name: string
  school_state: string
  quiz_score: number | null
  quiz_passed: boolean | null
  pipeline_stage: string
  applied_at: string
}

interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ── Skeleton component ────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
          <Skeleton className="h-8 w-12 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <Skeleton className="h-5 w-32" />
      {[...Array(lines)].map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function getStatusBadge(status: string) {
  switch (status) {
    case "shortlisted":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3" />Shortlisted</span>
    case "applied":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3" />Pending</span>
    case "rejected":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600"><XCircle className="h-3 w-3" />Rejected</span>
    case "hired":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Star className="h-3 w-3" />Hired</span>
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status}</span>
  }
}


export default function TeacherDashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auth state — loaded immediately from client session
  const [authChecked, setAuthChecked] = useState(false)
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")

  // Data states — all start null (not loading)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [savedJobsCount, setSavedJobsCount] = useState(0)
  const [totalApplicationsCount, setTotalApplicationsCount] = useState(0)
  const [profileViewsCount, setProfileViewsCount] = useState(0)

  // Loading states per section — all false until triggered
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)

  // ── Load all dashboard data via API routes (same pattern as profile page) ──
  useEffect(() => {
    // Profile — call the API route exactly like the profile page does
    // The server handles auth via cookies; no client-side session gate needed
    setLoadingProfile(true)
    fetch("/api/teacher/profile")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login")
          return
        }
        if (!res.ok) return
        const data = await res.json()
        const p = data.profile
        if (!p) return

        // Set user name from profile
        setUserName(p.full_name || "Teacher")
        setUserId(p.id)
        setAuthChecked(true)

        setProfile({
          id: p.id,
          full_name: p.full_name,
          state: p.state,
          lga: p.lga ?? null,
          subjects: p.subjects ?? [],
          teaching_levels: p.teaching_levels ?? [],
          photo_url: p.photo_url ?? null,
          profile_completion: p.profile_completion ?? 0,
          is_visible: p.is_visible ?? true,
          trcn_status: p.trcn_status ?? "",
          bio: p.bio ?? null,
          cv_url: p.cv_url ?? null,
          phone: p.phone ?? "",
          trcn_number: p.trcn_number ?? null,
          years_experience: p.years_experience ?? 0,
          availability: p.availability ?? null,
          salary_min: p.salary_min ?? null,
          willing_to_relocate: p.willing_to_relocate ?? null,
        })

        // The API already merges onboarding fields into the profile object
        setOnboarding({
          cv_name:                      p.cv_name ?? null,
          cv_summary:                   p.cv_summary ?? null,
          cv_skills:                    p.cv_skills ?? [],
          cv_roles:                     p.cv_roles ?? [],
          cv_languages:                 p.cv_languages ?? [],
          cv_certifications:            p.cv_certifications ?? [],
          cv_linkedin:                  p.cv_linkedin ?? null,
          cv_work_experience:           p.cv_work_experience ?? [],
          cv_education:                 p.cv_education ?? [],
          cv_awards:                    p.cv_awards ?? [],
          cv_interests:                 p.cv_interests ?? [],
          curriculum_experience:        p.curriculum_experience ?? [],
          teaching_style:               p.teaching_style ?? [],
          lesson_delivery_mode:         p.lesson_delivery_mode ?? [],
          talent_pool:                  p.talent_pool ?? null,
          years_of_teaching_experience: p.years_of_teaching_experience ?? null,
          experience_level:             p.experience_level ?? null,
          preferred_states:             p.preferred_states ?? [],
          accommodation_needed:         p.accommodation_needed ?? null,
          sector:                       p.sector ?? null,
          job_type:                     p.job_type ?? null,
        })
      })
      .catch((err) => console.error("Profile load error:", err))
      .finally(() => setLoadingProfile(false))

    // Applications
    setLoadingApplications(true)
    fetch("/api/teacher/applications")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        const all = data.applications || []
        setTotalApplicationsCount(all.length)
        setApplications(all.slice(0, 3))
      })
      .catch((err) => console.error("Applications load error:", err))
      .finally(() => setLoadingApplications(false))

    // Notifications
    setLoadingNotifications(true)
    fetch("/api/teacher/notifications")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setNotifications(data.notifications || [])
      })
      .catch(() => {
        // Notifications API may not exist yet — silently ignore
      })
      .finally(() => setLoadingNotifications(false))

    // Saved jobs count
    fetch("/api/teacher/saved-jobs")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setSavedJobsCount(data.saved_jobs?.length || 0)
      })
      .catch((err) => console.error("Saved jobs error:", err))

  }, [router])

  const handleToggleVisibility = async () => {
    if (!profile) return
    setIsTogglingVisibility(true)
    try {
      await fetch("/api/teacher/profile/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: !profile.is_visible }),
      })
      setProfile((prev) => prev ? { ...prev, is_visible: !prev.is_visible } : prev)
    } catch (err) {
      console.error(err)
    } finally {
      setIsTogglingVisibility(false)
    }
  }

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  // ── Don't block render on auth check — show skeleton shell ───
  const unreadCount = notifications.filter((n) => !n.is_read).length
  const shortlistedCount = applications.filter((a) => a.pipeline_stage === "shortlisted").length
  const firstName = profile?.full_name?.split(" ")[0] || userName.split(" ")[0] || "Teacher"

  // Profile completion — checks both teacher_profiles and onboarding_data
  const completionItems = [
    { label: "Profile photo",  done: !!profile?.photo_url },
    { label: "Upload CV",      done: !!profile?.cv_url },
    { label: "Add bio",        done: !!(profile?.bio || onboarding?.cv_summary) },
    { label: "Add subjects",   done: (profile?.subjects?.length || 0) > 0 },
    { label: "TRCN status",    done: !!profile?.trcn_status && profile.trcn_status !== "" },
    { label: "Teaching levels",done: (profile?.teaching_levels?.length || 0) > 0 },
    { label: "Phone number",   done: !!profile?.phone },
    { label: "Location",       done: !!profile?.state },
    { label: "Availability",   done: !!profile?.availability },
    { label: "Skills",         done: (onboarding?.cv_skills?.length || 0) > 0 },
    { label: "Subject Mastery Quiz", done: false, href: "/dashboard/teacher/specialization-quiz", isQuiz: true },
  ]
  const completedFields = completionItems.filter((i) => i.done).length
  const profileCompletion = Math.round((completedFields / completionItems.length) * 100)

  // Sidebar content — same whether loading or not
  const sidebarContent = (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-auto flex flex-col`}>
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
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={profile.full_name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-green-700 font-bold text-sm">
                {profile ? getInitials(profile.full_name) : userName ? getInitials(userName) : "?"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            {loadingProfile ? (
              <>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-900 text-sm truncate">{profile?.full_name || userName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {profile?.subjects?.[0] || "Teacher"}{profile?.state ? ` • ${profile.state}` : ""}
                </p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleToggleVisibility}
          disabled={isTogglingVisibility || !profile}
          className={`mt-4 w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            profile?.is_visible
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }`}
        >
          <span>{profile?.is_visible ? "Visible to Schools" : "Hidden from Schools"}</span>
          {isTogglingVisibility ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : profile?.is_visible ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <nav className="p-3 flex-1">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mb-0.5">
            <item.icon className="h-4 w-4 flex-shrink-0" />{item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition w-full">
          <LogOut className="h-4 w-4" />Log Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarContent}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        {/* Header — always visible immediately */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-gray-600" /></button>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            <Link href="/jobs">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Browse Jobs</Button>
            </Link>
          </div>
        </header>

        <div className="p-6 space-y-6">

          {/* Welcome Banner — shows immediately with whatever name we have */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-1">Welcome back, {firstName} 👋</h2>
            <p className="text-green-100 text-sm">
              {loadingApplications
                ? "Loading your activity..."
                : `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}${shortlistedCount > 0 ? ` and ${shortlistedCount} active shortlist${shortlistedCount !== 1 ? "s" : ""}` : ""}.`
              }
            </p>
          </div>

          {/* Stats — skeleton while loading */}
          {loadingApplications ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Applications", value: totalApplicationsCount, color: "text-blue-600" },
                { label: "Shortlisted",  value: shortlistedCount,       color: "text-green-600" },
                { label: "Saved Jobs",   value: savedJobsCount,         color: "text-purple-600" },
                { label: "Profile Views",value: profileViewsCount,      color: "text-orange-600" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Profile is on the dedicated /profile/teacher/me page */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Profile Completion */}
            {loadingProfile ? (
              <CardSkeleton lines={5} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Profile Completion</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">{completedFields} of {completionItems.length} fields</span>
                  <span className="text-sm font-bold text-green-600">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
                  <div className="bg-green-600 h-2.5 rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
                </div>
                <div className="space-y-2">
                  {completionItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-100" : "bg-gray-100"}`}>
                        {item.done ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                      </div>
                      {"href" in item && !item.done ? (
                        <Link href={item.href!} className="text-green-600 hover:underline font-medium flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {item.label}
                        </Link>
                      ) : (
                        <span className={item.done ? "text-gray-400 line-through" : "text-gray-600"}>{item.label}</span>
                      )}
                    </div>
                  ))}
                </div>
                </div>
                <Link href="/dashboard/teacher/edit-profile">
                  <Button size="sm" variant="outline" className="w-full mt-4 text-xs">Complete Profile</Button>
                </Link>
                <Link href="/dashboard/teacher/specialization-quiz">
                  <Button size="sm" className="w-full mt-2 text-xs bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    Take Subject Mastery Quiz
                  </Button>
                </Link>
              </div>
            )}

            {/* Subject Mastery Prompt */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Subject Mastery</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Take a 5-minute quiz on your subject. Your percentile rank appears on your profile and signals expertise to schools.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-xs text-green-700 font-medium">Stand out from other applicants</span>
              </div>
              <Link href="/dashboard/teacher/specialization-quiz">
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white text-xs">
                  Start Quiz
                </Button>
              </Link>
            </div>

            {/* Notifications */}
            {loadingNotifications ? (
              <CardSkeleton lines={4} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-green-600 hover:underline">Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No notifications yet</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 rounded-lg text-xs ${n.is_read ? "bg-gray-50" : "bg-green-50 border border-green-100"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900">{n.title}</p>
                          {!n.is_read && <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-0.5" />}
                        </div>
                        <p className="text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions — always visible, no data dependency */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Browse new jobs", href: "/jobs", color: "text-green-600" },
                  { label: "Edit my profile", href: "/dashboard/teacher/edit-profile", color: "text-blue-600" },
                  { label: "View saved jobs", href: "/dashboard/teacher/saved-jobs", color: "text-purple-600" },
                  { label: "Check quiz results", href: "/dashboard/teacher/quiz-results", color: "text-orange-600" },
                  { label: "View career resources", href: "/resources", color: "text-gray-600" },
                ].map((item) => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition group">
                    <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Recent Applications</h3>
              <Link href="/dashboard/teacher/applications" className="text-sm text-green-600 hover:underline">View all</Link>
            </div>
            {loadingApplications ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                    <Skeleton className="w-10 h-10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">No applications yet.</p>
                <Link href="/jobs">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Browse Jobs</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{app.job_title}</p>
                        <p className="text-xs text-gray-500">{app.school_name} • {app.school_state}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {app.quiz_score !== null && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-500">Quiz</p>
                          <p className={`text-sm font-bold ${app.quiz_passed ? "text-green-600" : "text-red-500"}`}>{app.quiz_score}%</p>
                        </div>
                      )}
                      {getStatusBadge(app.pipeline_stage)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}