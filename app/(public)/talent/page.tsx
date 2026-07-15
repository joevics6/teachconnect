"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  Filter,
  X,
  Lock,
  ChevronRight,
  BookOpen,
  Users,
  CheckCircle2,
  Home,
  Send,
  Loader2,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SUBJECTS, TEACHING_LEVELS, NIGERIAN_STATES } from "@/lib/constants"

// ─── Types ───────────────────────────────────────────────────

interface Teacher {
  id: string
  full_name: string
  state: string
  lga: string
  subjects: string[]
  teaching_levels: string[]
  years_experience: number
  trcn_status: string
  willing_to_relocate: boolean
  accommodation_needed: boolean
  salary_min: number
  salary_max: number
  photo_url: string | null
  bio: string | null
  profile_completion: number
  availability: string
  match_score: number
  demo_video_url: string | null
}

interface Filters {
  keyword: string
  subject: string
  level: string
  state: string
  trcn_only: boolean
  willing_to_relocate: boolean
  accommodation_needed: boolean
  experience_min: string
  availability: string
}

// ─── Helpers ─────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount)
}

function getAvailabilityLabel(availability: string) {
  const map: Record<string, string> = {
    immediate: "Available now",
    "2-weeks": "2 weeks notice",
    "1-month": "1 month notice",
    employed: "Currently employed",
  }
  return map[availability] || availability
}

// ─── Teacher Card ─────────────────────────────────────────────

