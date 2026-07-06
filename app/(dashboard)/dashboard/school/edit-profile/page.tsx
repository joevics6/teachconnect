"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle,
  Camera, X, Upload, Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StateLgaSelect } from "@/components/ui/StateLgaSelect"
import { TEACHING_LEVELS } from "@/lib/constants"

const SCHOOL_TYPES = [
  { value: "private",       label: "Private"       },
  { value: "public",        label: "Public"        },
  { value: "international", label: "International" },
  { value: "missionary",    label: "Missionary"    },
]

const CURRICULUM_OPTIONS = [
  "NERDC", "WAEC", "NECO", "NABTEB",
  "Cambridge (IGCSE)", "Montessori", "IB (International Baccalaureate)",
  "British Curriculum", "American Curriculum",
]

const BENEFIT_OPTIONS = [
  "Staff Housing", "Transport Allowance", "Health Insurance (HMO)",
  "Pension (PENCOM)", "13th Month Salary", "Annual Leave",
  "Professional Development", "School Fees Discount", "Meal Allowance",
]

const SCHOOL_CATEGORIES = [
  { value: "day",      label: "Day School"      },
  { value: "boarding", label: "Boarding School" },
  { value: "both",     label: "Day & Boarding"  },
]

interface SchoolForm {
  school_name: string; school_type: string; school_levels: string[]
  state: string; lga: string; address: string; website: string
  contact_name: string; contact_role: string
  contact_phone: string; contact_phone_alt: string
  cac_number: string
  about: string; curriculum: string[]; student_population: string
  salary_range_min: string; salary_range_max: string
  benefits: string[]; school_category: string
  logo_url: string | null
}

