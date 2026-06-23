"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  Eye,
  GraduationCap,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Settings,
  Star,
  Users,
  X,
  XCircle,
  Clock,
  SlidersHorizontal,
  BookOpen,
  PenLine,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────

type PipelineStage =
  | "applied"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"

interface Applicant {
  id: string
  teacher_name: string
  teacher_photo_url: string | null
  teacher_state: string
  teacher_subjects: string[]
  teacher_levels: string[]
  years_experience: number
  trcn_status: string
  trcn_number: string | null
  cv_url: string | null
  willing_to_relocate: boolean
  accommodation_needed: boolean
  teacher_salary_min: number
  teacher_salary_max: number
  quiz_score: number | null
  quiz_passed: boolean | null
  quiz_time_taken: number | null
  pipeline_stage: PipelineStage
  school_notes: string | null
  created_at: string
  // quiz mode info from job
  quiz_mode?: "standard" | "speed" | "written"
}

interface JobInfo {
  id: string
  title: string
  subject: string
  quiz_enabled: boolean
  quiz_mode: string
  quiz_pass_mark: number
  status: string
  deadline: string
  total_applicants: number
  passed_quiz: number
}

// ─── Constants ───────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard/school", label: "Overview", icon: Building2 },
  { href: "/dashboard/school/jobs", label: "My Jobs", icon: Briefcase },
  { href: "/dashboard/school/jobs/applicants", label: "Applicants", icon: Users },
  { href: "/talent", label: "Browse Teachers", icon: GraduationCap },
  { href: "/dashboard/school/subscription", label: "Subscription", icon: CreditCard },
  { href: "/schools/me", label: "School Profile", icon: Building2 },
  { href: "/dashboard/school/settings", label: "Settings", icon: Settings },
]

const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string; bg: string }[] = [
  { value: "applied", label: "Applied", color: "text-gray-600", bg: "bg-gray-100" },
  { value: "shortlisted", label: "Shortlisted", color: "text-blue-700", bg: "bg-blue-100" },
  { value: "interview", label: "Interview", color: "text-purple-700", bg: "bg-purple-100" },
  { value: "offered", label: "Offered", color: "text-orange-700", bg: "bg-orange-100" },
  { value: "hired", label: "Hired", color: "text-green-700", bg: "bg-green-100" },
  { value: "rejected", label: "Rejected", color: "text-red-600", bg: "bg-red-100" },
]

// ─── Helpers ─────────────────────────────────────────────────

