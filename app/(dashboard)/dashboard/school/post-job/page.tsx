"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Info,
  Loader2,
  Menu,
  Sparkles,
  Zap,
  BookOpen,
  PenLine,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SUBJECTS, TEACHING_LEVELS, BENEFITS } from "@/lib/constants"
import { SchoolSidebar } from "@/components/dashboard/SchoolSidebar"

const ACCOMMODATION_TYPES = [
  { value: "fully-furnished", label: "Fully Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "allowance", label: "Housing Allowance" },
]

const MAX_QUIZ_SUBJECTS = 3

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
]

const QUIZ_MODES = [
  {
    value: "standard",
    label: "Standard Quiz",
    icon: BookOpen,
    desc: "Fixed questions, time limit. Best for structured assessment.",
    color: "blue",
  },
  {
    value: "speed",
    label: "Speed Quiz",
    icon: Zap,
    desc: "Answer as many as possible in the time. Tests breadth of knowledge.",
    color: "orange",
  },
  {
    value: "written",
    label: "Written Quiz",
    icon: PenLine,
    desc: "Open-ended questions graded by AI. Tests depth of understanding.",
    color: "purple",
  },
]

const SPEED_DURATIONS = [
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 20, label: "20 minutes" },
]

const STANDARD_DURATIONS = [
  { value: 10, label: "10 minutes" },
  { value: 20, label: "20 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
]

const WRITTEN_QUESTION_COUNTS = [
  { value: 5, label: "5 questions" },
  { value: 10, label: "10 questions" },
]

const STANDARD_QUESTION_COUNTS = [
  { value: 10, label: "10 questions" },
  { value: 20, label: "20 questions" },
  { value: 30, label: "30 questions" },
]

type QuizMode = "standard" | "speed" | "written"

interface FormData {
  title: string
  subject: string
  teaching_levels: string[]
  employment_type: string
  positions: string
  deadline: string
  salary_min: string
  salary_max: string
  accommodation_offered: boolean
  accommodation_type: string
  benefits: string[]
  is_private: boolean
  is_featured: boolean
  quiz_enabled: boolean
  quiz_mode: QuizMode
  quiz_subjects: string[]
  quiz_difficulty: string
  quiz_pass_mark: number
  quiz_duration: number
  quiz_question_count: number
  custom_questions: string[]
  description: string
  required_qualifications: string
  preferred_qualifications: string
}

const EMPTY_FORM: FormData = {
  title: "",
  subject: "",
  teaching_levels: [],
  employment_type: "",
  positions: "1",
  deadline: "",
  salary_min: "",
  salary_max: "",
  accommodation_offered: false,
  accommodation_type: "",
  benefits: [],
  is_private: false,
  is_featured: false,
  quiz_enabled: false,
  quiz_mode: "standard",
  quiz_subjects: [],
  quiz_difficulty: "",
  quiz_pass_mark: 70,
  quiz_duration: 20,
  quiz_question_count: 20,
  custom_questions: ["", "", ""],
  description: "",
  required_qualifications: "",
  preferred_qualifications: "",
}

function Toggle({
  value,
  onChange,
  color = "blue",
}: {
  value: boolean
  onChange: (v: boolean) => void
  color?: "blue" | "green" | "yellow" | "purple"
}) {
  const colors = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-500",
    purple: "bg-purple-600",
  }
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
        value ? colors[color] : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

export default function PostJobPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)

  const [aiInput, setAiInput] = useState("")
  const [aiParsing, setAiParsing] = useState(false)
  const [aiError, setAiError] = useState("")
  const [aiSuccess, setAiSuccess] = useState(false)

  const update = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const toggleLevel = (value: string) => {
    const current = formData.teaching_levels
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    update("teaching_levels", updated)
  }

  const toggleBenefit = (value: string) => {
    const current = formData.benefits
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    update("benefits", updated)
  }

  const updateCustomQuestion = (index: number, value: string) => {
    const updated = [...formData.custom_questions]
    updated[index] = value
    update("custom_questions", updated)
  }

  const handleQuizModeChange = (mode: QuizMode) => {
    update("quiz_mode", mode)
    // Set sensible defaults per mode
    if (mode === "speed") {
      update("quiz_duration", 10)
      update("quiz_question_count", 50)
      update("quiz_pass_mark", 60)
    } else if (mode === "written") {
      update("quiz_question_count", 5)
      update("quiz_pass_mark", 70)
    } else {
      update("quiz_duration", 20)
      update("quiz_question_count", 20)
      update("quiz_pass_mark", 70)
    }
  }

  const handleAiParse = async () => {
    if (!aiInput.trim()) {
      setAiError("Please describe the job first")
      return
    }
    setAiParsing(true)
    setAiError("")
    setAiSuccess(false)
    try {
      const response = await fetch("/api/school/jobs/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiInput }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Parsing failed")

      const parsed = data.parsed
      if (parsed.title) update("title", parsed.title)
      if (parsed.subject) update("subject", parsed.subject)
      if (parsed.teaching_levels?.length)
        update("teaching_levels", parsed.teaching_levels)
      if (parsed.employment_type)
        update("employment_type", parsed.employment_type)
      if (parsed.positions) update("positions", String(parsed.positions))
      if (parsed.salary_min) update("salary_min", String(parsed.salary_min))
      if (parsed.salary_max) update("salary_max", String(parsed.salary_max))
      if (parsed.accommodation_offered !== undefined)
        update("accommodation_offered", parsed.accommodation_offered)
      if (parsed.accommodation_type)
        update("accommodation_type", parsed.accommodation_type)
      if (parsed.benefits?.length) update("benefits", parsed.benefits)
      if (parsed.description) update("description", parsed.description)
      if (parsed.required_qualifications)
        update("required_qualifications", parsed.required_qualifications)
      if (parsed.quiz_enabled !== undefined)
        update("quiz_enabled", parsed.quiz_enabled)
      if (parsed.is_private !== undefined)
        update("is_private", parsed.is_private)

      setAiSuccess(true)
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Parsing failed")
    } finally {
      setAiParsing(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title) newErrors.title = "Job title is required"
    if (!formData.subject) newErrors.subject = "Subject is required"
    if (formData.teaching_levels.length === 0)
      newErrors.teaching_levels = "Select at least one level"
    if (!formData.employment_type)
      newErrors.employment_type = "Employment type is required"
    if (!formData.deadline) newErrors.deadline = "Deadline is required"
    if (!formData.salary_min)
      newErrors.salary_min = "Minimum salary is required"
    if (!formData.salary_max)
      newErrors.salary_max = "Maximum salary is required"
    if (
      formData.salary_min &&
      formData.salary_max &&
      Number(formData.salary_max) <= Number(formData.salary_min)
    )
      newErrors.salary_max = "Maximum must be greater than minimum"
    if (!formData.description)
      newErrors.description = "Job description is required"
    if (!formData.required_qualifications)
      newErrors.required_qualifications = "Required qualifications is required"
    if (formData.quiz_enabled && formData.quiz_subjects.length === 0)
      newErrors.quiz_subjects = "Select at least one subject (max 3)"
    if (formData.quiz_enabled && !formData.quiz_difficulty)
      newErrors.quiz_difficulty = "Select a grade level"
    if (formData.accommodation_offered && !formData.accommodation_type)
      newErrors.accommodation_type = "Select accommodation type"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    setUpgradeRequired(false)
    try {
      const response = await fetch("/api/school/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) {
        if (data.upgrade_required) setUpgradeRequired(true)
        throw new Error(data.error || "Failed to post job")
      }
      setSubmitted(true)
    } catch (err: unknown) {
      setErrors({
        submit: err instanceof Error ? err.message : "Failed to post job",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Job Posted Successfully
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your vacancy is now live. Teachers will start applying shortly.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/school/jobs">
              <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                View My Jobs
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSubmitted(false)
                setFormData(EMPTY_FORM)
                setAiInput("")
                setAiSuccess(false)
              }}
            >
              Post Another Job
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      <SchoolSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <Link href="/dashboard/school" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Post a Job</h1>
        </header>

        <div className="p-6 max-w-4xl mx-auto space-y-6">

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between gap-3 flex-wrap">
              <span>{errors.submit}</span>
              {upgradeRequired && (
                <Link href="/dashboard/school/subscription">
                  <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white flex-shrink-0">
                    Upgrade Plan
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* ── AI Parser ── */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <h2 className="font-bold text-gray-900">AI Job Parser</h2>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                Premium
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Describe the job in plain English and AI will fill the form for
              you. e.g. &quot;We need a full-time Mathematics teacher for SSS,
              salary ₦80,000–₦100,000, accommodation provided, TRCN
              required.&quot;
            </p>
            <textarea
              value={aiInput}
              onChange={(e) => {
                setAiInput(e.target.value)
                setAiError("")
                setAiSuccess(false)
              }}
              rows={4}
              placeholder="Describe the job vacancy in your own words..."
              className="w-full px-4 py-3 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white resize-none mb-3"
            />
            {aiError && <p className="text-red-500 text-xs mb-3">{aiError}</p>}
            {aiSuccess && (
              <div className="flex items-center gap-2 text-green-700 text-sm mb-3 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Form filled successfully. Review and adjust before posting.
              </div>
            )}
            <Button
              type="button"
              onClick={handleAiParse}
              disabled={aiParsing}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              {aiParsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Parse &amp; Fill Form
                </>
              )}
            </Button>
          </div>

          {/* ── Job Details ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Job Details
            </h2>
            <div className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Senior Mathematics Teacher"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => update("subject", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Employment Type
                  </label>
                  <div className="flex gap-2">
                    {EMPLOYMENT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => update("employment_type", type.value)}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                          formData.employment_type === type.value
                            ? "bg-blue-700 text-white border-blue-700"
                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  {errors.employment_type && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.employment_type}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Teaching Level(s)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEACHING_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => toggleLevel(level.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        formData.teaching_levels.includes(level.value)
                          ? "bg-blue-700 text-white border-blue-700"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
                {errors.teaching_levels && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.teaching_levels}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Number of Positions
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.positions}
                    onChange={(e) => update("positions", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => update("deadline", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.deadline && (
                    <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Compensation ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-5">
              Compensation &amp; Benefits
            </h2>
            <div className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Monthly Salary Range (₦)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      value={formData.salary_min}
                      onChange={(e) => update("salary_min", e.target.value)}
                      placeholder="Minimum"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.salary_min && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.salary_min}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.salary_max}
                      onChange={(e) => update("salary_max", e.target.value)}
                      placeholder="Maximum"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.salary_max && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.salary_max}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Accommodation Offered
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Attracts teachers willing to relocate
                  </p>
                </div>
                <Toggle
                  value={formData.accommodation_offered}
                  onChange={(v) => update("accommodation_offered", v)}
                  color="blue"
                />
              </div>

              {formData.accommodation_offered && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accommodation Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ACCOMMODATION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => update("accommodation_type", type.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                          formData.accommodation_type === type.value
                            ? "bg-blue-700 text-white border-blue-700"
                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  {errors.accommodation_type && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.accommodation_type}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Additional Benefits
                </label>
                <div className="flex flex-wrap gap-2">
                  {BENEFITS.map((benefit) => (
                    <button
                      key={benefit}
                      type="button"
                      onClick={() => toggleBenefit(benefit)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        formData.benefits.includes(benefit)
                          ? "bg-blue-700 text-white border-blue-700"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {benefit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Visibility ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-5">Posting Visibility</h2>
            <div className="space-y-3">

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Private Posting
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Only visible to matched teachers — not listed publicly
                  </p>
                </div>
                <Toggle
                  value={formData.is_private}
                  onChange={(v) => update("is_private", v)}
                  color="blue"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-sm flex items-center gap-2">
                    Featured Listing
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                      +₦10,000
                    </span>
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Appear at the top of search results
                  </p>
                </div>
                <Toggle
                  value={formData.is_featured}
                  onChange={(v) => update("is_featured", v)}
                  color="yellow"
                />
              </div>
            </div>
          </div>

          {/* ── Quiz Screening ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                Quiz Screening
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  Recommended
                </span>
              </h2>
              <Toggle
                value={formData.quiz_enabled}
                onChange={(v) => update("quiz_enabled", v)}
                color="green"
              />
            </div>
            <p className="text-gray-500 text-xs mb-5">
              Teachers must pass a subject quiz before their application
              reaches you. Only qualified candidates get through.
            </p>

            {formData.quiz_enabled && (
              <div className="space-y-6 pt-5 border-t border-gray-100">

                {/* Quiz Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quiz Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {QUIZ_MODES.map((mode) => {
                      const Icon = mode.icon
                      const isSelected = formData.quiz_mode === mode.value
                      const colorMap: Record<string, string> = {
                        blue: isSelected
                          ? "bg-blue-700 border-blue-700 text-white"
                          : "border-gray-200 hover:border-blue-300",
                        orange: isSelected
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-200 hover:border-orange-300",
                        purple: isSelected
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "border-gray-200 hover:border-purple-300",
                      }
                      const iconColorMap: Record<string, string> = {
                        blue: isSelected ? "text-white" : "text-blue-600",
                        orange: isSelected ? "text-white" : "text-orange-500",
                        purple: isSelected ? "text-white" : "text-purple-600",
                      }
                      const descColorMap: Record<string, string> = {
                        blue: isSelected ? "text-blue-100" : "text-gray-400",
                        orange: isSelected ? "text-orange-100" : "text-gray-400",
                        purple: isSelected ? "text-purple-100" : "text-gray-400",
                      }
                      return (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => handleQuizModeChange(mode.value as QuizMode)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${colorMap[mode.color]}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`h-4 w-4 ${iconColorMap[mode.color]}`} />
                            <span className="text-sm font-bold">
                              {mode.label}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${descColorMap[mode.color]}`}>
                            {mode.desc}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Mode-specific settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Quiz Grade Level — all modes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Grade Level
                    </label>
                    <select
                      value={formData.quiz_difficulty}
                      onChange={(e) => update("quiz_difficulty", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select grade level</option>
                      {TEACHING_LEVELS.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                    {errors.quiz_difficulty && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.quiz_difficulty}
                      </p>
                    )}
                  </div>

                  {/* Quiz Subjects — all modes, up to 3, same grade level */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Quiz Subjects ({formData.quiz_subjects.length}/{MAX_QUIZ_SUBJECTS})
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Pick up to {MAX_QUIZ_SUBJECTS} subjects, all tested at the grade level above in one
                      combined quiz.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((s) => {
                        const isSelected = formData.quiz_subjects.includes(s)
                        const atLimit = formData.quiz_subjects.length >= MAX_QUIZ_SUBJECTS
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={!isSelected && atLimit}
                            onClick={() => {
                              const next = isSelected
                                ? formData.quiz_subjects.filter((x) => x !== s)
                                : [...formData.quiz_subjects, s]
                              update("quiz_subjects", next)
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : atLimit
                                ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                                : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
                            }`}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>
                    {errors.quiz_subjects && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.quiz_subjects}
                      </p>
                    )}
                  </div>

                  {/* Pass Mark — all modes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Minimum Pass Mark: {formData.quiz_pass_mark}%
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="5"
                      value={formData.quiz_pass_mark}
                      onChange={(e) =>
                        update("quiz_pass_mark", Number(e.target.value))
                      }
                      className="w-full accent-blue-600 mt-1"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>40%</span>
                      <span className="font-medium text-blue-600">
                        {formData.quiz_pass_mark}% pass mark
                      </span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Duration — speed and standard only */}
                  {formData.quiz_mode !== "written" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="h-3.5 w-3.5 inline mr-1 text-gray-400" />
                        Time Limit
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(formData.quiz_mode === "speed"
                          ? SPEED_DURATIONS
                          : STANDARD_DURATIONS
                        ).map((d) => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => update("quiz_duration", d.value)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                              formData.quiz_duration === d.value
                                ? formData.quiz_mode === "speed"
                                  ? "bg-orange-500 text-white border-orange-500"
                                  : "bg-blue-700 text-white border-blue-700"
                                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Count — standard and written */}
                  {formData.quiz_mode !== "speed" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Questions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(formData.quiz_mode === "written"
                          ? WRITTEN_QUESTION_COUNTS
                          : STANDARD_QUESTION_COUNTS
                        ).map((q) => (
                          <button
                            key={q.value}
                            type="button"
                            onClick={() =>
                              update("quiz_question_count", q.value)
                            }
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                              formData.quiz_question_count === q.value
                                ? formData.quiz_mode === "written"
                                  ? "bg-purple-600 text-white border-purple-600"
                                  : "bg-blue-700 text-white border-blue-700"
                                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                            }`}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mode info banners */}
                {formData.quiz_mode === "speed" && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <Zap className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-orange-700">
                      <p className="font-semibold mb-1">Speed Quiz mode</p>
                      <p>
                        Teachers will be shown questions one at a time and must
                        answer as many as possible within {formData.quiz_duration}{" "}
                        minutes. Score is based on correct answers out of total
                        attempted.
                      </p>
                    </div>
                  </div>
                )}

                {formData.quiz_mode === "written" && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <PenLine className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-700">
                      <p className="font-semibold mb-1">Written Quiz mode</p>
                      <p>
                        Teachers will type open-ended answers to{" "}
                        {formData.quiz_question_count} questions. Answers are
                        submitted to Gemini AI for grading with individual
                        feedback. No time limit. Best for testing deep subject
                        knowledge.
                      </p>
                    </div>
                  </div>
                )}

                {formData.quiz_mode === "standard" && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700">
                      <p className="font-semibold mb-1">Standard Quiz mode</p>
                      <p>
                        Teachers answer {formData.quiz_question_count} multiple
                        choice questions within {formData.quiz_duration} minutes.
                        Standard CBT format. Score is based on all questions
                        including unanswered ones.
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom Questions — MCQ modes only */}
                {formData.quiz_mode !== "written" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Custom Questions{" "}
                      <span className="text-gray-400 font-normal">
                        (optional, max 3)
                      </span>
                      <Info className="h-3.5 w-3.5 text-gray-400 inline ml-1" />
                    </label>
                    <p className="text-xs text-gray-400 mb-3">
                      Add school-specific questions alongside the standard
                      question bank.
                    </p>
                    <div className="space-y-3">
                      {formData.custom_questions.map((q, i) => (
                        <input
                          key={i}
                          type="text"
                          value={q}
                          onChange={(e) =>
                            updateCustomQuestion(i, e.target.value)
                          }
                          placeholder={`Custom question ${i + 1}`}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Job Description ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-5">Job Description</h2>
            <div className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Job Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={6}
                  placeholder="Describe the role, responsibilities, school culture, and what you're looking for..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Required Qualifications
                </label>
                <textarea
                  value={formData.required_qualifications}
                  onChange={(e) =>
                    update("required_qualifications", e.target.value)
                  }
                  rows={4}
                  placeholder="e.g. B.Ed or B.Sc in Mathematics, minimum 2 years experience, TRCN registered..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors.required_qualifications && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.required_qualifications}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Preferred Qualifications{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.preferred_qualifications}
                  onChange={(e) =>
                    update("preferred_qualifications", e.target.value)
                  }
                  rows={3}
                  placeholder="e.g. Master's degree, experience with Cambridge curriculum..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="flex items-center justify-between pb-6">
            <Link href="/dashboard/school">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Post Job
                </>
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}