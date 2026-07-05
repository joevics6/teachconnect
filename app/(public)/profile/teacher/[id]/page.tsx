"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  MapPin,
  Briefcase,
  Star,
  CheckCircle2,
  Home,
  Download,
  Send,
  Loader2,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Clock,
  ChevronRight,
  Eye,
  EyeOff,
  Zap,
  Trophy,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────

interface TeacherProfile {
  id: string
  full_name: string
  state: string
  lga: string
  phone: string
  subjects: string[]
  teaching_levels: string[]
  years_experience: number
  trcn_status: string
  trcn_number: string | null
  preferred_states: string[]
  willing_to_relocate: boolean
  accommodation_needed: boolean
  availability: string
  salary_min: number
  salary_max: number
  bio: string | null
  photo_url: string | null
  cv_url: string | null
  is_visible: boolean
  profile_completion: number
  created_at: string
}

interface QuizResult {
  id: string
  subject: string
  score: number
  passed: boolean
  mode: string
  created_at: string
}

interface SpecializationQuizResult {
  id: string
  subject: string
  level: string
  score: number
  percentile: number
  correct_answers: number
  total_questions: number
  created_at: string
}

const LEVEL_LABELS: Record<string, string> = {
  nursery:  "Nursery",
  primary:  "Primary",
  jss:      "JSS",
  sss:      "SSS",
  tertiary: "Tertiary",
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
    immediate: "Immediately Available",
    "2-weeks": "2 Weeks Notice",
    "1-month": "1 Month Notice",
    employed: "Currently Employed",
  }
  return map[availability] || availability
}

function getTRCNLabel(status: string) {
  const map: Record<string, string> = {
    registered: "TRCN Registered",
    pending: "TRCN Pending",
    "not-registered": "Not TRCN Registered",
  }
  return map[status] || status
}

function getLevelLabel(level: string) {
  const map: Record<string, string> = {
    nursery: "Nursery",
    primary: "Primary",
    jss: "Junior Secondary (JSS)",
    sss: "Senior Secondary (SSS)",
    tertiary: "Tertiary",
  }
  return map[level] || level
}

function getQuizModeLabel(mode: string) {
  const map: Record<string, string> = {
    standard: "Standard Quiz",
    speed: "Speed Quiz",
    written: "Written Quiz",
  }
  return map[mode] || mode
}

// ─── Profile Completion Bar ───────────────────────────────────

