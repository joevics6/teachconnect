"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { School, Plus, Search, Briefcase, X, Loader2, Trash2, AlertCircle } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/button"
import { StateLgaSelect } from "@/components/ui/StateLgaSelect"
import { getFetchErrorMessage } from "@/lib/network-error"

const SCHOOL_TYPES = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "international", label: "International" },
  { value: "missionary", label: "Missionary" },
]

interface GhostSchool {
  id: string
  school_name: string
  school_type: string
  state: string
  lga: string
  logo_url: string | null
  about: string | null
  is_claimed: boolean
  jobs_count: number
  created_at: string
}

function NewSchoolModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    school_name: "", school_type: "", state: "", lga: "",
    website: "", about: "", claim_note: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}
    if (!form.school_name.trim()) newErrors.school_name = "Required"
    if (!form.school_type) newErrors.school_type = "Required"
    if (!form.state) newErrors.state = "Required"
    if (!form.lga) newErrors.lga = "Required"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create school")
      onCreated()
    } catch (err) {
      setSubmitError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Failed to create school"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">New School</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <input
              value={form.school_name}
              onChange={(e) => update("school_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. Bright Kids Academy"
            />
            {errors.school_name && <p className="text-red-500 text-xs mt-1">{errors.school_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School Type</label>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update("school_type", t.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    form.school_type === t.value
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

          <StateLgaSelect
            state={form.state}
            lga={form.lga}
            onStateChange={(s) => update("state", s)}
            onLgaChange={(l) => update("lga", l)}
            stateError={errors.state}
            lgaError={errors.lga}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
            <input
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="schoolwebsite.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About (optional)</label>
            <textarea
              value={form.about}
              onChange={(e) => update("about", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Brief description of the school"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Claim Note (optional — internal, e.g. where you found this school)
            </label>
            <input
              value={form.claim_note}
              onChange={(e) => update("claim_note", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g. Found via Lagos Teachers FB group, contact: 080..."
            />
          </div>

          {submitError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-2.5">{submitError}</p>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-ink-600 hover:bg-ink-700 text-white" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create School"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<GhostSchool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [search, setSearch] = useState("")
  const [showNewModal, setShowNewModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; jobsCount: number } | null>(null)

  const fetchSchools = useCallback(async () => {
    setIsLoading(true)
    setFetchError("")
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/schools?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load schools")
      const data = await res.json()
      setSchools(data.schools || [])
    } catch (err) {
      setFetchError(getFetchErrorMessage(err, "Failed to load schools"))
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchSchools, 300)
    return () => clearTimeout(t)
  }, [fetchSchools])

  const handleDelete = async (id: string, confirm: boolean) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/schools/${id}${confirm ? "?confirm=true" : ""}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        if (data.requires_confirm) {
          setDeleteConfirm({ id, jobsCount: data.jobs_count })
          return
        }
        throw new Error(data.error || "Failed to delete school")
      }
      setDeleteConfirm(null)
      fetchSchools()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete school")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <School className="h-6 w-6" />
              Schools
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a placeholder profile for a school found offline (e.g. Facebook groups) so you can post real jobs for them before they register.
            </p>
          </div>
          <Button className="bg-ink-600 hover:bg-ink-700 text-white flex items-center gap-2" onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4" />
            New School
          </Button>
        </div>

        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by school name"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : fetchError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 text-sm mb-4">{fetchError}</p>
            <Button variant="outline" onClick={fetchSchools}>Try Again</Button>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 text-sm">No schools yet — create one to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {schools.map((school) => (
              <div key={school.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{school.school_name}</p>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                      {school.school_type}
                    </span>
                    {school.is_claimed && (
                      <span className="px-2 py-0.5 bg-ink-50 text-ink-600 text-xs rounded-full">Claimed</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {school.lga}, {school.state} · {school.jobs_count} job{school.jobs_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/admin/schools/${school.id}/post-job`}>
                    <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      Post Job
                    </Button>
                  </Link>
                  <button
                    onClick={() => handleDelete(school.id, false)}
                    disabled={deletingId === school.id}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete school"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showNewModal && (
          <NewSchoolModal
            onClose={() => setShowNewModal(false)}
            onCreated={() => { setShowNewModal(false); fetchSchools() }}
          />
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <p className="text-gray-900 font-semibold mb-1">
                This school has {deleteConfirm.jobsCount} job{deleteConfirm.jobsCount !== 1 ? "s" : ""} posted
              </p>
              <p className="text-sm text-gray-500 mb-5">Deleting it will delete those jobs too. This can&apos;t be undone.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleDelete(deleteConfirm.id, true)}
                  disabled={deletingId === deleteConfirm.id}
                >
                  Delete Anyway
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