function getStageStyle(stage: PipelineStage) {
  return PIPELINE_STAGES.find((s) => s.value === stage) || PIPELINE_STAGES[0]
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function getQuizModeIcon(mode?: string) {
  if (mode === "speed") return Zap
  if (mode === "written") return PenLine
  return BookOpen
}

function getQuizModeLabel(mode?: string) {
  if (mode === "speed") return "Speed"
  if (mode === "written") return "Written"
  return "Standard"
}

// ─── Stage Badge ─────────────────────────────────────────────

function StageBadge({ stage }: { stage: PipelineStage }) {
  const style = getStageStyle(stage)
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.color}`}
    >
      {style.label}
    </span>
  )
}

// ─── Stage Selector Dropdown ──────────────────────────────────

function StageSelector({
  current,
  onChange,
  isLoading,
}: {
  current: PipelineStage
  onChange: (stage: PipelineStage) => void
  isLoading: boolean
}) {
  const [open, setOpen] = useState(false)
  const style = getStageStyle(current)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${style.bg} ${style.color} border-transparent hover:opacity-80`}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          style.label
        )}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {PIPELINE_STAGES.map((stage) => (
              <button
                key={stage.value}
                onClick={() => {
                  onChange(stage.value)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-gray-50 transition text-left ${
                  current === stage.value ? "bg-gray-50" : ""
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-400"
                />
                <span className={stage.color}>{stage.label}</span>
                {current === stage.value && (
                  <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Notes Modal ──────────────────────────────────────────────

function NotesModal({
  applicant,
  onSave,
  onClose,
}: {
  applicant: Applicant
  onSave: (id: string, notes: string) => Promise<void>
  onClose: () => void
}) {
  const [notes, setNotes] = useState(applicant.school_notes || "")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onSave(applicant.id, notes)
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">
            Notes — {applicant.teacher_name}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Add private notes about this applicant..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Notes
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Applicant Card ───────────────────────────────────────────

function ApplicantCard({
  applicant,
  jobInfo,
  onStageChange,
  onNotesClick,
  stageLoading,
}: {
  applicant: Applicant
  jobInfo: JobInfo
  onStageChange: (id: string, stage: PipelineStage) => void
  onNotesClick: (applicant: Applicant) => void
  stageLoading: string | null
}) {
  const QuizIcon = getQuizModeIcon(applicant.quiz_mode || jobInfo.quiz_mode)
  const isRejected = applicant.pipeline_stage === "rejected"

  return (
    <div
      className={`bg-white border rounded-xl p-5 transition-all ${
        isRejected
          ? "border-gray-100 opacity-60"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-4">

        {/* Avatar */}
        <div className="flex-shrink-0">
          {applicant.teacher_photo_url ? (
            <img
              src={applicant.teacher_photo_url}
              alt={applicant.teacher_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-50">
              <span className="text-blue-700 font-bold text-sm">
                {getInitials(applicant.teacher_name)}
              </span>
            </div>
          )}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-sm">
                  {applicant.teacher_name}
                </h3>
                {applicant.trcn_status === "registered" && (
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                    TRCN ✓
                  </span>
                )}
                {applicant.willing_to_relocate && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">
                    Open to relocate
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {applicant.teacher_state}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {applicant.years_experience} yr
                  {applicant.years_experience !== 1 ? "s" : ""} exp
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  Applied{" "}
                  {new Date(applicant.created_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>

            {/* Stage Selector */}
            <StageSelector
              current={applicant.pipeline_stage}
              onChange={(stage) => onStageChange(applicant.id, stage)}
              isLoading={stageLoading === applicant.id}
            />
          </div>

          {/* Subjects & Levels */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {applicant.teacher_subjects.slice(0, 3).map((subject) => (
              <span
                key={subject}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg"
              >
                {subject}
              </span>
            ))}
            {applicant.teacher_subjects.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-lg">
                +{applicant.teacher_subjects.length - 3} more
              </span>
            )}
            {applicant.teacher_levels.map((level) => (
              <span
                key={level}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-lg uppercase"
              >
                {level}
              </span>
            ))}
          </div>

          {/* Quiz Score */}
          {jobInfo.quiz_enabled && (
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  applicant.quiz_passed
                    ? "bg-green-50 border-green-200 text-green-700"
                    : applicant.quiz_score !== null
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                <QuizIcon className="h-3.5 w-3.5" />
                {applicant.quiz_score !== null ? (
                  <>
                    {getQuizModeLabel(applicant.quiz_mode || jobInfo.quiz_mode)} Quiz:{" "}
                    <span className="font-bold">{applicant.quiz_score}%</span>
                    {applicant.quiz_passed ? (
                      <CheckCircle2 className="h-3 w-3 ml-0.5" />
                    ) : (
                      <XCircle className="h-3 w-3 ml-0.5" />
                    )}
                    {applicant.quiz_time_taken && (
                      <span className="text-gray-400 ml-1">
                        • {formatTime(applicant.quiz_time_taken)}
                      </span>
                    )}
                  </>
                ) : (
                  "Quiz not taken"
                )}
              </div>
              <span className="text-xs text-gray-400">
                Pass mark: {jobInfo.quiz_pass_mark}%
              </span>
            </div>
          )}

          {/* Notes preview */}
          {applicant.school_notes && (
            <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700 line-clamp-2">
                📝 {applicant.school_notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/teacher/${applicant.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 flex items-center gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                View Profile
              </Button>
            </Link>
            {applicant.cv_url && (
              <a
                href={applicant.cv_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download CV
                </Button>
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 flex items-center gap-1.5"
              onClick={() => onNotesClick(applicant)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {applicant.school_notes ? "Edit Notes" : "Add Notes"}
            </Button>
            {applicant.pipeline_stage !== "rejected" &&
              applicant.pipeline_stage !== "hired" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5"
                  onClick={() => onStageChange(applicant.id, "rejected")}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function ApplicantsPage() {
  const params = useParams()
  const jobId = params.id as string

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stageLoading, setStageLoading] = useState<string | null>(null)
  const [notesApplicant, setNotesApplicant] = useState<Applicant | null>(null)
  const [activeStageFilter, setActiveStageFilter] = useState<PipelineStage | "all">("all")
  const [minScore, setMinScore] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"newest" | "score_high" | "score_low">("newest")

  const fetchApplicants = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/school/jobs/${jobId}/applicants`
      )
      const data = await response.json()
      setJobInfo(data.job)
      setApplicants(data.applicants || [])
    } catch (err) {
      console.error("Failed to fetch applicants:", err)
    } finally {
      setIsLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    if (jobId) fetchApplicants()
  }, [fetchApplicants, jobId])

  const handleStageChange = async (
    applicantId: string,
    stage: PipelineStage
  ) => {
    setStageLoading(applicantId)
    try {
      const response = await fetch(
        `/api/school/jobs/${jobId}/applicants/${applicantId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipeline_stage: stage }),
        }
      )
      if (!response.ok) throw new Error("Failed to update stage")
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicantId ? { ...a, pipeline_stage: stage } : a
        )
      )
    } catch (err) {
      console.error(err)
    } finally {
      setStageLoading(null)
    }
  }

  const handleSaveNotes = async (applicantId: string, notes: string) => {
    try {
      const response = await fetch(
        `/api/school/jobs/${jobId}/applicants/${applicantId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ school_notes: notes }),
        }
      )
      if (!response.ok) throw new Error("Failed to save notes")
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicantId ? { ...a, school_notes: notes } : a
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Filter and sort
  const filtered = applicants
    .filter((a) => {
      if (activeStageFilter !== "all" && a.pipeline_stage !== activeStageFilter)
        return false
      if (jobInfo?.quiz_enabled && a.quiz_score !== null && a.quiz_score < minScore)
        return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === "score_high")
        return (b.quiz_score ?? 0) - (a.quiz_score ?? 0)
      if (sortBy === "score_low")
        return (a.quiz_score ?? 0) - (b.quiz_score ?? 0)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Stage counts
  const stageCounts = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.value] = applicants.filter(
      (a) => a.pipeline_stage === stage.value
    ).length
    return acc
  }, {} as Record<string, number>)

  const passedCount = applicants.filter((a) => a.quiz_passed).length

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-auto`}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white p-1.5 rounded-lg">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-xs text-gray-900">JobMeter</span>
              <span className="font-bold text-xs text-green-600">TeachConnect</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-blue-700" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                Greenfield Int&apos;l School
              </p>
              <p className="text-xs text-gray-500">Private • Lagos</p>
            </div>
          </div>
        </div>
        <nav className="p-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mb-0.5"
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition w-full">
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <Link
            href="/dashboard/school/jobs"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {jobInfo ? jobInfo.title : "Applicants"}
            </h1>
            {jobInfo && (
              <p className="text-xs text-gray-500">
                {jobInfo.subject} •{" "}
                {jobInfo.status === "active" ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-gray-400">Closed</span>
                )}{" "}
                • Deadline: {new Date(jobInfo.deadline).toLocaleDateString("en-NG")}
              </p>
            )}
          </div>
        </header>

        <div className="p-6 space-y-5">

          {/* Stats Row */}
          {jobInfo && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Applicants",
                  value: applicants.length,
                  color: "text-blue-600",
                },
                {
                  label: "Passed Quiz",
                  value: jobInfo.quiz_enabled ? passedCount : "N/A",
                  color: "text-green-600",
                },
                {
                  label: "Shortlisted",
                  value: stageCounts.shortlisted || 0,
                  color: "text-purple-600",
                },
                {
                  label: "Hired",
                  value: stageCounts.hired || 0,
                  color: "text-orange-600",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className={`text-2xl font-bold mb-1 ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pipeline Stage Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 flex-wrap">
            <button
              onClick={() => setActiveStageFilter("all")}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeStageFilter === "all"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              All
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeStageFilter === "all"
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {applicants.length}
              </span>
            </button>
            {PIPELINE_STAGES.map((stage) => (
              <button
                key={stage.value}
                onClick={() => setActiveStageFilter(stage.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeStageFilter === stage.value
                    ? `${stage.bg} ${stage.color}`
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {stage.label}
                {stageCounts[stage.value] > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs ${
                      activeStageFilter === stage.value
                        ? "bg-white/50"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {stageCounts[stage.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filter & Sort Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </Button>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as typeof sortBy)
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest first</option>
              <option value="score_high">Highest quiz score</option>
              <option value="score_low">Lowest quiz score</option>
            </select>

            <span className="text-xs text-gray-500 ml-auto">
              Showing {filtered.length} of {applicants.length} applicants
            </span>
          </div>

          {/* Filter Panel */}
          {showFilters && jobInfo?.quiz_enabled && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Minimum Quiz Score: {minScore}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-48 accent-blue-600"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMinScore(0)}
                  className="text-xs text-red-500 hover:text-red-600 mt-4"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          {/* Applicant List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-100 rounded w-20" />
                        <div className="h-6 bg-gray-100 rounded w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                No applicants found
              </h3>
              <p className="text-gray-500 text-sm">
                {activeStageFilter !== "all"
                  ? "No applicants in this stage yet."
                  : "No one has applied to this job yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((applicant) => (
                <ApplicantCard
                  key={applicant.id}
                  applicant={applicant}
                  jobInfo={jobInfo!}
                  onStageChange={handleStageChange}
                  onNotesClick={setNotesApplicant}
                  stageLoading={stageLoading}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {notesApplicant && (
        <NotesModal
          applicant={notesApplicant}
          onSave={handleSaveNotes}
          onClose={() => setNotesApplicant(null)}
        />
      )}
    </div>
  )
}