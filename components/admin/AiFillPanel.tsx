"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"

export interface AiFillResult {
  slug: string
  title: string
  category?: string
  tags: string[]
  excerpt: string
  seo_title: string
  seo_description: string
  reading_time_minutes: number
  cleaned_content: string
}

/**
 * "AI auto-fill" box for the admin blog / resource editors
 * (ported from the Toolbase article writer). Paste raw markdown into
 * the body, click, and Gemini fills slug, tags, excerpt, SEO fields and
 * read time, and cleans the markdown (inlines the top 5 external links,
 * strips AI commentary). The author's wording is not rewritten.
 */
export function AiFillPanel({
  kind,
  title,
  content,
  onResult,
}: {
  kind: "blog" | "resource"
  title: string
  content: string
  onResult: (result: AiFillResult) => void
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")

  const run = async () => {
    setErr("")
    setMsg("")
    if (!content.trim()) {
      setErr("Paste content into the body first.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/admin/content/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, content }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data.error || "AI extraction failed.")
        return
      }
      onResult(data.result as AiFillResult)
      setMsg("AI filled the fields and cleaned the content. Review before saving.")
    } catch {
      setErr("AI extraction failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">AI auto-fill</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Paste raw markdown into the body above, then click. Gemini fills the slug, tags, excerpt, SEO
            title and description and read time, and cleans the markdown (inlines the top 5 external links
            naturally, strips AI commentary). Wording is not rewritten.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-ink-600 hover:bg-ink-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Extracting…" : "Auto-fill with AI"}
        </button>
      </div>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
      {msg && <p className="text-xs text-emerald-600 mt-2">{msg}</p>}
    </div>
  )
}
