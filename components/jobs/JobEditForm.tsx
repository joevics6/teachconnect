"use client"

// ============================================================
// components/jobs/JobEditForm.tsx
// Shared edit form for an already-posted job — used by both the
// school dashboard (/dashboard/school/jobs/[id]/edit) and the admin
// job editor (/admin/jobs/[id]/edit). Editing a single existing job
// is a different shape than posting a NEW one: a job row has exactly
// one `subject` (not a multi-subject splitting picker), so this
// deliberately does not reuse LevelSubjectPicker.
// ============================================================

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TEACHING_LEVELS, BENEFITS, getSubjectsForLevels } from "@/lib/constants"
import type { TeachingLevel } from "@/types"
import { getFetchErrorMessage } from "@/lib/network-error"

const MAX_QUIZ_LEVELS = 2
const MAX_QUIZ_SUBJECTS = 3
const MAX_CUSTOM_SUBJECT_LENGTH = 60

export interface EditableJob {
  id: string
  title: string
  subject: string
  teaching_levels: TeachingLevel[]
  employment_type: string
  positions: number
  salary_min: number | null
  salary_max: number | null
  accommodation_offered: boolean
  accommodation_type: string | null
  benefits: string[] | null
  description: string
  required_qualifications: string
  preferred_qualifications: string | null
  deadline: string
  external_apply_enabled: boolean
  external_apply_value: string | null
  quiz_enabled: boolean
  quiz_subject_levels: { level: string; subject: string }[] | null
  quiz_pass_mark: number | null
  quiz_mode: string | null
  quiz_duration: number | null
  quiz_question_count: number | null
  is_featured: boolean
  is_private: boolean
}

interface FormState {
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
  quiz_enabled: boolean
  quiz_levels: string[]
  quiz_subject_levels: { level: string; subject: string }[]
  quiz_pass_mark: number
  quiz_mode: string
  quiz_duration: number
  quiz_question_count: number
}

function toFormState(job: EditableJob): FormState {
  return {
    title: job.title,
    subject: job.subject,
    teaching_levels: job.teaching_levels ?? [],
    employment_type: job.employment_type,
    positions: String(job.positions ?? 1),
    salary_min: job.salary_min ? String(job.salary_min) : "",
    salary_max: job.salary_max ? String(job.salary_max) : "",
    accommodation_offered: job.accommodation_offered ?? false,
    accommodation_type: job.accommodation_type ?? "",
    benefits: job.benefits ?? [],
    description: job.description ?? "",
    required_qualifications: job.required_qualifications ?? "",
    preferred_qualifications: job.preferred_qualifications ?? "",
    deadline: job.deadline ? job.deadline.split("T")[0] : "",
    external_apply_enabled: job.external_apply_enabled ?? false,
    external_apply_value: job.external_apply_value ?? "",
    quiz_enabled: job.quiz_enabled ?? false,
    quiz_levels: Array.from(new Set((job.quiz_subject_levels ?? []).map((sl) => sl.level))),
    quiz_subject_levels: job.quiz_subject_levels ?? [],
    quiz_pass_mark: job.quiz_pass_mark ?? 70,
    quiz_mode: job.quiz_mode ?? "speed",
    quiz_duration: job.quiz_duration ?? 20,
    quiz_question_count: job.quiz_question_count ?? 20,
  }
}

