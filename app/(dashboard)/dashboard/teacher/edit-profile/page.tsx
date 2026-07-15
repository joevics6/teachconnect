"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, Camera, X, FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StateLgaSelect } from "@/components/ui/StateLgaSelect"
import { SUBJECTS, TEACHING_LEVELS, NIGERIAN_STATES } from "@/lib/constants"

interface ProfileForm {
  full_name: string
  phone: string
  state: string
  lga: string
  bio: string
  years_experience: number | ""
  trcn_number: string
  trcn_status: "registered" | "pending" | "not-registered"
  subjects: string[]
  teaching_levels: string[]
  preferred_states: string[]
  willing_to_relocate: boolean
  accommodation_needed: boolean
  availability: "immediate" | "2-weeks" | "1-month" | "employed" | "part-time" | "online" | "weekend"
  salary_min: number | ""
  demo_video_url: string
}

const AVAILABILITY_OPTIONS = [
  { value: "immediate",  label: "Available Immediately"  },
  { value: "2-weeks",    label: "Available in 2 Weeks"   },
  { value: "1-month",    label: "Available in 1 Month"   },
  { value: "employed",   label: "Currently Employed"     },
  { value: "part-time",  label: "Part-time Only"         },
  { value: "online",     label: "Online Teaching Only"   },
  { value: "weekend",    label: "Weekend Teaching Only"  },
]

