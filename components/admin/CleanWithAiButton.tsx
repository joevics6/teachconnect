"use client"

import { useState } from "react"
import { Loader2, Sparkles, Undo2 } from "lucide-react"

/**
 * "Parse with AI" button that sits under a textbox. It fixes the text already
 * in that box (Toolbase scissors edits only): bare citation links become inline
 * anchors (max 5), leftover AI commentary is removed, nothing else is reworded.
 * It does not touch any other field. Undo restores the text from before.
 */
export function CleanWithAiButton({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [previous, setPrevious] = useState<string | null>(null)

  const run = async () => {
    setErr("")
    if (!value.trim()) {
      setErr("Nothing to parse.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/admin/content/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data.error || "AI cleanup failed.")
        return
      }
      setPrevious(value)
      onChange(data.cleaned as string)
    } catch {
      setErr("AI cleanup failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-600 hover:bg-ink-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Parsing…" : "Parse with AI"}
      </button>
      {previous !== null && !busy && (
        <button
          type="button"
          onClick={() => {
            onChange(previous)
            setPrevious(null)
          }}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <Undo2 className="h-4 w-4" /> Undo
        </button>
      )}
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  )
}