export function JobEditForm({
  job,
  submitUrl,
  schoolName,
  onSaved,
  cancelHref,
}: {
  job: EditableJob
  submitUrl: string
  schoolName?: string
  onSaved: () => void
  cancelHref: string
}) {
  const [formData, setFormData] = useState<FormState>(toFormState(job))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [addingCustomSubject, setAddingCustomSubject] = useState(false)
  const [customSubjectInput, setCustomSubjectInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: "" }))
  }

  const toggleLevel = (level: TeachingLevel) => {
    const has = formData.teaching_levels.includes(level)
    update("teaching_levels", has ? formData.teaching_levels.filter((l) => l !== level) : [...formData.teaching_levels, level])
  }

  const toggleBenefit = (benefit: string) => {
    const has = formData.benefits.includes(benefit)
    update("benefits", has ? formData.benefits.filter((b) => b !== benefit) : [...formData.benefits, benefit])
  }

  const subjectOptions = getSubjectsForLevels(formData.teaching_levels)
  const isCustomSubject = !!formData.subject && !subjectOptions.includes(formData.subject)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title) newErrors.title = "Job title is required"
    if (!formData.subject) newErrors.subject = "Subject is required"
    if (formData.teaching_levels.length === 0) newErrors.teaching_levels = "Select at least one level"
    // Salary is optional, same as it's optional on admin job posting
    // and now the DB defaults to 0/0 ("not disclosed") — editing
    // shouldn't introduce a requirement that posting never had.
    if (!formData.description) newErrors.description = "Job description is required"
    if (!formData.required_qualifications) newErrors.required_qualifications = "Required qualifications is required"
    if (formData.accommodation_offered && !formData.accommodation_type) newErrors.accommodation_type = "Select accommodation type"
    if (formData.external_apply_enabled && !formData.external_apply_value.trim())
      newErrors.external_apply_value = "Enter an email, phone number, or URL"
    if (formData.quiz_enabled && formData.quiz_subject_levels.length === 0)
      newErrors.quiz_subjects = "Select at least one quiz subject"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      document.getElementById("edit-job-top")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch(submitUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          subject: formData.subject,
          teaching_levels: formData.teaching_levels,
          employment_type: formData.employment_type,
          positions: parseInt(formData.positions) || 1,
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : 0,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : 0,
          accommodation_offered: formData.accommodation_offered,
          accommodation_type: formData.accommodation_offered ? formData.accommodation_type : null,
          benefits: formData.benefits,
          description: formData.description,
          required_qualifications: formData.required_qualifications,
          preferred_qualifications: formData.preferred_qualifications || null,
          deadline: formData.deadline || undefined,
          external_apply_enabled: formData.external_apply_enabled,
          external_apply_value: formData.external_apply_enabled ? formData.external_apply_value.trim() : null,
          quiz_enabled: formData.quiz_enabled,
          quiz_subject_levels: formData.quiz_enabled ? formData.quiz_subject_levels : [],
          quiz_pass_mark: formData.quiz_pass_mark,
          quiz_mode: formData.quiz_mode,
          quiz_duration: formData.quiz_duration,
          quiz_question_count: formData.quiz_question_count,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save changes")
      onSaved()
    } catch (err) {
      setSubmitError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Failed to save changes"))
      document.getElementById("edit-job-top")?.scrollIntoView({ behavior: "smooth" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id="edit-job-top" className="space-y-6">
      {schoolName && (
        <p className="text-sm text-gray-500">
          Editing job for <span className="font-medium text-gray-700">{schoolName}</span>
        </p>
      )}

      {submitError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{submitError}</p>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
          <input
            value={formData.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Levels</label>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject / Position</label>
          {!addingCustomSubject ? (
            <>
              <select
                value={isCustomSubject ? "__custom__" : formData.subject}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setAddingCustomSubject(true)
                    setCustomSubjectInput(formData.subject)
                  } else {
                    update("subject", e.target.value)
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select subject</option>
                {isCustomSubject && <option value={formData.subject}>{formData.subject} (custom)</option>}
                {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="__custom__">+ Custom subject not in this list…</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                A custom subject won&apos;t be available for the subject quiz.
              </p>
            </>
          ) : (
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <input
                  autoFocus
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  maxLength={MAX_CUSTOM_SUBJECT_LENGTH}
                  placeholder="e.g. Yoruba Literature"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (customSubjectInput.trim()) {
                    update("subject", customSubjectInput.trim())
                    setAddingCustomSubject(false)
                  }
                }}
              >
                Set
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setAddingCustomSubject(false)}>
                Cancel
              </Button>
            </div>
          )}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Salary Range (₦) — optional</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Application Deadline</label>
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
            <div>
              <select
                value={formData.accommodation_type}
                onChange={(e) => update("accommodation_type", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select type</option>
                <option value="fully-furnished">Fully Furnished</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="allowance">Housing Allowance</option>
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
          Separate multiple ways to apply (email, phone, website) with commas.
        </p>
        {formData.external_apply_enabled && (
          <div>
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

      {/* Quiz */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <label className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-ink-600" />
            Quiz Screening
          </span>
          <input
            type="checkbox"
            checked={formData.quiz_enabled}
            onChange={(e) => update("quiz_enabled", e.target.checked)}
          />
        </label>

        {formData.quiz_enabled && (
          <div className="space-y-4 pt-3 border-t border-gray-100 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Grade Level{formData.quiz_levels.length > 1 ? "s" : ""} ({formData.quiz_levels.length}/{MAX_QUIZ_LEVELS})
              </label>
              <div className="flex flex-wrap gap-2">
                {TEACHING_LEVELS.filter((l) => l.value !== "non_teaching").map((l) => {
                  const isSelected = formData.quiz_levels.includes(l.value)
                  const atLimit = formData.quiz_levels.length >= MAX_QUIZ_LEVELS
                  return (
                    <button
                      key={l.value}
                      type="button"
                      disabled={!isSelected && atLimit}
                      onClick={() => {
                        if (isSelected) {
                          update("quiz_levels", formData.quiz_levels.filter((x) => x !== l.value))
                          update("quiz_subject_levels", formData.quiz_subject_levels.filter((sl) => sl.level !== l.value))
                        } else {
                          update("quiz_levels", [...formData.quiz_levels, l.value])
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        isSelected
                          ? "bg-ink-600 border-ink-600 text-white"
                          : atLimit
                          ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      {l.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {formData.quiz_levels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quiz Subjects ({formData.quiz_subject_levels.length}/{MAX_QUIZ_SUBJECTS})
                </label>
                <div className="space-y-3">
                  {formData.quiz_levels.map((level) => {
                    const levelLabel = TEACHING_LEVELS.find((l) => l.value === level)?.label || level
                    return (
                      <div key={level}>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">{levelLabel}</p>
                        <div className="flex flex-wrap gap-2">
                          {getSubjectsForLevels([level as TeachingLevel]).map((s) => {
                            const isSelected = formData.quiz_subject_levels.some((sl) => sl.subject === s && sl.level === level)
                            const atLimit = formData.quiz_subject_levels.length >= MAX_QUIZ_SUBJECTS
                            return (
                              <button
                                key={s}
                                type="button"
                                disabled={!isSelected && atLimit}
                                onClick={() => {
                                  const next = isSelected
                                    ? formData.quiz_subject_levels.filter((sl) => !(sl.subject === s && sl.level === level))
                                    : [...formData.quiz_subject_levels, { subject: s, level }]
                                  update("quiz_subject_levels", next)
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                                  isSelected
                                    ? "bg-ink-600 border-ink-600 text-white"
                                    : atLimit
                                    ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                                    : "bg-white border-gray-300 text-gray-700"
                                }`}
                              >
                                {s}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {errors.quiz_subjects && <p className="text-red-500 text-xs mt-1">{errors.quiz_subjects}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Minimum Pass Mark: {formData.quiz_pass_mark}%
              </label>
              <input
                type="range"
                min={40}
                max={100}
                step={5}
                value={formData.quiz_pass_mark}
                onChange={(e) => update("quiz_pass_mark", parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Job Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => update("description", e.target.value)}
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>
        <div>
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

      <div className="flex gap-3">
        <a href={cancelHref} className="flex-1">
          <Button variant="outline" className="w-full">Cancel</Button>
        </a>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 bg-ink-600 hover:bg-ink-700 text-white"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