export default function EditTeacherProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState<ProfileForm>({
    full_name: "", phone: "", state: "", lga: "", bio: "",
    years_experience: "", trcn_number: "", trcn_status: "not-registered",
    subjects: [], teaching_levels: [], preferred_states: [],
    willing_to_relocate: false, accommodation_needed: false,
    availability: "immediate", salary_min: "",
    demo_video_url: "",
  })
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState("")
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [cvUrl,       setCvUrl]       = useState<string | null>(null)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [cvError,     setCvError]     = useState("")
  const [cvSuccess,   setCvSuccess]   = useState(false)
  const cvInputRef = useRef<HTMLInputElement>(null)

  // Load current profile
  useEffect(() => {
    fetch("/api/teacher/profile")
      .then(async (res) => {
        if (res.status === 401) { router.push("/login"); return }
        if (!res.ok) return
        const data = await res.json()
        const p = data.profile
        if (!p) return
        if (p.photo_url) setPhotoPreview(p.photo_url)
        if (p.cv_url) setCvUrl(p.cv_url)
        setForm({
          full_name:           p.full_name          || "",
          phone:               p.phone              || "",
          state:               p.state              || "",
          lga:                 p.lga                || "",
          bio:                 p.bio                || "",
          years_experience:    p.years_experience   ?? "",
          trcn_number:         p.trcn_number        || "",
          trcn_status:         p.trcn_status        || "not-registered",
          subjects:            p.subjects           || [],
          teaching_levels:     p.teaching_levels    || [],
          preferred_states:    p.preferred_states   || [],
          willing_to_relocate: p.willing_to_relocate ?? false,
          accommodation_needed: p.accommodation_needed ?? false,
          availability:        p.availability       || "immediate",
          salary_min:          p.salary_min         ?? "",
          demo_video_url:      p.demo_video_url     || "",
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError("")

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload to server
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append("photo", file)
      const res = await fetch("/api/teacher/profile/photo", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setPhotoPreview(data.photo_url)
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed")
      setPhotoPreview(null)
    } finally {
      setUploadingPhoto(false)
      // Reset input so same file can be re-selected
      if (photoInputRef.current) photoInputRef.current.value = ""
    }
  }

  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCvError("")
    setCvSuccess(false)

    if (file.type !== "application/pdf") {
      setCvError("CV must be a PDF file")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setCvError("CV must be under 10MB")
      return
    }

    setUploadingCv(true)
    try {
      const fd = new FormData()
      fd.append("cv", file)
      const res = await fetch("/api/teacher/profile/cv", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setCvUrl(data.cv_url)
      setCvSuccess(true)
      setTimeout(() => setCvSuccess(false), 3000)
    } catch (err: unknown) {
      setCvError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingCv(false)
      if (cvInputRef.current) cvInputRef.current.value = ""
    }
  }

  const handleRemovePhoto = async () => {
    setPhotoError("")
    const prev = photoPreview
    setPhotoPreview(null)
    try {
      const res = await fetch("/api/teacher/profile/photo", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to remove photo")
    } catch {
      setPhotoPreview(prev)
      setPhotoError("Couldn't remove photo — try again.")
    }
  }

  const handleSave = async () => {
    setError("")
    setSuccess(false)
    if (!form.full_name.trim()) { setError("Full name is required"); return }
    if (!form.phone.trim())     { setError("Phone number is required"); return }

    setSaving(true)
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          years_experience: form.years_experience === "" ? 0 : Number(form.years_experience),
          salary_min:       form.salary_min       === "" ? 0 : Number(form.salary_min),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard/teacher")
      }, 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/teacher">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || success}
            className="bg-ink-600 hover:bg-ink-700 text-white flex items-center gap-2"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
            ) : success ? (
              <><CheckCircle2 className="h-4 w-4" />Saved!</>
            ) : (
              <><Save className="h-4 w-4" />Save Changes</>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Status messages */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-ink-50 border border-ink-200 rounded-xl text-ink-700 text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />Profile saved! Redirecting…
          </div>
        )}

        {/* Photo Upload */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            {/* Avatar preview */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-ink-100 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-ink-700">
                    {form.full_name ? form.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                  </span>
                )}
              </div>
              {uploadingPhoto && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="flex-1">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-ink-400 hover:text-ink-700 transition disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                {uploadingPhoto ? "Uploading…" : photoPreview ? "Change Photo" : "Upload Photo"}
              </button>
              {photoPreview && !uploadingPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-1.5 mt-2 text-xs text-red-500 hover:text-red-600 transition"
                >
                  <X className="h-3 w-3" />Remove photo
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">JPG, PNG or WebP · Max 5MB · Uploads immediately</p>
              {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
            </div>
          </div>
        </section>

        {/* CV Upload */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 mb-1">CV / Resume</h2>
          <p className="text-xs text-gray-500 mb-4">PDF only · Max 10MB · Replaces your current CV</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {cvUrl ? (
                <div className="flex items-center gap-3 p-3 bg-ink-50 border border-ink-200 rounded-lg mb-3">
                  <FileText className="h-5 w-5 text-ink-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800">CV uploaded</p>
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ink-600 hover:underline"
                    >
                      View current CV →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                  <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-500">No CV uploaded yet</p>
                </div>
              )}
              <input
                ref={cvInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleCvChange}
              />
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                disabled={uploadingCv}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-ink-400 hover:text-ink-700 transition disabled:opacity-50"
              >
                {uploadingCv ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
                ) : (
                  <><Upload className="h-4 w-4" />{cvUrl ? "Replace CV" : "Upload CV"}</>
                )}
              </button>
              {cvSuccess && (
                <p className="text-xs text-ink-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />CV uploaded successfully
                </p>
              )}
              {cvError && <p className="text-xs text-red-500 mt-2">{cvError}</p>}
            </div>
          </div>
        </section>

        {/* Personal Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Personal Information</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
              placeholder="e.g. Amaka Johnson"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
              placeholder="e.g. 08012345678"
            />
          </div>

          <StateLgaSelect
            state={form.state}
            lga={form.lga}
            onStateChange={(s) => setForm({ ...form, state: s, lga: "" })}
            onLgaChange={(l)   => setForm({ ...form, lga: l })}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500 resize-none"
              placeholder="Tell schools about yourself — your teaching approach, strengths, and goals…"
            />
          </div>
        </section>

        {/* Teaching Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Teaching Information</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Teaching Levels</label>
            <div className="flex flex-wrap gap-2">
              {TEACHING_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setForm({ ...form, teaching_levels: toggle(form.teaching_levels, level.value) })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    form.teaching_levels.includes(level.value)
                      ? "bg-ink-600 text-white border-ink-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-ink-400"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Subjects</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => setForm({ ...form, subjects: toggle(form.subjects, subject) })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    form.subjects.includes(subject)
                      ? "bg-ink-600 text-white border-ink-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-ink-400"
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Years of Experience</label>
            <input
              type="number"
              min={0}
              max={50}
              value={form.years_experience}
              onChange={(e) => setForm({ ...form, years_experience: e.target.value === "" ? "" : Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
              placeholder="e.g. 5"
            />
          </div>
        </section>

        {/* TRCN */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">TRCN Registration</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">TRCN Status</label>
            <div className="flex flex-col gap-2">
              {[
                { value: "registered",     label: "Registered" },
                { value: "pending",        label: "Registration Pending" },
                { value: "not-registered", label: "Not Registered" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="trcn_status"
                    value={opt.value}
                    checked={form.trcn_status === opt.value}
                    onChange={() => setForm({ ...form, trcn_status: opt.value as ProfileForm["trcn_status"] })}
                    className="text-ink-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {form.trcn_status === "registered" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">TRCN Number</label>
              <input
                type="text"
                value={form.trcn_number}
                onChange={(e) => setForm({ ...form, trcn_number: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
                placeholder="e.g. TRCN/2021/123456"
              />
            </div>
          )}
        </section>

        {/* Job Preferences */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Job Preferences</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Availability</label>
            <div className="flex flex-col gap-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    value={opt.value}
                    checked={form.availability === opt.value}
                    onChange={() => setForm({ ...form, availability: opt.value as ProfileForm["availability"] })}
                    className="text-ink-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Minimum Monthly Salary (₦)</label>
            <input
              type="number"
              min={0}
              value={form.salary_min}
              onChange={(e) => setForm({ ...form, salary_min: e.target.value === "" ? "" : Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
              placeholder="e.g. 80000"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Willing to Relocate</p>
              <p className="text-xs text-gray-500">Open to jobs outside your current state</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, willing_to_relocate: !form.willing_to_relocate })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.willing_to_relocate ? "bg-ink-600" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.willing_to_relocate ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Needs Accommodation</p>
              <p className="text-xs text-gray-500">Interested in roles that include housing</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, accommodation_needed: !form.accommodation_needed })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.accommodation_needed ? "bg-ink-600" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.accommodation_needed ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Preferred States</label>
            <p className="text-xs text-gray-500 mb-2">Select states you'd be willing to work in</p>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {NIGERIAN_STATES.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setForm({ ...form, preferred_states: toggle(form.preferred_states, state) })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    form.preferred_states.includes(state)
                      ? "bg-ink-600 text-white border-ink-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-ink-400"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Lesson Video */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Demo Lesson Video</h2>
          <p className="text-xs text-gray-500">Upload a short teaching demonstration to YouTube and paste the link here. Schools can watch it before inviting you to interview.</p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">YouTube Video URL</label>
            <input
              type="url"
              value={form.demo_video_url}
              onChange={(e) => setForm({ ...form, demo_video_url: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          {form.demo_video_url && (() => {
            const match = form.demo_video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
            const videoId = match?.[1]
            return videoId ? (
              <div className="aspect-video rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="w-full h-full"
                  allowFullScreen
                  title="Demo lesson preview"
                />
              </div>
            ) : (
              <p className="text-xs text-red-500">Couldn&apos;t detect a valid YouTube URL. Make sure it contains a video ID.</p>
            )
          })()}
        </section>

        {/* Save Button */}
        <div className="pb-8">
          <Button
            onClick={handleSave}
            disabled={saving || success}
            className="w-full bg-ink-600 hover:bg-ink-700 text-white py-6 text-base"
          >
            {saving ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" />Saving…</>
            ) : success ? (
              <><CheckCircle2 className="h-5 w-5 mr-2" />Profile Saved!</>
            ) : (
              <><Save className="h-5 w-5 mr-2" />Save Changes</>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