export default function EditSchoolProfilePage() {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<SchoolForm>({
    school_name: "", school_type: "", school_levels: [],
    state: "", lga: "", address: "", website: "",
    contact_name: "", contact_role: "",
    contact_phone: "", contact_phone_alt: "",
    cac_number: "",
    about: "", curriculum: [], student_population: "",
    salary_range_min: "", salary_range_max: "",
    benefits: [], school_category: "",
    logo_url: null,
  })

  const [verificationStatus, setVerificationStatus] = useState("unverified")
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [success, setSuccess]           = useState(false)
  const [error, setError]               = useState("")
  const [logoPreview, setLogoPreview]   = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    fetch("/api/school/profile")
      .then(async (res) => {
        if (res.status === 401) { router.push("/login"); return }
        if (!res.ok) return
        const data = await res.json()
        const s = data.school
        if (!s) return
        setVerificationStatus(s.verification_status || "unverified")
        setLogoPreview(s.logo_url || null)
        setForm({
          school_name:      s.school_name      || "",
          school_type:      s.school_type      || "",
          school_levels:    s.school_levels    || [],
          state:            s.state            || "",
          lga:              s.lga              || "",
          address:          s.address          || "",
          website:          s.website          || "",
          contact_name:     s.contact_name     || "",
          contact_role:     s.contact_role     || "",
          contact_phone:    s.contact_phone    || "",
          contact_phone_alt: s.contact_phone_alt || "",
          cac_number:       s.cac_number       || "",
          about:            s.about            || "",
          curriculum:       s.curriculum       || [],
          student_population: s.student_population ? String(s.student_population) : "",
          salary_range_min: s.salary_range_min ? String(s.salary_range_min) : "",
          salary_range_max: s.salary_range_max ? String(s.salary_range_max) : "",
          benefits:         s.benefits         || [],
          school_category:  s.school_category  || "",
          logo_url:         s.logo_url         || null,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoPreview(URL.createObjectURL(file))
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append("logo", file)
      const res = await fetch("/api/school/profile/logo", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm((f) => ({ ...f, logo_url: data.logo_url }))
      setLogoPreview(data.logo_url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Logo upload failed")
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    setError(""); setSuccess(false)
    if (!form.school_name.trim()) { setError("School name is required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/school/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          student_population: form.student_population ? Number(form.student_population) : null,
          salary_range_min:   form.salary_range_min   ? Number(form.salary_range_min)   : null,
          salary_range_max:   form.salary_range_max   ? Number(form.salary_range_max)   : null,
          website: form.website || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setSuccess(true)
      if (data.school?.verification_status) setVerificationStatus(data.school.verification_status)
      setTimeout(() => router.push("/dashboard/school"), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  const VerificationBadge = () => {
    const map: Record<string, { label: string; color: string }> = {
      unverified: { label: "Not Verified", color: "bg-gray-100 text-gray-500" },
      pending:    { label: "Pending Verification", color: "bg-yellow-100 text-yellow-700" },
      verified:   { label: "Verified", color: "bg-green-100 text-green-700" },
    }
    const v = map[verificationStatus] || map.unverified
    return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${v.color}`}>{v.label}</span>
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/school">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Edit School Profile</h1>
              <VerificationBadge />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || success}
            className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
              : success ? <><CheckCircle2 className="h-4 w-4" />Saved!</>
              : <><Save className="h-4 w-4" />Save</>}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Logo */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 mb-4">School Logo</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                : <Building2 className="h-8 w-8 text-gray-400" />}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div>
              <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                className="hidden" onChange={handleLogoUpload} />
              <button type="button" onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-400 hover:text-blue-700 transition disabled:opacity-50">
                <Camera className="h-4 w-4" />
                {uploadingLogo ? "Uploading…" : logoPreview ? "Change Logo" : "Upload Logo"}
              </button>
              {logoPreview && !uploadingLogo && (
                <button type="button" onClick={() => { setLogoPreview(null); setForm((f) => ({ ...f, logo_url: null })) }}
                  className="flex items-center gap-1.5 mt-2 text-xs text-red-500 hover:text-red-600">
                  <X className="h-3 w-3" />Remove
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">JPG, PNG or WebP · Max 2MB</p>
            </div>
          </div>
        </section>

        {/* School Information */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">School Information</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">School Name *</label>
            <input type="text" value={form.school_name}
              onChange={(e) => setForm({ ...form, school_name: e.target.value })}
              className={inputClass} placeholder="e.g. Greenfield Academy" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">School Type</label>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_TYPES.map((t) => (
                <button key={t.value} type="button"
                  onClick={() => setForm({ ...form, school_type: t.value })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    form.school_type === t.value
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">School Category</label>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_CATEGORIES.map((c) => (
                <button key={c.value} type="button"
                  onClick={() => setForm({ ...form, school_category: c.value })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    form.school_category === c.value
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Teaching Levels</label>
            <div className="flex flex-wrap gap-2">
              {TEACHING_LEVELS.map((l) => (
                <button key={l.value} type="button"
                  onClick={() => setForm({ ...form, school_levels: toggle(form.school_levels, l.value) })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    form.school_levels.includes(l.value)
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Curriculum</label>
            <div className="flex flex-wrap gap-2">
              {CURRICULUM_OPTIONS.map((c) => (
                <button key={c} type="button"
                  onClick={() => setForm({ ...form, curriculum: toggle(form.curriculum, c) })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    form.curriculum.includes(c)
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">About the School</label>
            <textarea value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              rows={4} className={`${inputClass} resize-none`}
              placeholder="Describe your school — history, ethos, achievements, environment…" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Student Population</label>
            <input type="number" min={0} value={form.student_population}
              onChange={(e) => setForm({ ...form, student_population: e.target.value })}
              className={inputClass} placeholder="e.g. 800" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Website (optional)</label>
            <input type="url" value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className={inputClass} placeholder="https://yourschool.edu.ng" />
          </div>
        </section>

        {/* Location */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Location</h2>
          <StateLgaSelect
            state={form.state} lga={form.lga}
            onStateChange={(s) => setForm({ ...form, state: s, lga: "" })}
            onLgaChange={(l) => setForm({ ...form, lga: l })}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Street Address</label>
            <input type="text" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass} placeholder="Street address" />
          </div>
        </section>

        {/* Compensation */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Compensation & Benefits</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Min Salary Offered (₦/month)</label>
              <input type="number" min={0} value={form.salary_range_min}
                onChange={(e) => setForm({ ...form, salary_range_min: e.target.value })}
                className={inputClass} placeholder="e.g. 80000" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Max Salary Offered (₦/month)</label>
              <input type="number" min={0} value={form.salary_range_max}
                onChange={(e) => setForm({ ...form, salary_range_max: e.target.value })}
                className={inputClass} placeholder="e.g. 200000" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Benefits Offered</label>
            <div className="flex flex-wrap gap-2">
              {BENEFIT_OPTIONS.map((b) => (
                <button key={b} type="button"
                  onClick={() => setForm({ ...form, benefits: toggle(form.benefits, b) })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    form.benefits.includes(b)
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Person */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Contact Person</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
              <input type="text" value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className={inputClass} placeholder="Contact name" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Role / Title</label>
              <input type="text" value={form.contact_role}
                onChange={(e) => setForm({ ...form, contact_role: e.target.value })}
                className={inputClass} placeholder="e.g. Principal" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number</label>
              <input type="tel" value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className={inputClass} placeholder="080xxxxxxxx" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Alt. Phone (optional)</label>
              <input type="tel" value={form.contact_phone_alt}
                onChange={(e) => setForm({ ...form, contact_phone_alt: e.target.value })}
                className={inputClass} placeholder="080xxxxxxxx" />
            </div>
          </div>
        </section>

        {/* Verification */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">School Registration</h2>
            <VerificationBadge />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              CAC Number or Ministry of Education License
            </label>
            <input type="text" value={form.cac_number}
              onChange={(e) => setForm({ ...form, cac_number: e.target.value })}
              className={inputClass} placeholder="e.g. RC123456 or MoE/EDU/001" />
            <p className="text-xs text-gray-400 mt-1.5">
              {verificationStatus === "unverified"
                ? "Enter your CAC number to submit for verification. Our team will verify within 24 hours."
                : verificationStatus === "pending"
                ? "Your registration is being verified by our team."
                : "✓ Your school registration has been verified."}
            </p>
          </div>
        </section>

        {/* Save */}
        <div className="pb-8">
          <Button onClick={handleSave} disabled={saving || success}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-6 text-base">
            {saving ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Saving…</>
              : success ? <><CheckCircle2 className="h-5 w-5 mr-2" />Saved!</>
              : <><Save className="h-5 w-5 mr-2" />Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
