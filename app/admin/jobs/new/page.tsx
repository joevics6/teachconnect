"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, BookOpen, Search, School, X, EyeOff } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/button"
import { StateLgaSelect } from "@/components/ui/StateLgaSelect"
import { BENEFITS, getSubjectsForLevel } from "@/lib/constants"
import { LevelSubjectPicker, splitIntoSubjectJobs } from "@/components/LevelSubjectPicker"
import type { TeachingLevel, TeacherLevelSubjects } from "@/types"
import { getFetchErrorMessage } from "@/lib/network-error"

const SCHOOL_TYPES = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "international", label: "International" },
  { value: "missionary", label: "Missionary" },
]

interface JobFormData {
  title: string
  level_subjects: TeacherLevelSubjects[]
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

const EMPTY_JOB: JobFormData = {
  title: "", level_subjects: [], employment_type: "full-time",
  positions: "1", salary_min: "", salary_max: "", accommodation_offered: false,
  accommodation_type: "", benefits: [], description: "", required_qualifications: "",
  preferred_qualifications: "", deadline: "", external_apply_enabled: false,
  external_apply_value: "",
}

interface SchoolFormData {
  school_name: string
  school_type: string
  state: string
  lga: string
  website: string
  about: string
  claim_note: string
}

const EMPTY_SCHOOL: SchoolFormData = {
  school_name: "", school_type: "", state: "", lga: "", website: "", about: "", claim_note: "",
}

interface ExistingSchool {
  id: string
  school_name: string
  state: string
  lga: string
}

export default function AdminNewJobPage() {
  const [jobData, setJobData] = useState<JobFormData>(EMPTY_JOB)
  const [schoolData, setSchoolData] = useState<SchoolFormData>(EMPTY_SCHOOL)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [aiInput, setAiInput] = useState("")
  const [aiParsing, setAiParsing] = useState(false)
  const [aiError, setAiError] = useState("")
  const [aiSuccess, setAiSuccess] = useState(false)

  // School: pick an existing admin-created school, fill in a new one,
  // or post "anonymously" — a fresh "Confidential School" stub with a
  // real location but no name, for posts where the source (e.g. a
  // Facebook listing) never says who's hiring. Anonymous jobs always
  // require an external apply contact — there's no real school account
  // to receive in-app applications.
  const [schoolMode, setSchoolMode] = useState<"new" | "existing" | "anonymous">("new")
  const [schoolSearch, setSchoolSearch] = useState("")
  const [schoolResults, setSchoolResults] = useState<ExistingSchool[]>([])
  const [searchingSchools, setSearchingSchools] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<ExistingSchool | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [postedCount, setPostedCount] = useState(1)

  const updateJob = <K extends keyof JobFormData>(field: K, value: JobFormData[K]) => {
    setJobData((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: "" }))
  }
  const updateSchool = <K extends keyof SchoolFormData>(field: K, value: SchoolFormData[K]) => {
    setSchoolData((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: "" }))
  }

  const toggleBenefit = (benefit: string) => {
    setJobData((f) => {
      const has = f.benefits.includes(benefit)
      return { ...f, benefits: has ? f.benefits.filter((b) => b !== benefit) : [...f.benefits, benefit] }
    })
  }

  const isAnonymousMode = schoolMode === "anonymous"

  // Live search over admin-created schools once "existing" mode is picked.
  const searchSchools = useCallback(async (q: string) => {
    setSearchingSchools(true)
    try {
      const params = new URLSearchParams({ exclude_anonymous: "true" })
      if (q) params.set("search", q)
      const res = await fetch(`/api/admin/schools?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSchoolResults(data.schools || [])
      }
    } catch {
      // silent — this is just a picker, the form below still works
    } finally {
      setSearchingSchools(false)
    }
  }, [])

  useEffect(() => {
    if (schoolMode !== "existing" || selectedSchool) return
    const t = setTimeout(() => searchSchools(schoolSearch), 300)
    return () => clearTimeout(t)
  }, [schoolMode, schoolSearch, selectedSchool, searchSchools])

  const handleAiParse = async () => {
    if (!aiInput.trim()) {
      setAiError("Please paste a job description first")
      return
    }
    setAiParsing(true)
    setAiError("")
    setAiSuccess(false)
    try {
      const response = await fetch("/api/admin/jobs/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiInput }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Parsing failed")

      const job = data.parsed?.job
      if (job) {
        if (job.title) updateJob("title", job.title)
        // The parser detects one subject and a set of levels, not a
        // per-level breakdown — apply that single subject to every
        // level it found (same best-effort approach as CV parsing on
        // teacher registration). Admin can add more subjects manually.
        if (job.teaching_levels?.length) {
          updateJob(
            "level_subjects",
            (job.teaching_levels as TeachingLevel[]).map((level) => {
              const options = getSubjectsForLevel(level)
              const subjects = options.length === 1 ? options : job.subject ? [job.subject] : []
              return { level, subjects }
            })
          )
        }
        if (job.employment_type) updateJob("employment_type", job.employment_type)
        if (job.positions) updateJob("positions", String(job.positions))
        if (job.salary_min) updateJob("salary_min", String(job.salary_min))
        if (job.salary_max) updateJob("salary_max", String(job.salary_max))
        if (job.accommodation_offered !== undefined) updateJob("accommodation_offered", job.accommodation_offered)
        if (job.accommodation_type) updateJob("accommodation_type", job.accommodation_type)
        if (job.benefits?.length) updateJob("benefits", job.benefits)
        if (job.description) updateJob("description", job.description)
        if (job.required_qualifications) updateJob("required_qualifications", job.required_qualifications)
        if (job.apply_contact) {
          updateJob("external_apply_enabled", true)
          updateJob("external_apply_value", job.apply_contact)
        }
      }

      // Only pre-fill the "new"/"anonymous" school forms — never
      // silently override an existing school the admin already picked
      // from search. Anonymous mode still wants state/lga (real,
      // known) even though school_name is never used there.
      const school = data.parsed?.school
      if (school && (schoolMode === "new" || schoolMode === "anonymous")) {
        if (schoolMode === "new" && school.school_name) updateSchool("school_name", school.school_name)
        if (school.school_type) updateSchool("school_type", school.school_type)
        if (school.state) updateSchool("state", school.state)
        if (school.lga) updateSchool("lga", school.lga)
        if (schoolMode === "new" && school.website) updateSchool("website", school.website)
        if (schoolMode === "new" && school.about) updateSchool("about", school.about)
      }

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
    if (!jobData.title) newErrors.title = "Job title is required"
    if (jobData.level_subjects.length === 0) newErrors.level_subjects = "Select at least one teaching level"
    else if (jobData.level_subjects.some((ls) => ls.subjects.length === 0))
      newErrors.subjects = "Select at least one subject for each level"
    if (!jobData.description) newErrors.description = "Job description is required"
    if (!jobData.required_qualifications) newErrors.required_qualifications = "Required qualifications is required"
    if (jobData.accommodation_offered && !jobData.accommodation_type) newErrors.accommodation_type = "Select accommodation type"
    if ((jobData.external_apply_enabled || isAnonymousMode) && !jobData.external_apply_value.trim())
      newErrors.external_apply_value = "Enter an email, phone number, or URL"

    if (schoolMode === "existing") {
      if (!selectedSchool) newErrors.school_pick = "Pick a school from the list"
    } else {
      // "new" and "anonymous" both need type + location; only "new" needs a name.
      if (schoolMode === "new" && !schoolData.school_name.trim()) newErrors.school_name = "Required"
      if (!schoolData.school_type) newErrors.school_type = "Required"
      if (!schoolData.state) newErrors.state = "Required"
      if (!schoolData.lga) newErrors.lga = "Required"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      const order = [
        "title", "level_subjects", "accommodation_type",
        "external_apply_value", "description", "required_qualifications",
        "school_name", "school_type", "state", "lga", "school_pick",
      ]
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
      let schoolId = selectedSchool?.id

      if (schoolMode === "new" || schoolMode === "anonymous") {
        const schoolRes = await fetch("/api/admin/schools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...schoolData, is_anonymous: schoolMode === "anonymous" }),
        })
        const schoolResult = await schoolRes.json()
        if (!schoolRes.ok) throw new Error(schoolResult.error || "Failed to create school")
        schoolId = schoolResult.school.id
      }

      const jobSplits = splitIntoSubjectJobs(jobData.title, jobData.level_subjects)
      let posted = 0
      for (const split of jobSplits) {
        const jobRes = await fetch(`/api/admin/schools/${schoolId}/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...jobData, title: split.title, subject: split.subject, teaching_levels: split.teaching_levels }),
        })
        const jobResult = await jobRes.json()
        if (!jobRes.ok) {
          // The school (if new/anonymous) was created successfully even
          // though the job failed — say so, since it showing up in
          // /admin/schools afterward isn't a bug, it's exactly what happened.
          const base = jobSplits.length > 1
            ? `Posted ${posted} of ${jobSplits.length} — failed on "${split.subject}": ${jobResult.error || "unknown error"}`
            : jobResult.error || "Failed to post job"
          throw new Error(
            schoolMode !== "existing" && posted === 0
              ? `School was created, but posting the job failed: ${base}. You can post from the Schools tab.`
              : base
          )
        }
        posted++
      }

      setPostedCount(posted)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Something went wrong"))
      document.getElementById("new-job-top")?.scrollIntoView({ behavior: "smooth" })
    } finally {
      setSubmitting(false)
    }
  }

  const resetAll = () => {
    setJobData(EMPTY_JOB)
    setSchoolData(EMPTY_SCHOOL)
    setAiInput("")
    setSchoolMode("new")
    setSelectedSchool(null)
    setSchoolSearch("")
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <AdminShell>
        <div className="max-w-xl mx-auto p-6 text-center py-20">
          <CheckCircle2 className="h-12 w-12 text-ink-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{postedCount > 1 ? `${postedCount} Jobs Posted` : "Job Posted"}</h1>
          <p className="text-gray-500 text-sm mb-6">
            {postedCount > 1 ? `${postedCount} jobs are live` : "The job is live"}{
              schoolMode === "anonymous"
                ? <> as a <span className="font-medium">Confidential School</span> posting</>
                : selectedSchool
                ? <> for <span className="font-medium">{selectedSchool.school_name}</span></>
                : ""
            }.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={resetAll}>Post Another</Button>
            <Link href="/admin/jobs">
              <Button className="bg-ink-600 hover:bg-ink-700 text-white">Back to Jobs</Button>
            </Link>
          </div>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div id="new-job-top" className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <Link href="/admin/jobs" className="text-sm text-gray-500 flex items-center gap-1 mb-2 hover:text-gray-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Jobs
          </Link>
          <h1 className="text-xl font-bold text-gray-900">New Job</h1>
          <p className="text-sm text-gray-500 mt-1">Goes live immediately — no approval step needed.</p>
        </div>

        {submitError && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{submitError}</p>
        )}

        {/* AI Parse — fills both the job form and the new-school form below */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-ink-600" />
            <h2 className="font-bold text-gray-900 text-sm">Paste a job post</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Paste whatever was posted (e.g. from a Facebook group) — this fills in the job details below, and the school details too if the school isn&apos;t already registered here.
          </p>
          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
            placeholder="e.g. Bright Kids Academy in Ikeja, Lagos is hiring a Mathematics teacher for SSS classes. Full-time, salary 100k-120k..."
          />
          {aiError && <p className="text-red-500 text-xs mb-2">{aiError}</p>}
          {aiSuccess && (
            <p className="text-ink-600 text-xs mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />Fields filled in below — review and adjust as needed.
            </p>
          )}
          <Button onClick={handleAiParse} disabled={aiParsing} variant="outline" size="sm" className="flex items-center gap-1.5">
            {aiParsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Fill Fields with AI
          </Button>
        </div>

        {/* Core job fields */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div id="field-title">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
            <input
              value={jobData.title}
              onChange={(e) => updateJob("title", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. Mathematics Teacher"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div id="field-level_subjects">
            <LevelSubjectPicker
              value={jobData.level_subjects}
              onChange={(v) => updateJob("level_subjects", v)}
              levelsError={errors.level_subjects}
              subjectsError={errors.subjects}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment Type</label>
              <select
                value={jobData.employment_type}
                onChange={(e) => updateJob("employment_type", e.target.value)}
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
                value={jobData.positions}
                onChange={(e) => updateJob("positions", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div id="field-salary_max">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Salary Range (₦) — optional</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={jobData.salary_min}
                onChange={(e) => updateJob("salary_min", e.target.value)}
                placeholder="Min"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={jobData.salary_max}
                onChange={(e) => updateJob("salary_max", e.target.value)}
                placeholder="Max"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Application Deadline (optional — defaults to 30 days)</label>
            <input
              type="date"
              value={jobData.deadline}
              onChange={(e) => updateJob("deadline", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={jobData.accommodation_offered}
                onChange={(e) => updateJob("accommodation_offered", e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700">Accommodation offered</span>
            </label>
            {jobData.accommodation_offered && (
              <div id="field-accommodation_type">
                <select
                  value={jobData.accommodation_type}
                  onChange={(e) => updateJob("accommodation_type", e.target.value)}
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
                    jobData.benefits.includes(b)
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
              checked={jobData.external_apply_enabled}
              disabled={isAnonymousMode}
              onChange={(e) => updateJob("external_apply_enabled", e.target.checked)}
            />
          </label>
          <p className="text-gray-500 text-xs mb-3">
            {isAnonymousMode
              ? "Required for anonymous postings — there's no school account to receive in-app applications, so applicants must use this contact instead."
              : "If you got a direct contact (email/phone/website) from the school, applicants can use it instead of the built-in form. Separate multiple with commas."}
          </p>
          {jobData.external_apply_enabled && (
            <div id="field-external_apply_value">
              <input
                value={jobData.external_apply_value}
                onChange={(e) => updateJob("external_apply_value", e.target.value)}
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
              value={jobData.description}
              onChange={(e) => updateJob("description", e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          <div id="field-required_qualifications">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Required Qualifications</label>
            <textarea
              value={jobData.required_qualifications}
              onChange={(e) => updateJob("required_qualifications", e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
            {errors.required_qualifications && <p className="text-red-500 text-xs mt-1">{errors.required_qualifications}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Qualifications (optional)</label>
            <textarea
              value={jobData.preferred_qualifications}
              onChange={(e) => updateJob("preferred_qualifications", e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* School — picked from existing, or created fresh, at the bottom */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <School className="h-4 w-4 text-ink-600" />
            <h2 className="font-bold text-gray-900 text-sm">School</h2>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { setSchoolMode("new"); setSelectedSchool(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                schoolMode === "new" ? "bg-ink-600 text-white border-ink-600" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              New School
            </button>
            <button
              type="button"
              onClick={() => setSchoolMode("existing")}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                schoolMode === "existing" ? "bg-ink-600 text-white border-ink-600" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              Existing School
            </button>
            <button
              type="button"
              onClick={() => {
                setSchoolMode("anonymous")
                setSelectedSchool(null)
                // Anonymous postings always need an external apply
                // contact — force it on the moment this mode is chosen.
                updateJob("external_apply_enabled", true)
              }}
              className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-1.5 ${
                schoolMode === "anonymous" ? "bg-ink-600 text-white border-ink-600" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              <EyeOff className="h-3.5 w-3.5" />
              Anonymous
            </button>
          </div>

          {isAnonymousMode && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
              For posts where the source never names the school. This job goes live as <span className="font-medium">&quot;Confidential School&quot;</span> — you still enter the real type and location, since those are usually known even when the name isn&apos;t. Applicants apply via an external contact instead of the built-in form.
            </p>
          )}

          {schoolMode === "existing" ? (
            <div id="field-school_pick">
              {selectedSchool ? (
                <div className="flex items-center justify-between px-4 py-2.5 border border-ink-200 bg-ink-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedSchool.school_name}</p>
                    <p className="text-xs text-gray-500">{selectedSchool.lga}, {selectedSchool.state}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedSchool(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                      placeholder="Search schools already added here"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto">
                    {searchingSchools ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>
                    ) : schoolResults.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No matching schools — try &quot;New School&quot; instead.</p>
                    ) : (
                      schoolResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSchool(s)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"
                        >
                          <p className="font-medium text-gray-900">{s.school_name}</p>
                          <p className="text-xs text-gray-500">{s.lga}, {s.state}</p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
              {errors.school_pick && <p className="text-red-500 text-xs mt-1">{errors.school_pick}</p>}
            </div>
          ) : (
            <>
              {!isAnonymousMode && (
                <div id="field-school_name">
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input
                    value={schoolData.school_name}
                    onChange={(e) => updateSchool("school_name", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g. Bright Kids Academy"
                  />
                  {errors.school_name && <p className="text-red-500 text-xs mt-1">{errors.school_name}</p>}
                </div>
              )}

              <div id="field-school_type">
                <label className="block text-sm font-medium text-gray-700 mb-2">School Type</label>
                <div className="flex flex-wrap gap-2">
                  {SCHOOL_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => updateSchool("school_type", t.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        schoolData.school_type === t.value
                          ? "bg-ink-600 text-white border-ink-600"
                          : "bg-white text-gray-600 border-gray-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {errors.school_type && <p className="text-red-500 text-xs mt-1">{errors.school_type}</p>}
              </div>

              <div id="field-state">
                <StateLgaSelect
                  state={schoolData.state}
                  lga={schoolData.lga}
                  onStateChange={(s) => updateSchool("state", s)}
                  onLgaChange={(l) => updateSchool("lga", l)}
                  stateError={errors.state}
                  lgaError={errors.lga}
                />
              </div>

              {!isAnonymousMode && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                    <input
                      value={schoolData.website}
                      onChange={(e) => updateSchool("website", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                      placeholder="schoolwebsite.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">About (optional)</label>
                    <textarea
                      value={schoolData.about}
                      onChange={(e) => updateSchool("about", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                      placeholder="Brief description of the school"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAnonymousMode ? "Internal Note (optional — e.g. where you found this)" : "Claim Note (optional — internal, e.g. where you found this school)"}
                </label>
                <input
                  value={schoolData.claim_note}
                  onChange={(e) => updateSchool("claim_note", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. Found via Lagos Teachers FB group, contact: 080..."
                />
              </div>
            </>
          )}
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
