"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  GraduationCap, Loader2, ArrowLeft, ArrowRight, CheckCircle2,
  Upload, AlertCircle, FileText, User, BookOpen, Settings2,
  ClipboardCheck, Eye, EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SUBJECTS, TEACHING_LEVELS } from "@/lib/constants"
import { StateLgaSelect, NIGERIAN_STATES } from "@/components/ui/StateLgaSelect"

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { number: 1, title: "Upload CV",        icon: FileText },
  { number: 2, title: "Personal Info",    icon: User },
  { number: 3, title: "Teaching Details", icon: BookOpen },
  { number: 4, title: "Preferences",      icon: Settings2 },
  { number: 5, title: "Review",           icon: ClipboardCheck },
]

const AVAILABILITY_OPTIONS = [
  { value: "immediate", label: "Immediately Available" },
  { value: "2-weeks",   label: "2 Weeks Notice" },
  { value: "1-month",   label: "1 Month Notice" },
  { value: "employed",  label: "Currently Employed" },
]

const TRCN_STATUS_OPTIONS = [
  { value: "registered",     label: "Registered" },
  { value: "pending",        label: "Registration Pending" },
  { value: "not-registered", label: "Not Yet Registered" },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParseMeta {
  skills_count: number
  work_experience_count: number
  education_count: number
  certifications_count: number
}

interface FormData {
  email: string
  password: string
  confirm_password: string
  full_name: string
  phone: string
  state: string
  lga: string
  teaching_levels: string[]
  subjects: string[]
  years_experience: string
  trcn_number: string
  trcn_status: string
  preferred_states: string[]
  willing_to_relocate: boolean
  accommodation_needed: boolean
  availability: string
  salary_min: string
  bio: string
  talent_pool: boolean
  photo_file: File | null
}

// ─── Salary display helper ────────────────────────────────────────────────────
function formatSalary(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString("en-NG")
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TeacherRegisterPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // CV
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvFileName, setCvFileName] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [parseSuccess, setParseSuccess] = useState(false)
  const [parseError, setParseError] = useState("")
  const [parseMeta, setParseMeta] = useState<ParseMeta | null>(null)
  const [parsePreview, setParsePreview] = useState<{
    name: string | null
    email: string | null
    phone: string | null
    location: string | null
    experience: string | null
    trcn_status: string | null
    subjects: string[]
    skills: string[]
    education: string | null
  } | null>(null)

  // Password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Photo
  const [photoPreview, setPhotoPreview] = useState("")

  // ── Onboarding cache — built locally, sent on final submit ────────────────
  const onboardingCache = useRef<Record<string, unknown>>({})

  const [formData, setFormData] = useState<FormData>({
    email: "", password: "", confirm_password: "",
    full_name: "", phone: "", state: "", lga: "",
    teaching_levels: [], subjects: [],
    years_experience: "", trcn_number: "", trcn_status: "",
    preferred_states: [], willing_to_relocate: false,
    accommodation_needed: false, availability: "", salary_min: "",
    bio: "", talent_pool: true, photo_file: null,
  })

  // ── Helpers ───────────────────────────────────────────────────────────────
  const update = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const toggleArray = (field: keyof FormData, value: string) => {
    const cur = formData[field] as string[]
    update(field, cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value])
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {}

    if (step === 1 && !cvFile && !parseError)
      e.cv_file = "Please upload your CV to continue"

    if (step === 2) {
      if (!formData.full_name) e.full_name = "Full name is required"
      if (!formData.email) e.email = "Email is required"
      else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Enter a valid email"
      if (!formData.password) e.password = "Password is required"
      else if (formData.password.length < 8) e.password = "Must be at least 8 characters"
      if (formData.password !== formData.confirm_password) e.confirm_password = "Passwords do not match"
      if (!formData.phone) e.phone = "Phone number is required"
      if (!formData.state) e.state = "State is required"
      if (!formData.lga) e.lga = "LGA is required"
    }

    if (step === 3) {
      if (formData.teaching_levels.length === 0) e.teaching_levels = "Select at least one teaching level"
      if (formData.subjects.length === 0) e.subjects = "Select at least one subject"
      if (!formData.years_experience) e.years_experience = "Years of experience is required"
      if (!formData.trcn_status) e.trcn_status = "TRCN status is required"
    }

    if (step === 4 && !formData.availability)
      e.availability = "Availability is required"

    if (step === 5) {
      if (!formData.bio) e.bio = "Bio is required"
      else if (formData.bio.length < 100) e.bio = "Bio must be at least 100 characters"
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (step === 2) {
      // Cache personal info before moving on
      onboardingCache.current = {
        ...onboardingCache.current,
        cv_name: formData.full_name,
        cv_email: formData.email,
        cv_phone: formData.phone,
        cv_location: formData.lga ? `${formData.lga}, ${formData.state}` : formData.state,
      }
    }
    if (step === 3) {
      // Cache teaching details
      onboardingCache.current = {
        ...onboardingCache.current,
        teaching_levels: formData.teaching_levels,
        subjects_taught: formData.subjects,
        years_of_teaching_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        trcn_number: formData.trcn_number || null,
        trcn_status: formData.trcn_status || null,
      }
    }
    if (step === 4) {
      // Cache preferences
      onboardingCache.current = {
        ...onboardingCache.current,
        preferred_states: formData.preferred_states,
        willing_to_relocate: formData.willing_to_relocate,
        accommodation_needed: formData.accommodation_needed,
        availability: formData.availability,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
      }
    }
    if (validate()) setStep((s) => s + 1)
  }

  const prevStep = () => setStep((s) => s - 1)

  // ── CV Upload ─────────────────────────────────────────────────────────────
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      setErrors((p) => ({ ...p, cv_file: "Only PDF files are allowed" }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, cv_file: "File must be under 5MB" }))
      return
    }

    setCvFile(file)
    setCvFileName(file.name)
    setParseSuccess(false)
    setParseError("")
    setParseMeta(null)
    setErrors((p) => ({ ...p, cv_file: "" }))
    setIsParsing(true)

    try {
      const payload = new FormData()
      payload.append("cv", file)
      payload.append("temp_id", crypto.randomUUID()) // dummy — real save happens on submit

      const res = await fetch("/api/teacher/parse-cv", { method: "POST", body: payload })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "CV parsing failed")

      const p = data.parsed

      // ── Store full rich data in local cache ──────────────────────────────
      onboardingCache.current = {
        cv_name:                     p.full_name ?? null,
        cv_email:                    p.email ?? null,
        cv_phone:                    p.phone ?? null,
        cv_location:                 p.location ?? null,
        cv_summary:                  p.summary ?? null,
        cv_roles:                    p.roles ?? [],
        cv_skills:                   p.skills ?? [],
        cv_work_experience:          p.work_experience ?? [],
        cv_education:                p.education ?? [],
        cv_certifications:           p.certifications ?? [],
        cv_awards:                   p.awards ?? [],
        cv_languages:                p.languages ?? [],
        cv_volunteer_work:           p.volunteer_work ?? [],
        cv_publications:             p.publications ?? [],
        cv_accomplishments:          p.accomplishments ?? [],
        cv_interests:                p.interests ?? [],
        cv_linkedin:                 p.linkedin ?? null,
        teaching_levels:             p.teaching_levels ?? [],
        subjects_taught:             p.subjects ?? [],
        curriculum_experience:       p.curriculum_experience ?? [],
        teaching_style:              p.teaching_style ?? [],
        classroom_management_skills: p.classroom_management_skills ?? [],
        lesson_delivery_mode:        p.lesson_delivery_mode ?? [],
        trcn_number:                 p.trcn_number ?? null,
        trcn_status:                 p.trcn_status ?? null,
        preferred_states:            p.preferred_states ?? [],
        willing_to_relocate:         p.willing_to_relocate ?? null,
        accommodation_needed:        p.accommodation_needed ?? null,
        availability:                p.availability ?? null,
        salary_min:                  p.salary_min ?? null,
        years_of_teaching_experience: p.years_experience ?? null,
        experience_level:            p.experience_level ?? null,
        cv_experience:               p.years_experience ? String(p.years_experience) : null,
      }

      // ── Pre-fill form (only empty fields) ────────────────────────────────
      if (p.full_name && !formData.full_name)  update("full_name", p.full_name)
      if (p.email    && !formData.email)        update("email",     p.email)
      if (p.phone    && !formData.phone)        update("phone",     p.phone)
      if (p.state    && !formData.state)        update("state",     p.state)
      if (p.lga      && !formData.lga)          update("lga",       p.lga)
      if (p.teaching_levels?.length > 0 && formData.teaching_levels.length === 0)
        update("teaching_levels", p.teaching_levels)
      if (p.subjects?.length > 0 && formData.subjects.length === 0)
        update("subjects", p.subjects)
      if (p.years_experience && !formData.years_experience)
        update("years_experience", String(p.years_experience))
      if (p.trcn_number && !formData.trcn_number) update("trcn_number", p.trcn_number)
      if (p.trcn_status && !formData.trcn_status) update("trcn_status", p.trcn_status)
      if (p.preferred_states?.length > 0 && formData.preferred_states.length === 0)
        update("preferred_states", p.preferred_states)
      if (p.willing_to_relocate != null)  update("willing_to_relocate",  p.willing_to_relocate)
      if (p.accommodation_needed != null) update("accommodation_needed", p.accommodation_needed)
      if (p.availability && !formData.availability) update("availability", p.availability)
      if (p.salary_min   && !formData.salary_min)   update("salary_min",   String(p.salary_min))
      if (p.bio          && !formData.bio)           update("bio",          p.bio)

      setParseMeta(p._meta ?? null)

      // Build preview from parsed data
      const edu = Array.isArray(p.education) && p.education.length > 0
        ? `${(p.education[0] as Record<string,string>).degree ?? ""} — ${(p.education[0] as Record<string,string>).institution ?? ""}`.trim().replace(/^—\s*|—\s*$/, "").trim()
        : null
      setParsePreview({
        name:        p.full_name ?? null,
        email:       p.email ?? null,
        phone:       p.phone ?? null,
        location:    [p.lga, p.state].filter(Boolean).join(", ") || p.location || null,
        experience:  p.years_experience ? `${p.years_experience} year${p.years_experience === 1 ? "" : "s"} teaching` : null,
        trcn_status: p.trcn_status ?? null,
        subjects:    (p.subjects ?? []).slice(0, 5),
        skills:      (p.skills ?? []).slice(0, 6),
        education:   edu,
      })
      setParseSuccess(true)
    } catch (err: unknown) {
      setParseError(
        err instanceof Error ? err.message : "CV parsing failed. Fill in the form manually."
      )
    } finally {
      setIsParsing(false)
    }
  }

  // ── Photo ─────────────────────────────────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrors((p) => ({ ...p, photo_file: "Only JPG or PNG allowed" })); return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((p) => ({ ...p, photo_file: "File must be under 2MB" })); return
    }
    update("photo_file", file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // ── Submit — sends form + full onboarding cache in one shot ───────────────
  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)

    // Final cache update with bio + talent_pool before sending
    onboardingCache.current = {
      ...onboardingCache.current,
      bio: formData.bio,
      talent_pool: formData.talent_pool,
    }

    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File)   payload.append(key, value)
        else if (Array.isArray(value)) payload.append(key, JSON.stringify(value))
        else                         payload.append(key, String(value ?? ""))
      })
      payload.append("onboarding_cache", JSON.stringify(onboardingCache.current))
      if (cvFile) payload.append("cv_file", cvFile)

      const res = await fetch("/api/auth/register/teacher", { method: "POST", body: payload })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Registration failed")

      window.location.href = "/dashboard/teacher"
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : "Registration failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
  const selectClass = `${inputClass} bg-white`

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="bg-green-600 text-white p-2 rounded-xl">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="font-bold text-gray-900">JobMeter</span>
              <span className="font-bold text-green-600">TeachConnect</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Teacher Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands of teachers finding better opportunities</p>
        </div>

        {/* Step bar */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all ${
                    step > s.number     ? "bg-green-600 text-white"
                    : step === s.number ? "bg-green-600 text-white ring-4 ring-green-100"
                    : "bg-gray-200 text-gray-500"
                  }`}>
                    {step > s.number ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium hidden sm:block ${step >= s.number ? "text-green-600" : "text-gray-400"}`}>
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all ${step > s.number ? "bg-green-600" : "bg-gray-200"}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
              {errors.submit}
            </div>
          )}

          {/* ── STEP 1: CV Upload ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              {!parseSuccess && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Upload Your CV</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Our AI reads your CV and auto-fills your profile. Takes about 15 seconds.
                  </p>
                </div>
              )}

              {isParsing && (
                <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <Loader2 className="h-5 w-5 text-purple-600 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-purple-900">Reading your CV…</p>
                    <p className="text-xs text-purple-600 mt-0.5">Extracting experience, subjects, credentials and more</p>
                  </div>
                </div>
              )}

              {parseSuccess && !isParsing && parsePreview && (
                <div className="border border-green-200 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-600">
                    <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />
                    <p className="text-sm font-semibold text-white">CV parsed — profile pre-filled</p>
                  </div>

                  {/* Personal details */}
                  <div className="bg-white px-4 py-4 space-y-2">
                    {parsePreview.name && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Name</span>
                        <span className="text-sm font-semibold text-gray-900">{parsePreview.name}</span>
                      </div>
                    )}
                    {parsePreview.email && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Email</span>
                        <span className="text-sm text-gray-700">{parsePreview.email}</span>
                      </div>
                    )}
                    {parsePreview.phone && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Phone</span>
                        <span className="text-sm text-gray-700">{parsePreview.phone}</span>
                      </div>
                    )}
                    {parsePreview.location && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Location</span>
                        <span className="text-sm text-gray-700">{parsePreview.location}</span>
                      </div>
                    )}
                    {parsePreview.experience && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Experience</span>
                        <span className="text-sm text-gray-700">{parsePreview.experience}</span>
                      </div>
                    )}
                    {parsePreview.education && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Education</span>
                        <span className="text-sm text-gray-700">{parsePreview.education}</span>
                      </div>
                    )}
                    {parsePreview.trcn_status && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">TRCN</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          parsePreview.trcn_status === "registered"
                            ? "bg-green-100 text-green-700"
                            : parsePreview.trcn_status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {parsePreview.trcn_status === "registered" ? "Registered"
                            : parsePreview.trcn_status === "pending" ? "Pending"
                            : "Not Registered"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Subjects + Skills + counts */}
                  <div className="bg-gray-50 border-t border-green-100 px-4 py-3 space-y-3">
                    {parsePreview.subjects.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1.5">Subjects detected</p>
                        <div className="flex flex-wrap gap-1.5">
                          {parsePreview.subjects.map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {parsePreview.skills.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1.5">Skills detected</p>
                        <div className="flex flex-wrap gap-1.5">
                          {parsePreview.skills.map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {parseMeta && (
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {[
                          { label: "Skills",         count: parseMeta.skills_count },
                          { label: "Work roles",     count: parseMeta.work_experience_count },
                          { label: "Qualifications", count: parseMeta.education_count },
                          { label: "Certifications", count: parseMeta.certifications_count },
                        ].map(({ label, count }) => (
                          <div key={label} className="bg-white rounded-lg p-2 text-center border border-gray-200">
                            <p className="text-base font-bold text-green-700">{count}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-green-50 px-4 py-2 border-t border-green-100">
                    <p className="text-xs text-green-700">Continue to review and adjust — all fields are editable.</p>
                  </div>
                </div>
              )}

              {parseError && !isParsing && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Parsing had an issue</p>
                    <p className="text-xs text-yellow-700 mt-0.5">{parseError}</p>
                    <p className="text-xs text-yellow-600 mt-1">You can still continue — fill in the form manually.</p>
                  </div>
                </div>
              )}

              <label className={`cursor-pointer flex items-center gap-3 w-full border-2 border-dashed rounded-xl transition ${
                parseSuccess ? "p-3 border-green-300 bg-green-50"
                : isParsing  ? "p-8 border-purple-300 bg-purple-50 cursor-not-allowed"
                : cvFileName ? "p-8 border-green-400 bg-green-50"
                : "p-10 flex-col justify-center border-gray-300 hover:border-green-400 hover:bg-green-50"
              }`}>
                {parseSuccess ? (
                  <>
                    <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-700 truncate">{cvFileName}</p>
                      <p className="text-xs text-green-500">Parsed ✓ — click to replace</p>
                    </div>
                    <Upload className="h-4 w-4 text-green-400 flex-shrink-0" />
                  </>
                ) : cvFileName ? (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-700">{cvFileName}</p>
                      <p className="text-xs text-green-500 mt-0.5">Click to replace</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">Click to upload your CV</p>
                      <p className="text-xs text-gray-400 mt-1">PDF only · Max 5MB</p>
                    </div>
                  </div>
                )}
                <input type="file" accept="application/pdf" onChange={handleCvUpload} disabled={isParsing} className="hidden" />
              </label>
              {errors.cv_file && <p className="text-red-500 text-xs">{errors.cv_file}</p>}

              {!cvFileName && (
                <p className="text-xs text-center text-gray-400">
                  No CV?{" "}
                  <button type="button" className="text-green-600 underline" onClick={() => setStep(2)}>
                    Skip and fill manually
                  </button>
                </p>
              )}
            </div>
          )}

          {/* ── STEP 2: Personal Info ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={formData.full_name} onChange={(e) => update("full_name", e.target.value)}
                  placeholder="e.g. Adaeze Okonkwo" className={inputClass} />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com" className={inputClass} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={(e) => update("phone", e.target.value)}
                    placeholder="e.g. 08012345678" className={inputClass} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Password with eye icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={formData.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="Min 8 characters" className={`${inputClass} pr-10`} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} value={formData.confirm_password}
                      onChange={(e) => update("confirm_password", e.target.value)}
                      placeholder="Repeat password" className={`${inputClass} pr-10`} />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
                </div>
              </div>

              {/* State + LGA dropdown component */}
              <StateLgaSelect
                state={formData.state} lga={formData.lga}
                onStateChange={(v) => update("state", v)}
                onLgaChange={(v) => update("lga", v)}
                stateError={errors.state} lgaError={errors.lga}
              />
            </div>
          )}

          {/* ── STEP 3: Teaching Details ──────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Teaching Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Teaching Level(s)</label>
                <div className="flex flex-wrap gap-2">
                  {TEACHING_LEVELS.map((level) => (
                    <button key={level.value} type="button" onClick={() => toggleArray("teaching_levels", level.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        formData.teaching_levels.includes(level.value)
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
                      }`}>
                      {level.label}
                    </button>
                  ))}
                </div>
                {errors.teaching_levels && <p className="text-red-500 text-xs mt-1">{errors.teaching_levels}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Subjects You Teach</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {SUBJECTS.map((subject) => (
                    <button key={subject} type="button" onClick={() => toggleArray("subjects", subject)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        formData.subjects.includes(subject)
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
                      }`}>
                      {subject}
                    </button>
                  ))}
                </div>
                {errors.subjects && <p className="text-red-500 text-xs mt-1">{errors.subjects}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Teaching Experience</label>
                  <input type="number" min="0" max="50" value={formData.years_experience}
                    onChange={(e) => update("years_experience", e.target.value)}
                    placeholder="e.g. 5" className={inputClass} />
                  {errors.years_experience && <p className="text-red-500 text-xs mt-1">{errors.years_experience}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">TRCN Status</label>
                  <select value={formData.trcn_status} onChange={(e) => update("trcn_status", e.target.value)} className={selectClass}>
                    <option value="">Select status</option>
                    {TRCN_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {errors.trcn_status && <p className="text-red-500 text-xs mt-1">{errors.trcn_status}</p>}
                </div>
              </div>

              {formData.trcn_status === "registered" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">TRCN Registration Number</label>
                  <input type="text" value={formData.trcn_number}
                    onChange={(e) => update("trcn_number", e.target.value)}
                    placeholder="Enter TRCN number" className={inputClass} />
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Preferences ──────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Job Preferences</h2>

              <div className="space-y-4">
                {([
                  { key: "willing_to_relocate"  as keyof FormData, label: "Willing to Relocate",  desc: "Open to jobs in other states" },
                  { key: "accommodation_needed" as keyof FormData, label: "Accommodation Needed", desc: "Show jobs that include accommodation" },
                ]).map((t) => (
                  <div key={t.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{t.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{t.desc}</p>
                    </div>
                    <button type="button" onClick={() => update(t.key, !formData[t.key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData[t.key] ? "bg-green-600" : "bg-gray-200"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData[t.key] ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>

              {formData.willing_to_relocate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred States <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                    {NIGERIAN_STATES.map((s) => (
                      <button key={s} type="button" onClick={() => toggleArray("preferred_states", s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          formData.preferred_states.includes(s)
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Availability</label>
                <select value={formData.availability} onChange={(e) => update("availability", e.target.value)} className={selectClass}>
                  <option value="">Select availability</option>
                  {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.availability && <p className="text-red-500 text-xs mt-1">{errors.availability}</p>}
              </div>

              {/* Salary with comma formatting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Minimum Expected Monthly Salary (₦)
                  <span className="ml-1 text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">₦</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.salary_min ? formatSalary(formData.salary_min) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "")
                      update("salary_min", raw)
                    }}
                    placeholder="e.g. 80,000"
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Review & Submit ───────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Review & Finish</h2>

              <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
                {[
                  { label: "Name",            value: formData.full_name || "—" },
                  { label: "Email",           value: formData.email || "—" },
                  { label: "Phone",           value: formData.phone || "—" },
                  { label: "Location",        value: [formData.lga, formData.state].filter(Boolean).join(", ") || "—" },
                  { label: "Teaching Levels", value: formData.teaching_levels.join(", ") || "—" },
                  { label: "Subjects",        value: formData.subjects.length ? `${formData.subjects.slice(0, 3).join(", ")}${formData.subjects.length > 3 ? ` +${formData.subjects.length - 3} more` : ""}` : "—" },
                  { label: "Experience",      value: formData.years_experience ? `${formData.years_experience} years` : "—" },
                  { label: "TRCN",            value: TRCN_STATUS_OPTIONS.find((o) => o.value === formData.trcn_status)?.label || "—" },
                  { label: "Availability",    value: AVAILABILITY_OPTIONS.find((o) => o.value === formData.availability)?.label || "—" },
                  { label: "Min. Salary",     value: formData.salary_min ? `₦${Number(formData.salary_min).toLocaleString("en-NG")}/mo` : "Not specified" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400">
                Need to change anything?{" "}
                <button type="button" onClick={() => setStep(2)} className="text-green-600 underline">Go back</button>
              </p>

              {/* Talent Pool */}
              <div
                onClick={() => update("talent_pool", !formData.talent_pool)}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.talent_pool ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
                  formData.talent_pool ? "bg-green-600 border-green-600" : "border-gray-300"
                }`}>
                  {formData.talent_pool && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Join the Talent Pool</p>
                  <p className="text-xs text-gray-500 mt-0.5">Make your profile visible to schools and recruiters actively looking for teachers. You can opt out anytime from your dashboard.</p>
                </div>
              </div>

              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Profile Photo <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {photoPreview
                      ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      : <GraduationCap className="h-8 w-8 text-gray-400" />}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                      <Upload className="h-4 w-4" /> Upload Photo
                      <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-400 mt-1">JPG or PNG · Max 2MB</p>
                    {errors.photo_file && <p className="text-red-500 text-xs mt-1">{errors.photo_file}</p>}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Professional Bio</label>
                <textarea value={formData.bio} onChange={(e) => update("bio", e.target.value)} rows={5}
                  placeholder="Tell schools about your teaching experience, approach, and what makes you a great teacher. Minimum 100 characters."
                  className={`${inputClass} resize-none`} />
                <div className="flex justify-between mt-1">
                  {errors.bio ? <p className="text-red-500 text-xs">{errors.bio}</p> : <span />}
                  <p className={`text-xs ${formData.bio.length >= 100 ? "text-green-600" : "text-gray-400"}`}>
                    {formData.bio.length}/100 min
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ────────────────────────────────────────────────── */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="text-gray-500">Already have an account?</Button>
              </Link>
            )}

            {step < 5 ? (
              <Button type="button" onClick={nextStep} disabled={isParsing}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                {isParsing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Parsing CV…</>
                  : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                {isLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Profile…</>
                  : <><CheckCircle2 className="h-4 w-4" /> Create Profile</>}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Are you a school?{" "}
          <Link href="/register/school" className="text-blue-600 hover:underline">Register your school here</Link>
        </p>
      </div>
    </div>
  )
}