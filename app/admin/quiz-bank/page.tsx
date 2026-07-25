"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Zap, AlertTriangle, CheckCircle2 } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"

interface Coverage {
  subjects: string[]
  levels: string[]
  counts: Record<string, Record<string, number>>
  min_viable: number
  total_combos: number
  ready_combos: number
}

const LEVEL_LABELS: Record<string, string> = {
  nursery: "Nursery",
  primary: "Primary",
  jss: "JSS",
  sss: "SSS",
  tertiary: "Tertiary",
}

export default function AdminQuizBankPage() {
  const [coverage, setCoverage] = useState<Coverage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setIsLoading(true)
    fetch("/api/admin/quiz-bank/coverage")
      .then(async (res) => {
        if (!res.ok) return
        setCoverage(await res.json())
      })
      .catch((err) => console.error("Failed to load coverage:", err))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(load, [load])

  const generate = async (subject: string, level: string) => {
    const key = `${subject}|${level}`
    setGenerating(key)
    setLastResult((prev) => ({ ...prev, [key]: "" }))
    try {
      const res = await fetch("/api/admin/quiz-bank/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, level, count: 20 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLastResult((prev) => ({ ...prev, [key]: `Error: ${data.error || "failed"}` }))
      } else {
        setLastResult((prev) => ({
          ...prev,
          [key]: `+${data.generated} added${data.duplicates ? `, ${data.duplicates} dupes` : ""}${data.failed ? `, ${data.failed} failed` : ""}`,
        }))
        load()
      }
    } catch (err) {
      console.error("Generate error:", err)
      setLastResult((prev) => ({ ...prev, [key]: "Error: request failed" }))
    } finally {
      setGenerating(null)
    }
  }

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">Quiz Question Bank</h1>
          {coverage && (
            <div className="text-sm text-gray-500">
              {coverage.ready_combos} / {coverage.total_combos} subject-levels ready
              (≥{coverage.min_viable} active MCQs)
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          A subject/level with fewer than {coverage?.min_viable ?? 15} active questions will fail
          for an applying teacher if a school enables quiz screening for it. Generate more below —
          each click adds up to 20 AI-generated questions for that combination.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 text-ink-600 animate-spin" />
          </div>
        ) : coverage ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-3 font-semibold text-gray-700 sticky left-0 bg-white">Subject</th>
                  {coverage.levels.map((level) => (
                    <th key={level} className="text-center p-3 font-semibold text-gray-700 whitespace-nowrap">
                      {LEVEL_LABELS[level] || level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coverage.subjects.map((subject) => (
                  <tr key={subject} className="border-b border-gray-50 last:border-0">
                    <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white whitespace-nowrap">
                      {subject}
                    </td>
                    {coverage.levels.map((level) => {
                      const key = `${subject}|${level}`
                      const count = coverage.counts[subject]?.[level] || 0
                      const ready = count >= coverage.min_viable
                      const isBusy = generating === key
                      return (
                        <td key={level} className="p-2 text-center">
                          <button
                            onClick={() => generate(subject, level)}
                            disabled={isBusy}
                            className={`w-full min-w-[84px] flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition ${
                              ready
                                ? "bg-ink-50 border-ink-200 text-ink-700"
                                : count > 0
                                ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                                : "bg-red-50 border-red-200 text-red-600"
                            } hover:opacity-80 disabled:opacity-50`}
                            title="Generate 20 more questions"
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <span className="flex items-center gap-1">
                                {ready ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                {count}
                              </span>
                            )}
                            {lastResult[key] && <span className="text-[10px] leading-tight">{lastResult[key]}</span>}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Failed to load coverage.</p>
        )}

        <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
          <Zap className="h-3.5 w-3.5" />
          Click any cell to generate 20 more questions for that subject/level via Gemini.
        </div>
      </div>
    </AdminShell>
  )
}