function TeacherCard({
  teacher,
  isLocked,
  onInvite,
  inviting,
}: {
  teacher: Teacher
  isLocked: boolean
  onInvite: (teacherId: string) => void
  inviting: string | null
}) {
  if (isLocked) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-5 relative overflow-hidden">
        {/* Blurred content */}
        <div className="blur-sm pointer-events-none select-none">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="h-6 bg-gray-100 rounded-lg w-20" />
            <div className="h-6 bg-gray-100 rounded-lg w-16" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-full mb-1" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Upgrade to view
          </p>
          <p className="text-xs text-gray-400 text-center mb-3 px-4">
            Subscribe to access full teacher profiles
          </p>
          <Link href="/dashboard/school/subscription">
            <Button
              size="sm"
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs"
            >
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all">

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          {teacher.photo_url ? (
            <img
              src={teacher.photo_url}
              alt={teacher.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center border-2 border-ink-50">
              <span className="text-ink-700 font-bold text-sm">
                {getInitials(teacher.full_name)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {teacher.full_name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {teacher.lga}, {teacher.state}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {teacher.years_experience} yr
                  {teacher.years_experience !== 1 ? "s" : ""} exp
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {teacher.match_score !== undefined && (
                <span className={`px-1.5 py-0.5 text-xs rounded font-bold ${
                  teacher.match_score >= 80 ? "bg-ink-100 text-ink-700"
                  : teacher.match_score >= 60 ? "bg-blue-50 text-blue-700"
                  : "bg-gray-100 text-gray-500"}`}>
                  {teacher.match_score}% match
                </span>
              )}
              {teacher.trcn_status === "registered" && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-ink-100 text-ink-700 text-xs rounded font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  TRCN
                </span>
              )}
              {teacher.willing_to_relocate && (
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">
                  Relocate ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subjects & Levels */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {teacher.subjects.slice(0, 3).map((subject) => (
          <span
            key={subject}
            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg"
          >
            {subject}
          </span>
        ))}
        {teacher.subjects.length > 3 && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-lg">
            +{teacher.subjects.length - 3}
          </span>
        )}
        {teacher.teaching_levels.map((level) => (
          <span
            key={level}
            className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-lg uppercase"
          >
            {level}
          </span>
        ))}
      </div>

      {/* Bio */}
      {teacher.bio && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {teacher.bio}
        </p>
      )}

      {/* Salary & Availability */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400">Expected salary</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(teacher.salary_min)} –{" "}
            {formatCurrency(teacher.salary_max)}
            <span className="text-xs font-normal text-gray-400">/mo</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Availability</p>
          <p
            className={`text-xs font-medium ${
              teacher.availability === "immediate"
                ? "text-ink-600"
                : "text-gray-600"
            }`}
          >
            {getAvailabilityLabel(teacher.availability)}
          </p>
        </div>
      </div>

      {/* Accommodation */}
      {teacher.accommodation_needed && (
        <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg mb-4">
          <Home className="h-3 w-3" />
          Needs accommodation
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/profile/teacher/${teacher.id}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs flex items-center gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            View Profile
          </Button>
        </Link>
        <Button
          size="sm"
          onClick={() => onInvite(teacher.id)}
          disabled={inviting === teacher.id}
          className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-xs flex items-center gap-1.5"
        >
          {inviting === teacher.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Invite to Apply
        </Button>
      </div>
    </div>
  )
}

// ─── Invite Job Modal ─────────────────────────────────────────

interface Job {
  id: string
  title: string
  subject: string
  status: string
}

function InviteModal({
  teacherId,
  jobs,
  onInvite,
  onClose,
  isLoading,
}: {
  teacherId: string
  jobs: Job[]
  onInvite: (teacherId: string, jobId: string) => Promise<void>
  onClose: () => void
  isLoading: boolean
}) {
  const [selectedJob, setSelectedJob] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Invite Teacher to Apply</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Select which job you want to invite this teacher to apply for.
        </p>

        {jobs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-3">
              You have no active job postings.
            </p>
            <Link href="/dashboard/school/post-job">
              <Button
                size="sm"
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                Post a Job First
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 mb-5">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedJob === job.id
                    ? "bg-blue-50 border-blue-400"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {job.title}
                  </p>
                  <p className="text-xs text-gray-500">{job.subject}</p>
                </div>
                {selectedJob === job.id && (
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {jobs.length > 0 && (
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => onInvite(teacherId, selectedJob)}
              disabled={!selectedJob || isLoading}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Invite
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

const FREE_TIER_LIMIT = 5

export default function TalentPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [invitingTeacher, setInvitingTeacher] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const [filters, setFilters] = useState<Filters>({
    keyword: "",
    subject: "",
    level: "",
    state: "",
    trcn_only: false,
    willing_to_relocate: false,
    accommodation_needed: false,
    experience_min: "",
    availability: "",
  })

  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      keyword: "",
      subject: "",
      level: "",
      state: "",
      trcn_only: false,
      willing_to_relocate: false,
      accommodation_needed: false,
      experience_min: "",
      availability: "",
    })
  }

  const activeFilterCount = [
    filters.subject,
    filters.level,
    filters.state,
    filters.trcn_only,
    filters.willing_to_relocate,
    filters.accommodation_needed,
    filters.experience_min,
    filters.availability,
  ].filter(Boolean).length

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.keyword) params.set("keyword", filters.keyword)
      if (filters.subject) params.set("subject", filters.subject)
      if (filters.level) params.set("level", filters.level)
      if (filters.state) params.set("state", filters.state)
      if (filters.trcn_only) params.set("trcn_only", "true")
      if (filters.willing_to_relocate) params.set("relocate", "true")
      if (filters.accommodation_needed) params.set("accommodation", "true")
      if (filters.experience_min) params.set("experience_min", filters.experience_min)
      if (filters.availability) params.set("availability", filters.availability)

      const [teachersRes, jobsRes] = await Promise.all([
        fetch(`/api/talent?${params.toString()}`),
        fetch("/api/school/jobs?status=active"),
      ])

      const teachersData = await teachersRes.json()
      const jobsData = await jobsRes.json()

      setTeachers(teachersData.teachers || [])
      setTotalCount(teachersData.total || 0)
      setIsPremium(teachersData.is_premium || false)
      setJobs(jobsData.jobs || [])
    } catch (err) {
      console.error("Failed to fetch talent:", err)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(fetchTeachers, 300)
    return () => clearTimeout(timer)
  }, [fetchTeachers])

  const handleInvite = async (teacherId: string, jobId: string) => {
    setInviteLoading(true)
    try {
      const response = await fetch("/api/school/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: teacherId, job_id: jobId }),
      })
      if (!response.ok) throw new Error("Invite failed")
      setInviteSuccess(teacherId)
      setInvitingTeacher(null)
      setTimeout(() => setInviteSuccess(null), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Browse Teachers
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Find and invite qualified teachers directly
              </p>
            </div>
            {!isPremium && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl">
                <Lock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-yellow-800">
                    Free Plan — {FREE_TIER_LIMIT} profiles visible
                  </p>
                  <Link
                    href="/dashboard/school/subscription"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Upgrade to unlock all profiles →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => updateFilter("keyword", e.target.value)}
                placeholder="Search by name, subject, or location..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Subject
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => updateFilter("subject", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All subjects</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Teaching Level
                  </label>
                  <select
                    value={filters.level}
                    onChange={(e) => updateFilter("level", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All levels</option>
                    {TEACHING_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    State
                  </label>
                  <select
                    value={filters.state}
                    onChange={(e) => updateFilter("state", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All states</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Min Experience (years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={filters.experience_min}
                    onChange={(e) =>
                      updateFilter("experience_min", e.target.value)
                    }
                    placeholder="e.g. 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Toggle Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                {[
                  {
                    key: "trcn_only" as keyof Filters,
                    label: "TRCN Registered only",
                  },
                  {
                    key: "willing_to_relocate" as keyof Filters,
                    label: "Willing to relocate",
                  },
                  {
                    key: "accommodation_needed" as keyof Filters,
                    label: "Needs accommodation",
                  },
                ].map((toggle) => (
                  <label
                    key={toggle.key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters[toggle.key] as boolean}
                      onChange={(e) =>
                        updateFilter(toggle.key, e.target.checked)
                      }
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{toggle.label}</span>
                  </label>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Invite Success Banner */}
        {inviteSuccess && (
          <div className="mb-5 flex items-center gap-2 p-4 bg-ink-50 border border-ink-200 rounded-xl text-ink-700 text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            Invite sent successfully. The teacher will be notified.
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <span className="font-semibold text-gray-900">
                  {totalCount}
                </span>{" "}
                teacher{totalCount !== 1 ? "s" : ""} available
                {!isPremium && (
                  <span className="text-gray-400">
                    {" "}
                    — showing {Math.min(FREE_TIER_LIMIT, teachers.length)} of{" "}
                    {totalCount} (upgrade to see all)
                  </span>
                )}
              </>
            )}
          </p>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              {totalCount} registered
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-ink-500" />
              TRCN verified available
            </span>
            <span className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-purple-500" />
              Pre-screened profiles
            </span>
          </div>
        </div>

        {/* Teacher Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse"
              >
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <div className="h-6 bg-gray-100 rounded-lg w-20" />
                  <div className="h-6 bg-gray-100 rounded-lg w-16" />
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-100 rounded-lg flex-1" />
                  <div className="h-8 bg-blue-100 rounded-lg flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No teachers found
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Try adjusting your filters to find more teachers
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teachers.map((teacher, index) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                isLocked={!isPremium && index >= FREE_TIER_LIMIT}
                onInvite={(teacherId) => setInvitingTeacher(teacherId)}
                inviting={null}
              />
            ))}
          </div>
        )}

        {/* Upgrade CTA for free tier */}
        {!isPremium && !isLoading && teachers.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h3 className="font-bold text-lg mb-1">
                Unlock {totalCount - FREE_TIER_LIMIT}+ more teacher profiles
              </h3>
              <p className="text-blue-200 text-sm">
                Upgrade to browse all teachers, send unlimited invites, and
                access full contact details.
              </p>
            </div>
            <Link href="/dashboard/school/subscription" className="flex-shrink-0">
              <Button className="bg-white text-blue-700 hover:bg-blue-50 px-6 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Upgrade Plan
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {invitingTeacher && (
        <InviteModal
          teacherId={invitingTeacher}
          jobs={jobs}
          onInvite={handleInvite}
          onClose={() => setInvitingTeacher(null)}
          isLoading={inviteLoading}
        />
      )}
    </div>
  )
}