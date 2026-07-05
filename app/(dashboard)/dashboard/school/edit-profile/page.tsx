"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2, Briefcase, Users, GraduationCap, CreditCard,
  Settings, LogOut, Menu, X, CheckCircle2, Loader2, AlertCircle,
  Camera, Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { NIGERIAN_STATES, TEACHING_LEVELS } from "@/lib/constants"
import { StateLgaSelect } from "@/components/ui/StateLgaSelect"

const NAV_ITEMS = [
  { href: "/dashboard/school",              label: "Overview",        icon: Building2     },
  { href: "/dashboard/school/jobs",         label: "My Jobs",         icon: Briefcase     },
  { href: "/dashboard/school/jobs/applicants", label: "Applicants",  icon: Users         },
  { href: "/talent",                        label: "Browse Teachers", icon: GraduationCap },
  { href: "/dashboard/school/subscription", label: "Subscription",   icon: CreditCard    },
  { href: "/dashboard/school/settings",     label: "Settings",        icon: Settings      },
]

const SCHOOL_TYPES = [
  { value: "private",       label: "Private"       },
  { value: "public",        label: "Public"        },
  { value: "international", label: "International" },
  { value: "missionary",    label: "Missionary"    },
]

interface ProfileForm {
  school_name:       string
  school_type:       string
  school_levels:     string[]
  state:             string
  lga:               string
  address:           string
  website:           string
  contact_name:      string
  contact_role:      string
  contact_phone:     string
  contact_phone_alt: string
}

export default function SchoolEditProfilePage() {
  const router  = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [logoPreview,   setLogoPreview]   = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError,     setLogoError]     = useState("")
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [form,    setForm]    = useState<ProfileForm>({
    school_name: "", school_type: "", school_levels: [],
    state: "", lga: "", address: "", website: "",
    contact_name: "", contact_role: "", contact_phone: "", contact_phone_alt: "",
  })
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Load current profile
  useEffect(() => {
    fetch("/api/school/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.school) {
          const s = data.school
          if (s.logo_url) setLogoPreview(s.logo_url)
          setForm({
            school_name:       s.school_name       || "",
            school_type:       s.school_type       || "",
            school_levels:     s.school_levels     || [],
            state:             s.state             || "",
            lga:               s.lga               || "",
            address:           s.address           || "",
            website:           s.website           || "",
            contact_name:      s.contact_name      || "",
            contact_role:      s.contact_role      || "",
            contact_phone:     s.contact_phone     || "",
            contact_phone_alt: s.contact_phone_alt || "",
          })
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [])

  const toggleLevel = (value: string) => {
    setForm((prev) => ({
      ...prev,
      school_levels: prev.school_levels.includes(value)
        ? prev.school_levels.filter((l) => l !== value)
        : [...prev.school_levels, value],
    }))
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError("")

    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append("logo", file)
      const res = await fetch("/api/school/profile/logo", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setLogoPreview(data.logo_url)
    } catch (err: unknown) {
      setLogoError(err instanceof Error ? err.message : "Upload failed")
      setLogoPreview(null)
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/school/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      setSaved(true)
      setTimeout(() => router.push("/dashboard/school"), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={mobile ? "flex flex-col h-full" : ""}>
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-green-600 text-white p-1.5 rounded-lg">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-gray-900">TeachConnect</span>
        </Link>
      </div>
      <div className="p-3 flex-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </nav>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 fixed inset-y-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-sm">Menu</span>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-56">
        {/* Mobile topbar */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 text-sm">Edit School Profile</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Edit School Profile</h1>
            <Link href="/dashboard/school" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl mb-5">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Profile saved! Redirecting…
            </div>
          )}

          <div className="space-y-5">
            {/* ── Logo Upload ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-1">School Logo</h2>
              <p className="text-xs text-gray-500 mb-4">JPG, PNG or WebP · Max 5MB · Shown on your profile and job listings</p>
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="School logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  {uploadingLogo && (
                    <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-green-400 hover:text-green-700 transition disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                    {uploadingLogo ? "Uploading…" : logoPreview ? "Change Logo" : "Upload Logo"}
                  </button>
                  {logoError && <p className="text-xs text-red-500 mt-2">{logoError}</p>}
                </div>
              </div>
            </div>

            {/* ── School Info ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">School Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input
                    value={form.school_name}
                    onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. Greenfield Academy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Type</label>
                  <div className="flex gap-3">
                    {SCHOOL_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setForm({ ...form, school_type: type.value })}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          form.school_type === type.value
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Levels</label>
                  <div className="flex flex-wrap gap-2">
                    {TEACHING_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => toggleLevel(level.value)}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                          form.school_levels.includes(level.value)
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://yourschool.edu.ng"
                  />
                </div>
              </div>
            </div>

            {/* ── Location ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Location</h2>
              <div className="space-y-4">
                <StateLgaSelect
                  state={form.state}
                  lga={form.lga}
                  onStateChange={(state) => setForm({ ...form, state, lga: "" })}
                  onLgaChange={(lga) => setForm({ ...form, lga })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Street address"
                  />
                </div>
              </div>
            </div>

            {/* ── Contact ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Contact Person</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      value={form.contact_name}
                      onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role / Title</label>
                    <input
                      value={form.contact_role}
                      onChange={(e) => setForm({ ...form, contact_role: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. Principal"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="080xxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alt. Phone (optional)</label>
                    <input
                      value={form.contact_phone_alt}
                      onChange={(e) => setForm({ ...form, contact_phone_alt: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="080xxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={saving || saved}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
            >
              {saving ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Saving…</>
              ) : saved ? (
                <><CheckCircle2 className="h-5 w-5 mr-2" />Saved!</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
