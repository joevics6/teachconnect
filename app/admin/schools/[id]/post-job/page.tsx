"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, BookOpen } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/button"
import { TEACHING_LEVELS, BENEFITS, getSubjectsForLevels } from "@/lib/constants"
import type { TeachingLevel } from "@/types"
import { getFetchErrorMessage } from "@/lib/network-error"

interface FormData {
  title: string
  subject: string
  teaching_levels: TeachingLevel[]
  employment_type: string
  positions: string
  salary_min: string
  salary_max: string
  accommodation_offered: boolean
  accommodation_type: string
  benefits: string[]
  description: string
  required_qualifications: string
  preferred_qualifications: string
  deadline: string
  external_apply_enabled: boolean
  external_apply_value: string
}

const EMPTY_FORM: FormData = {
  title: "", subject: "", teaching_levels: [], employment_type: "full-time",
  positions: "1", salary_min: "", salary_max: "", accommodation_offered: false,
  accommodation_type: "", benefits: [], description: "", required_qualifications: "",
  preferred_qualifications: "", deadline: "", external_apply_enabled: false,
  external_apply_value: "",
}

export default function AdminSchoolPostJobPage() {
  const params = useParams()
  const schoolId = params.id as string

  const [schoolName, setSchoolName] = useState("")
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [aiInput, setAiInput] = useState("")
  const [aiParsing, setAiParsing] = useState(false)
  const [aiError, setAiError] = useState("")
  const [aiSuccess, setAiSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/schools/${schoolId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.school?.school_name) setSchoolName(data.school.school_name)
      })
      .catch(() => {})
  }, [schoolId])

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: "" }))
  }

  const toggleLevel = (level: TeachingLevel) => {
    setFormData((f) => {
      const has = f.teaching_levels.includes(level)
      return { ...f, teaching_levels: has ? f.teaching_levels.filter((l) => l !== level) : [...f.teaching_levels, level] }
    })
  }

  const toggleBenefit = (benefit: string) => {
    setFormData((f) => {
      const has = f.benefits.includes(benefit)
      return { ...f, benefits: has ? f.benefits.filter((b) => b !== benefit) : [...f.benefits, benefit] }
    })
  }

  const subjectOptions = getSubjectsForLevels(formData.teaching_levels)

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
      if (parsed.teaching_levels?.length) update("teaching_levels", parsed.teaching_levels)
      if (parsed.employment_type) update("employment_type", parsed.employment_type)
      if (parsed.positions) update("positions", String(parsed.positions))
      if (parsed.salary_min) update("salary_min", String(parsed.salary_min))
      if (parsed.salary_max) update("salary_max", String(parsed.salary_max))
      if (parsed.accommodation_offered !== undefined) update("accommodation_offered", parsed.accommodation_offered)
      if (parsed.accommodation_type) update("accommodation_type", parsed.accommodation_type)
      if (parsed.benefits?.length) update("benefits", parsed.benefits)
      if (parsed.description) update("description", parsed.description)
      if (parsed.required_qualifications) update("required_qualifications", parsed.required_qualifications)

      setAiSuccess(true)
    } catch (err) {
      setAiError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Parsing failed"))
    } finally {
      setAiParsing(false)
    }
  }

  const scrollToField = (key: string) => {
    document.getElementById(`field-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title) newErrors.title = "Job title is required"
    if (!formData.subject) newErrors.subject = "Subject is required"
    if (formData.teaching_levels.length === 0) newErrors.teaching_levels = "Select at least one level"
    if (!formData.salary_min && !formData.salary_max) newErrors.salary_max = "Enter a minimum or maximum salary"
    if (!formData.description) newErrors.description = "Job description is required"
    if (!formData.required_qualifications) newErrors.required_qualifications = "Required qualifications is required"
    if (formData.accommodation_offered && !formData.accommodation_type) newErrors.accommodation_type = "Select accommodation type"
    if (formData.external_apply_enabled && !formData.external_apply_value.trim())
      newErrors.external_apply_value = "Enter an email, phone number, or URL"
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      const order = ["title", "subject", "teaching_levels", "salary_max", "accommodation_type", "external_apply_value", "description", "required_qualifications"]
      const first = order.find((k) => newErrors[k])
      if (first) requestAnimationFrame(() => scrollToField(first))
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to post job")
      setSubmitted(true)
    } catch (err) {
      setSubmitError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Failed to post job"))
      document.getElementById("post-job-top")?.scrollIntoView({ behavior: "smooth" })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <AdminShell>
        <div className="max-w-xl mx-auto p-6 text-center py-20">
          <CheckCircle2 className="h-12 w-12 text-ink-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Job Posted</h1>
          <p className="text-gray-500 text-sm mb-6">
            The job is live for {schoolName || "this school"}.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setFormData(EMPTY_FORM); setAiInput(""); setSubmitted(false) }}>
              Post Another
            </Button>
            <Link href="/admin/schools">
              <Button className="bg-ink-600 hover:bg-ink-700 text-white">Back to Schools</Button>
            </Link>
          </div>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div id="post-job-top" className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <Link href="/admin/schools" className="text-sm text-gray-500 flex items-center gap-1 mb-2 hover:text-gray-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Schools
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            Post a Job {schoolName && <>for <span className="text-ink-600">{schoolName}</span></>}
          </h1>
          <p className="text-sm text-gray-500 mt-1">This job goes live immediately — no approval step needed.</p>
        </div>

        {submitError && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{submitError}</p>
        )}

        {/* AI Parse */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-ink-600" />
            <h2 className="font-bold text-gray-900 text-sm">Paste a job description</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">Paste whatever the school posted on Facebook — we&apos;ll fill in the fields below.</p>
          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
            placeholder="e.g. Hiring a Mathematics teacher for SSS classes in Ikeja, Lagos. Full-time, salary 100k-120k..."
          />
          {aiError && <p className="text-red-500 text-xs mb-2">{aiError}</p>}
          {aiSuccess && <p className="text-ink-600 text-xs mb-2 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Fields filled in below — review and adjust as needed.</p>}
          <Button onClick={handleAiParse} disabled={aiParsing} variant="outline" size="sm" className="flex items-center gap-1.5">
            {aiParsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Fill Fields with AI
          </Button>
        </div>

        {/* Core fields */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div id="field-title">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
            <input
              value={formData.title}
              onChange={(e) => update("title", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. Mathematics Teacher"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div id="field-teaching_levels">
            <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Level(s)</label>
            <div className="flex flex-wrap gap-2">
              {TEACHING_LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => toggleLevel(l.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    formData.teaching_levels.includes(l.value)
                      ? "bg-ink-600 text-white border-ink-600"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {errors.teaching_levels && <p className="text-red-500 text-xs mt-1">{errors.teaching_levels}</p>}
          </div>

          <div id="field-subject">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => update("subject", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select subject</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment Type</label>
              <select
                value={formData.employment_type}
                onChange={(e) => update("employment_type", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Positions</label>
              <input
                type="number"
                min={1}
                value={formData.positions}
                onChange={(e) => update("positions", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div id="field-salary_max">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Salary Range (₦)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={formData.salary_min}
                onChange={(e) => update("salary_min", e.target.value)}
                placeholder="Min"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={formData.salary_max}
                onChange={(e) => update("salary_max", e.target.value)}
                placeholder="Max"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            {errors.salary_max && <p className="text-red-500 text-xs mt-1">{errors.salary_max}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Application Deadline (optional — defaults to 30 days)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={formData.accommodation_offered}
                onChange={(e) => update("accommodation_offered", e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700">Accommodation offered</span>
            </label>
            {formData.accommodation_offered && (
              <div id="field-accommodation_type">
                <select
                  value={formData.accommodation_type}
                  onChange={(e) => update("accommodation_type", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select type</option>
                  <option value="shared">Shared</option>
                  <option value="private">Private</option>
                </select>
                {errors.accommodation_type && <p className="text-red-500 text-xs mt-1">{errors.accommodation_type}</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
            <div className="flex flex-wrap gap-2">
              {BENEFITS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBenefit(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    formData.benefits.includes(b)
                      ? "bg-ink-600 text-white border-ink-600"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* External apply */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-900 text-sm">External Application</span>
            <input
              type="checkbox"
              checked={formData.external_apply_enabled}
              onChange={(e) => update("external_apply_enabled", e.target.checked)}
            />
          </label>
          <p className="text-gray-500 text-xs mb-3">
            If you got a direct contact (email/phone/website) from the school, applicants can use it instead of the built-in form. Separate multiple with commas.
          </p>
          {formData.external_apply_enabled && (
            <div id="field-external_apply_value">
              <input
                value={formData.external_apply_value}
                onChange={(e) => update("external_apply_value", e.target.value)}
                placeholder="e.g. jobs@school.com, +2348012345678"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
              {errors.external_apply_value && <p className="text-red-500 text-xs mt-1">{errors.external_apply_value}</p>}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div id="field-description">
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Full Job Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => update("description", e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          <div id="field-required_qualifications">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Required Qualifications</label>
            <textarea
              value={formData.required_qualifications}
              onChange={(e) => update("required_qualifications", e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
            {errors.required_qualifications && <p className="text-red-500 text-xs mt-1">{errors.required_qualifications}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Qualifications (optional)</label>
            <textarea
              value={formData.preferred_qualifications}
              onChange={(e) => update("preferred_qualifications", e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-ink-600 hover:bg-ink-700 text-white py-3"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Job"}
        </Button>
      </div>
    </AdminShell>
  )
}
