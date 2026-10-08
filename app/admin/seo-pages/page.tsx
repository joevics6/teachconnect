"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Check, ExternalLink } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/button"

interface Location {
  state: string
  count: number
  live: boolean
  path: string
  hasContent: boolean
  title: string
  meta_description: string
  intro: string
  body: string
}

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)

export default function AdminSeoPagesPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [minJobs, setMinJobs] = useState(6)
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", meta_description: "", intro: "", body: "" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const load = () =>
    fetch("/api/admin/seo-pages")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setLocations(data.locations || [])
        setMinJobs(data.minJobs ?? 6)
      })
      .catch((err) => console.error("Failed to load SEO pages:", err))
      .finally(() => setIsLoading(false))

  useEffect(() => {
    load()
  }, [])

  const open = (l: Location) => {
    setSelected(l.state)
    setForm({ title: l.title, meta_description: l.meta_description, intro: l.intro, body: l.body })
    setMessage("")
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/admin/seo-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: selected, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setMessage("Saved.")
      load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const current = locations.find((l) => l.state === selected)
  const field = "w-full text-sm text-gray-800 bg-white border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-ink-500"
  const label = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Location pages</h1>
        <p className="text-sm text-gray-500 mb-6">
          A page like <span className="font-mono">/jobs/in/lagos</span> goes live once a location has {minJobs}+ live jobs.
          It is only indexed by search engines (and listed in the sitemap) after you write copy for it here. Copy is Markdown.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-ink-600 animate-spin" /></div>
        ) : (
          <div className="grid md:grid-cols-[260px_1fr] gap-6">
            <div className="space-y-2">
              {locations.map((l) => (
                <button
                  key={l.state}
                  onClick={() => open(l)}
                  className={`w-full text-left bg-white border rounded-xl px-4 py-3 hover:border-ink-300 ${selected === l.state ? "border-ink-500" : "border-gray-200"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{l.state}</span>
                    <span className="text-xs text-gray-500">{l.count} jobs</span>
                  </div>
                  <p className="text-xs mt-1">
                    {!l.live ? (
                      <span className="text-gray-400">Not live — needs {minJobs}+ jobs</span>
                    ) : l.hasContent ? (
                      <span className="text-ink-600">Live · indexed</span>
                    ) : (
                      <span className="text-orange-600">Live · needs copy (noindex)</span>
                    )}
                  </p>
                </button>
              ))}
            </div>

            <div>
              {!current ? (
                <p className="text-sm text-gray-500">Choose a location to write its copy.</p>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-bold text-gray-900">Teaching Jobs in {current.state}</h2>
                    {current.live && (
                      <Link href={current.path} target="_blank" className="text-xs text-ink-600 hover:underline flex items-center gap-1">
                        View page <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  <div>
                    <label className={label}>Page title ({form.title.length}/60) — leave empty for the automatic one</label>
                    <input className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={`Teaching Jobs in ${current.state} – ${current.count} Open Vacancies`} />
                  </div>
                  <div>
                    <label className={label}>Meta description ({form.meta_description.length}/155)</label>
                    <textarea className={field} rows={2} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Intro, shown above the jobs ({wordCount(form.intro)} words)</label>
                    <textarea className={field} rows={5} value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Main content, shown below the jobs ({wordCount(form.body)} words) — use ## headings</label>
                    <textarea className={`${field} font-mono`} rows={16} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={save} disabled={saving} className="bg-ink-600 hover:bg-ink-700 text-white">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                    {message && (
                      <span className="text-sm text-ink-600 flex items-center gap-1">{message === "Saved." && <Check className="h-4 w-4" />}{message}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