function ProfileCompletionBar({
  percentage,
  isOwnProfile,
}: {
  percentage: number
  isOwnProfile: boolean
}) {
  if (!isOwnProfile) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Profile Completion
        </h3>
        <span
          className={`text-sm font-bold ${
            percentage >= 80 ? "text-green-600" : "text-orange-500"
          }`}
        >
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage >= 80 ? "bg-green-500" : "bg-orange-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage < 100 && (
        <p className="text-xs text-gray-500">
          Complete your profile to appear higher in school searches.{" "}
          <Link
            href="/profile/teacher/me"
            className="text-green-600 hover:underline font-medium"
          >
            Complete now →
          </Link>
        </p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function TeacherProfilePage() {
  const params = useParams()
  const profileId = params.id as string
  const isOwnProfile = profileId === "me"

  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [specializationResults, setSpecializationResults] = useState<SpecializationQuizResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [viewerRole, setViewerRole] = useState<"teacher" | "school" | "guest">(
    "guest"
  )
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = isOwnProfile
          ? "/api/teacher/profile"
          : `/api/teacher/profile/${profileId}`
        const response = await fetch(url)
        if (!response.ok) throw new Error("Profile not found")
        const data = await response.json()
        setProfile(data.profile)
        setQuizResults(data.quiz_results || [])
        setViewerRole(data.viewer_role || "guest")

        // Fetch specialization quiz results separately
        const specUrl = isOwnProfile
          ? "/api/teacher/specialization-quiz/results"
          : "/api/teacher/specialization-quiz/results"
        try {
          const specRes = await fetch(specUrl)
          if (specRes.ok) {
            const specData = await specRes.json()
            setSpecializationResults(specData.results || [])
          }
        } catch { /* non-critical */ }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }
    if (profileId) fetchProfile()
  }, [profileId, isOwnProfile])

  const handleInvite = async () => {
    setIsInviting(true)
    try {
      // Opens invite modal — in practice you'd show job selection
      await new Promise((res) => setTimeout(res, 1000))
      setInviteSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsInviting(false)
    }
  }

  const handleToggleVisibility = async () => {
    if (!profile) return
    setIsTogglingVisibility(true)
    try {
      const response = await fetch("/api/teacher/profile/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: !profile.is_visible }),
      })
      if (!response.ok) throw new Error("Failed to update visibility")
      setProfile((prev) =>
        prev ? { ...prev, is_visible: !prev.is_visible } : prev
      )
    } catch (err) {
      console.error(err)
    } finally {
      setIsTogglingVisibility(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {error || "This teacher profile could not be found."}
          </p>
          <Link href="/talent">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Browse Teachers
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Back */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* Own profile actions */}
          {isOwnProfile && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleVisibility}
                disabled={isTogglingVisibility}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                  profile.is_visible
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-gray-100 border-gray-200 text-gray-500"
                }`}
              >
                {isTogglingVisibility ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : profile.is_visible ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {profile.is_visible ? "Visible to schools" : "Hidden"}
              </button>
              <Link href="/profile/teacher/me/edit">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Edit Profile
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Profile Completion (own profile only) */}
        <ProfileCompletionBar
          percentage={profile.profile_completion}
          isOwnProfile={isOwnProfile}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-5 flex-wrap">

                {/* Photo */}
                <div className="flex-shrink-0">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile.full_name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-50">
                      <span className="text-green-700 font-black text-xl">
                        {getInitials(profile.full_name)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile.full_name}
                  </h1>

                  {/* Subjects summary */}
                  <p className="text-gray-500 text-sm mb-3">
                    {profile.subjects.slice(0, 3).join(", ")}
                    {profile.subjects.length > 3 &&
                      ` +${profile.subjects.length - 3} more`}{" "}
                    •{" "}
                    {profile.years_experience} year
                    {profile.years_experience !== 1 ? "s" : ""} experience
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {profile.trcn_status === "registered" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        TRCN Registered
                      </span>
                    )}
                    {profile.trcn_status === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                        <Clock className="h-3 w-3" />
                        TRCN Pending
                      </span>
                    )}
                    {profile.willing_to_relocate && (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Open to Relocate
                      </span>
                    )}
                    {profile.accommodation_needed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        <Home className="h-3 w-3" />
                        Needs Accommodation
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        profile.availability === "immediate"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {getAvailabilityLabel(profile.availability)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-3 text-lg">
                  About
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Teaching Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4 text-lg">
                Teaching Details
              </h2>
              <div className="space-y-4">

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Subjects
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Teaching Levels
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.teaching_levels.map((level) => (
                      <span
                        key={level}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium"
                      >
                        {getLevelLabel(level)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Experience
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.years_experience} year
                      {profile.years_experience !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      TRCN Status
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        profile.trcn_status === "registered"
                          ? "text-green-600"
                          : profile.trcn_status === "pending"
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}
                    >
                      {getTRCNLabel(profile.trcn_status)}
                    </p>
                    {profile.trcn_number && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        #{profile.trcn_number}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Preferences */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4 text-lg">
                Location & Preferences
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Current Location
                  </p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {profile.lga}, {profile.state}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Availability
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      profile.availability === "immediate"
                        ? "text-green-600"
                        : "text-gray-700"
                    }`}
                  >
                    {getAvailabilityLabel(profile.availability)}
                  </p>
                </div>
              </div>

              {profile.willing_to_relocate &&
                profile.preferred_states.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Preferred States
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.preferred_states.map((state) => (
                        <span
                          key={state}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg"
                        >
                          {state}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Subject Mastery Results */}
            {specializationResults.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-1 text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-500" />
                  Subject Mastery
                </h2>
                <p className="text-xs text-gray-400 mb-4">Percentile rank vs all teachers on this platform</p>
                <div className="space-y-3">
                  {specializationResults.map((result) => {
                    const pct = result.percentile
                    const isTop = pct >= 75
                    const colorClass = pct >= 95
                      ? "text-yellow-600 bg-yellow-50 border-yellow-200"
                      : pct >= 75
                      ? "text-green-600 bg-green-50 border-green-200"
                      : pct >= 50
                      ? "text-blue-600 bg-blue-50 border-blue-200"
                      : "text-gray-500 bg-gray-50 border-gray-200"
                    const rankLabel = pct >= 95 ? "Top 5%"
                      : pct >= 90 ? "Top 10%"
                      : pct >= 75 ? "Top 25%"
                      : pct >= 50 ? "Above Average"
                      : "Below Average"
                    const scoreColor = pct >= 75 ? "text-green-600" : pct >= 50 ? "text-blue-600" : "text-gray-500"
                    return (
                      <div key={result.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{result.subject}</p>
                          <p className="text-xs text-gray-500 font-medium">{LEVEL_LABELS[result.level] || result.level}</p>
                          <p className="text-xs text-gray-400">{result.score}% score • {result.correct_answers}/{result.total_questions} correct</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${colorClass}`}>
                            {isTop && <Trophy className="h-3 w-3" />}
                            {rankLabel}
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-black ${scoreColor}`}>{pct}th</p>
                            <p className="text-xs text-gray-400">percentile</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {isOwnProfile && (
                  <Link href="/dashboard/teacher/specialization-quiz" className="block mt-4">
                    <div className="flex items-center gap-2 text-xs text-green-600 hover:underline">
                      <Zap className="h-3.5 w-3.5" />
                      Take quiz for another subject or retake
                    </div>
                  </Link>
                )}
              </div>
            )}

            {/* Quiz Results */}
            {quizResults.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  Quiz Performance
                </h2>
                <div className="space-y-3">
                  {quizResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {result.subject}
                        </p>
                        <p className="text-xs text-gray-400">
                          {getQuizModeLabel(result.mode)} •{" "}
                          {new Date(result.created_at).toLocaleDateString(
                            "en-NG"
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-lg font-black ${
                            result.passed
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {result.score}%
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            result.passed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {result.passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Action Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">

              {/* Salary */}
              <div className="text-center mb-5">
                <p className="text-xs text-gray-500 mb-1">
                  Expected Monthly Salary
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(profile.salary_min)} –{" "}
                  {formatCurrency(profile.salary_max)}
                </p>
              </div>

              {/* School actions */}
              {viewerRole === "school" && !isOwnProfile && (
                <div className="space-y-3 mb-5">
                  {inviteSuccess ? (
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Invite sent successfully
                    </div>
                  ) : (
                    <Button
                      onClick={handleInvite}
                      disabled={isInviting}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2"
                    >
                      {isInviting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Invite to Apply
                    </Button>
                  )}
                  {profile.cv_url && (
                    <a
                      href={profile.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download CV
                      </Button>
                    </a>
                  )}
                </div>
              )}

              {/* Teacher own profile actions */}
              {isOwnProfile && (
                <div className="space-y-3 mb-5">
                  {profile.cv_url && (
                    <a
                      href={profile.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2 text-sm"
                      >
                        <Download className="h-4 w-4" />
                        View My CV
                      </Button>
                    </a>
                  )}
                  <Link href="/jobs">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4" />
                      Browse Jobs
                    </Button>
                  </Link>
                </div>
              )}

              {/* Subject Mastery sidebar widget */}
              {isOwnProfile && (
                <div className="mb-5 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-bold text-gray-900">Subject Mastery</p>
                  </div>
                  {specializationResults.length > 0 ? (
                    <>
                      <div className="space-y-1.5 mb-3">
                        {specializationResults.slice(0, 2).map((r) => (
                          <div key={r.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 truncate">{r.subject} <span className="text-gray-400 text-xs">({LEVEL_LABELS[r.level] || r.level})</span></span>
                            <span className="font-bold text-green-600 flex-shrink-0 ml-2">{r.percentile}th %ile</span>
                          </div>
                        ))}
                      </div>
                      <Link href="/dashboard/teacher/specialization-quiz">
                        <Button size="sm" variant="outline" className="w-full text-xs border-green-300 text-green-700 hover:bg-green-50">
                          <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                          Take Another Subject
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-3">
                        Take a 5-min quiz to show your rank vs other teachers.
                      </p>
                      <Link href="/dashboard/teacher/specialization-quiz">
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white text-xs">
                          <Zap className="h-3.5 w-3.5 mr-1.5" />
                          Take Mastery Quiz
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Subject mastery results visible to schools */}
              {viewerRole === "school" && specializationResults.length > 0 && (
                <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-bold text-gray-900">Subject Mastery</p>
                  </div>
                  <div className="space-y-2">
                    {specializationResults.map((r) => {
                      const pct = r.percentile
                      const color = pct >= 75 ? "text-green-600" : pct >= 50 ? "text-blue-600" : "text-gray-500"
                      const label = pct >= 95 ? "Top 5%" : pct >= 90 ? "Top 10%" : pct >= 75 ? "Top 25%" : pct >= 50 ? "Above Avg" : "Below Avg"
                      return (
                        <div key={r.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 font-medium">{r.subject} <span className="text-gray-400 font-normal">({LEVEL_LABELS[r.level] || r.level})</span></span>
                          <span className={`font-bold ${color}`}>{label} ({pct}th %ile)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {profile.lga}, {profile.state}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {profile.years_experience} year
                    {profile.years_experience !== 1 ? "s" : ""} experience
                  </span>
                </div>
                {profile.willing_to_relocate && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    <span>Open to relocation</span>
                  </div>
                )}
                {profile.accommodation_needed && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Home className="h-4 w-4 flex-shrink-0" />
                    <span>Needs accommodation</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>{getTRCNLabel(profile.trcn_status)}</span>
                </div>
              </div>
            </div>

            {/* Upgrade prompt for guests */}
            {viewerRole === "guest" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Are you a school?
                </p>
                <p className="text-xs text-blue-600 mb-3">
                  Register to invite teachers and access full profiles.
                </p>
                <Link href="/register/school">
                  <Button
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white w-full"
                  >
                    Register Your School
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}