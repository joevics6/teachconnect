"use client"

// Saved-content queue shown under the body box on "New Blog Post".
// Save pasted articles here; the hourly cron parses them (oldest first)
// into draft posts. "Paste" copies a saved item into the body box above
// so it can be parsed by hand instead.

import { useEffect, useState } from "react"
import { ClipboardPaste, Loader2, Plus, Trash2 } from "lucide-react"

interface QueueItem {
  id: string
  content: string
  status: "not_processed" | "processed"
  error: string | null
  attempts: number
  created_at: string
}

export function BlogQueuePanel({ onPaste }: { onPaste: (content: string) => void }) {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let live = true
    fetch("/api/admin/blog-queue")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live) return
        if (data) setItems(data.items)
        setLoading(false)
      })
      .catch(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [tick])

  async function save() {
    setErr("")
    if (!text.trim()) return setErr("Paste some content first.")
    setSaving(true)
    try {
      const res = await fetch("/api/admin/blog-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return setErr(data.error || "Failed to save.")
      setText("")
      setTick((t) => t + 1)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this saved content?")) return
    const res = await fetch(`/api/admin/blog-queue/${id}`, { method: "DELETE" })
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const waiting = items.filter((i) => i.status === "not_processed").length

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-800">Content queue</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Save articles here. Every hour the oldest unprocessed one is parsed and saved as a draft post. {waiting} waiting.
        </p>
      </div>

      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste an article to save for later…"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ink-500"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink-600 hover:bg-ink-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Save to queue
      </button>
      {err && <p className="text-xs text-red-600">{err}</p>}

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400">Nothing saved yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {items.map((i) => (
            <li key={i.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-800 line-clamp-2 break-words">{i.content.replace(/\s+/g, " ").slice(0, 200)}</p>
                <p className="text-[11px] mt-1 flex flex-wrap items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded-full ${i.status === "processed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {i.status === "processed" ? "Processed" : "Not processed"}
                  </span>
                  <span className="text-gray-400">{new Date(i.created_at).toLocaleString()}</span>
                  {i.error && i.status === "not_processed" && (
                    <span className="text-red-600">Failed {i.attempts}x: {i.error.slice(0, 80)}</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => onPaste(i.content)} className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
                  <ClipboardPaste className="h-3.5 w-3.5" />Paste
                </button>
                <button type="button" onClick={() => remove(i.id)} className="inline-flex items-center gap-1 px-2.5 py-1 border border-red-200 rounded-lg text-xs text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
