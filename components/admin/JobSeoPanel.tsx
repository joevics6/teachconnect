"use client"

import { useState } from "react"
import { Loader2, Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFetchErrorMessage } from "@/lib/network-error"

export interface JobSeoFields {
  role_category?: string | null
  experience_level?: string | null
  responsibilities?: string[] | null
  skills_required?: string[] | null
  about_role?: string | null
  who_apply?: string | null
  standout?: string | null
  meta_description?: string | null
}

const LEVELS = ["", "entry-level", "junior", "mid-level", "senior", "lead"]

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)

export function JobSeoPanel({ jobId, initial }: { jobId: string; initial: JobSeoFields }) {
  const [role, setRole] = useState(initial.role_category ?? "")
  const [level, setLevel] = useState(initial.experience_level ?? "")
  const [responsibilities, setResponsibilities] = useState((initial.responsibilities ?? []).join("\n"))
  const [skills, setSkills] = useState((initial.skills_required ?? []).join(", "))
  const [aboutRole, setAboutRole] = useState(initial.about_role ?? "")
  const [whoApply, setWhoApply] = useState(initial.who_apply ?? "")
  const [standout, setStandout] = useState(initial.standout ?? "")
  const [meta, setMeta] = useState(initial.meta_description ?? "")

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const apply = (c: JobSeoFields) => {
    setRole(c.role_category ?? "")
    setLevel(c.experience_level ?? "")
    setResponsibilities((c.responsibilities ?? []).join("\n"))
    setSkills((c.skills_required ?? []).join(", "))
    setAboutRole(c.about_role ?? "")
    setWhoApply(c.who_apply ?? "")
    setStandout(c.standout ?? "")
    setMeta(c.meta_description ?? "")
  }

  const generate = async () => {
    if ((aboutRole || whoApply || standout) && !window.confirm("Replace the current text with newly generated content?")) return
    setGenerating(true)
    setError("")
    setMessage("")
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/seo`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")
      apply(data.content)
      setMessage("Generated and saved.")
    } catch (err) {
      setError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Generation failed"))
    } finally {
      setGenerating(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_category: role.trim() || null,
          experience_level: level || null,
          responsibilities: responsibilities.split("\n").map((s) => s.trim()).filter(Boolean),
          skills_required: skills.split(",").map((s) => s.trim()).filter(Boolean),
          about_role: aboutRole.trim() || null,
          who_apply: whoApply.trim() || null,
          standout: standout.trim() || null,
          meta_description: meta.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setMessage("Saved.")
    } catch (err) {
      setError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Save failed"))
    } finally {
      setSaving(false)
    }
  }

  const field = "w-full text-sm text-gray-800 bg-white border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-ink-500"
  const label = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h2 className="text-base font-bold text-gray-900">Search content</h2>
        <Button type="button" variant="outline" onClick={generate} disabled={generating} className="flex items-center gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {aboutRole ? "Regenerate with AI" : "Generate with AI"}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Shown on the public job page (three collapsible sections plus responsibilities and skills) and used for the page title, description and Google job listing data. Generated automatically when a job is approved.
      </p>

      <div className="grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Searchable role title</label>
            <input className={field} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Mathematics Teacher" />
          </div>
          <div>
            <label className={label}>Experience level</label>
            <select className={field} value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l || "Not set"}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Meta description ({meta.length}/155)</label>
          <textarea className={field} rows={2} value={meta} onChange={(e) => setMeta(e.target.value)} />
        </div>

        <div>
          <label className={label}>About this role ({wordCount(aboutRole)} words)</label>
          <textarea className={field} rows={5} value={aboutRole} onChange={(e) => setAboutRole(e.target.value)} />
        </div>
        <div>
          <label className={label}>Who should apply ({wordCount(whoApply)} words)</label>
          <textarea className={field} rows={5} value={whoApply} onChange={(e) => setWhoApply(e.target.value)} />
        </div>
        <div>
          <label className={label}>How to stand out ({wordCount(standout)} words)</label>
          <textarea className={field} rows={5} value={standout} onChange={(e) => setStandout(e.target.value)} />
        </div>

        <div>
          <label className={label}>Key responsibilities (one per line)</label>
          <textarea className={field} rows={6} value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} />
        </div>
        <div>
          <label className={label}>Skills (comma separated)</label>
          <textarea className={field} rows={2} value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      {message && (
        <p className="text-sm text-ink-600 mt-4 flex items-center gap-1"><Check className="h-4 w-4" />{message}</p>
      )}

      <div className="mt-4">
        <Button type="button" onClick={save} disabled={saving} className="bg-ink-600 hover:bg-ink-700 text-white">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save search content"}
        </Button>
      </div>
    </div>
  )
}
