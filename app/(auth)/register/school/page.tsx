"use client"

import { useState } from "react"
import Link from "next/link"
import {
  GraduationCap,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Upload,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NIGERIAN_STATES, TEACHING_LEVELS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"

const STEPS = [
  { number: 1, title: "School Details" },
  { number: 2, title: "Contact Person" },
  { number: 3, title: "Verification" },
]

const SCHOOL_TYPES = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "international", label: "International" },
  { value: "missionary", label: "Missionary" },
]

interface FormData {
  // Step 1
  school_name: string
  school_type: string
  school_levels: string[]
  state: string
  lga: string
  address: string
  website: string
  // Step 2
  contact_name: string
  contact_role: string
  contact_email: string
  password: string
  confirm_password: string
  contact_phone: string
  contact_phone_alt: string
  // Step 3
  cac_number: string
  logo_file: File | null
}

export default function SchoolRegisterPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoPreview, setLogoPreview] = useState("")

  const [formData, setFormData] = useState<FormData>({
    school_name: "",
    school_type: "",
    school_levels: [],
    state: "",
    lga: "",
    address: "",
    website: "",
    contact_name: "",
    contact_role: "",
    contact_email: "",
    password: "",
    confirm_password: "",
    contact_phone: "",
    contact_phone_alt: "",
    cac_number: "",
    logo_file: null,
  })

  const update = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const toggleLevel = (value: string) => {
    const current = formData.school_levels
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    update("school_levels", updated)
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.school_name)
        newErrors.school_name = "School name is required"
      if (!formData.school_type)
        newErrors.school_type = "School type is required"
      if (formData.school_levels.length === 0)
        newErrors.school_levels = "Select at least one level"
      if (!formData.state) newErrors.state = "State is required"
      if (!formData.lga) newErrors.lga = "LGA is required"
      if (!formData.address) newErrors.address = "Address is required"
      if (
        formData.website &&
        !/^https?:\/\/.+/.test(formData.website)
      )
        newErrors.website = "Enter a valid URL (https://...)"
    }

    if (step === 2) {
      if (!formData.contact_name)
        newErrors.contact_name = "Contact name is required"
      if (!formData.contact_role)
        newErrors.contact_role = "Contact role is required"
      if (!formData.contact_email)
        newErrors.contact_email = "Email is required"
      else if (!/\S+@\S+\.\S+/.test(formData.contact_email))
        newErrors.contact_email = "Enter a valid email"
      if (!formData.password)
        newErrors.password = "Password is required"
      else if (formData.password.length < 8)
        newErrors.password = "Password must be at least 8 characters"
      if (formData.password !== formData.confirm_password)
        newErrors.confirm_password = "Passwords do not match"
      if (!formData.contact_phone)
        newErrors.contact_phone = "Phone number is required"
    }

    if (step === 3) {
      if (!formData.cac_number)
        newErrors.cac_number =
          "CAC number or school license number is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep()) setStep((s) => s + 1)
  }

  const prevStep = () => setStep((s) => s - 1)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        logo_file: "Only JPG or PNG allowed",
      }))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        logo_file: "File must be under 2MB",
      }))
      return
    }
    update("logo_file", file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setIsLoading(true)
    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          payload.append(key, value)
        } else if (Array.isArray(value)) {
          payload.append(key, JSON.stringify(value))
        } else {
          payload.append(key, String(value))
        }
      })
      const response = await fetch("/api/auth/register/school", {
        method: "POST",
        body: payload,
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Registration failed")

      // ── Sign in client-side so the browser gets an auth session ──
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.contact_email,
        password: formData.password,
      })
      if (signInError) throw new Error("Account created but sign-in failed. Please log in manually.")

      window.location.href = "/dashboard/school"
    } catch (err: unknown) {
      setErrors({
        submit:
          err instanceof Error ? err.message : "Registration failed",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">
            Register Your School
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Start hiring pre-screened, qualified teachers
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > s.number
                      ? "bg-blue-700 text-white"
                      : step === s.number
                      ? "bg-blue-700 text-white ring-4 ring-blue-100"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.number ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    s.number
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium hidden sm:block ${
                    step >= s.number ? "text-blue-700" : "text-gray-400"
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all ${
                    step > s.number ? "bg-blue-700" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
              {errors.submit}
            </div>
          )}

          {/* Step 1 — School Details */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                School Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  School Name
                </label>
                <input
                  type="text"
                  value={formData.school_name}
                  onChange={(e) => update("school_name", e.target.value)}
                  placeholder="e.g. Greenfield International School"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.school_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.school_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  School Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {SCHOOL_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => update("school_type", type.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        formData.school_type === type.value
                          ? "bg-blue-700 text-white border-blue-700"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                {errors.school_type && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.school_type}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  School Level(s)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEACHING_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => toggleLevel(level.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        formData.school_levels.includes(level.value)
                          ? "bg-blue-700 text-white border-blue-700"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
                {errors.school_levels && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.school_levels}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    State
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => update("state", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.state}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    LGA
                  </label>
                  <input
                    type="text"
                    value={formData.lga}
                    onChange={(e) => update("lga", e.target.value)}
                    placeholder="Enter LGA"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.lga && (
                    <p className="text-red-500 text-xs mt-1">{errors.lga}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  School Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Full school address"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  School Website{" "}
                  <span className="text-gray-400 font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://yourschool.edu.ng"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.website && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.website}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Contact Person */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Contact Person & Account
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) =>
                      update("contact_name", e.target.value)
                    }
                    placeholder="e.g. Mrs. Chioma Eze"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.contact_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.contact_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={formData.contact_role}
                    onChange={(e) =>
                      update("contact_role", e.target.value)
                    }
                    placeholder="e.g. Principal, HR Manager"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.contact_role && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.contact_role}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    update("contact_email", e.target.value)
                  }
                  placeholder="admin@yourschool.edu.ng"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.contact_email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.contact_email}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) =>
                      update("confirm_password", e.target.value)
                    }
                    placeholder="Repeat password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.confirm_password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirm_password}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      update("contact_phone", e.target.value)
                    }
                    placeholder="08012345678"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.contact_phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.contact_phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Alternate Phone{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone_alt}
                    onChange={(e) =>
                      update("contact_phone_alt", e.target.value)
                    }
                    placeholder="08087654321"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Verification */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Verification & Branding
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Verified schools get a trust badge and appear higher in
                search results.
              </p>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  School Logo
                </label>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                      <Upload className="h-4 w-4" />
                      Upload Logo
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG or PNG, max 2MB
                    </p>
                    {errors.logo_file && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.logo_file}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* CAC Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CAC Registration Number or School License Number
                </label>
                <input
                  type="text"
                  value={formData.cac_number}
                  onChange={(e) => update("cac_number", e.target.value)}
                  placeholder="Enter CAC or license number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.cac_number && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cac_number}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  This will be verified by our team within 24 hours.
                  Your account will be active immediately but full
                  verification unlocks all features.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-900 mb-3">
                  Account Summary
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span className="text-blue-600">School</span>
                    <span className="font-medium">
                      {formData.school_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Type</span>
                    <span className="font-medium capitalize">
                      {formData.school_type || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Location</span>
                    <span className="font-medium">
                      {formData.lga && formData.state
                        ? `${formData.lga}, ${formData.state}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Contact</span>
                    <span className="font-medium">
                      {formData.contact_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Plan</span>
                    <span className="font-medium text-green-700">
                      Free (upgrade anytime)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="text-gray-500">
                  Already have an account?
                </Button>
              </Link>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Registration
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Are you a teacher?{" "}
          <Link
            href="/register/teacher"
            className="text-green-600 hover:underline"
          >
            Create a teacher profile here
          </Link>
        </p>
      </div>
    </div>
  )
}