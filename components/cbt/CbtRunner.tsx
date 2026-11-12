"use client"

// ============================================================
// components/cbt/CbtRunner.tsx
// The practice runner: setup -> timed test -> results with review.
// Questions come from /api/cbt/questions (published only, random set).
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Clock, Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { defaultSeconds, type CbtOptionKey, type CbtRunnerQuestion } from "@/lib/cbt"

interface Props {
  examSlug: string
  subjectSlug: string
  examName: string
  subjectName: string
  total: number
  years: number[]
  defaultCount: number
}

type Phase = "setup" | "loading" | "running" | "results"

const COUNT_CHOICES = [10, 20, 40, 60]

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function CbtRunner({ examSlug, subjectSlug, examName, subjectName, total, years, defaultCount }: Props) {
  const [phase, setPhase] = useState<Phase>("setup")
  const [error, setError] = useState("")
  const [count, setCount] = useState(Math.min(defaultCount, total))
  const [year, setYear] = useState<string>("all")
  const [timed, setTimed] = useState(true)

  const [questions, setQuestions] = useState<CbtRunnerQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, CbtOptionKey>>({})
  const [index, setIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [secondsUsed, setSecondsUsed] = useState(0)
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong">("all")
  const startedAt = useRef(0)

  const countOptions = useMemo(() => {
    const opts = COUNT_CHOICES.filter((c) => c < total)
    return [...opts, total].filter((v, i, a) => a.indexOf(v) === i)
  }, [total])

  const finish = useCallback(() => {
    setSecondsUsed(Math.round((Date.now() - startedAt.current) / 1000))
    setPhase("results")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  async function start() {
    setError("")
    setPhase("loading")
    try {
      const qs = new URLSearchParams({ exam: examSlug, subject: subjectSlug, count: String(count) })
      if (year !== "all") qs.set("year", year)
      const res = await fetch(`/api/cbt/questions?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(data?.error || "No questions found for that choice.")
      }
      setQuestions(data.questions)
      setAnswers({})
      setIndex(0)
      setReviewFilter("all")
      setSecondsLeft(timed ? defaultSeconds(data.questions.length) : 0)
      startedAt.current = Date.now()
      setPhase("running")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load questions.")
      setPhase("setup")
    }
  }

  // Countdown. Auto-submits at zero.
  useEffect(() => {
    if (phase !== "running" || !timed) return
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id)
          finish()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, timed, finish])

  const q = questions[index]
  const answeredCount = Object.keys(answers).length

  const score = useMemo(() => questions.filter((x) => answers[x.id] === x.correct_option).length, [questions, answers])

  const topics = useMemo(() => {
    const map = new Map<string, { right: number; total: number }>()
    for (const x of questions) {
      const t = x.topic?.trim() || "General"
      const cur = map.get(t) ?? { right: 0, total: 0 }
      cur.total += 1
      if (answers[x.id] === x.correct_option) cur.right += 1
      map.set(t, cur)
    }
    return Array.from(map.entries())
      .map(([topic, v]) => ({ topic, ...v, pct: Math.round((v.right / v.total) * 100) }))
      .sort((a, b) => a.pct - b.pct)
  }, [questions, answers])

  // ---------------- setup ----------------
  if (phase === "setup" || phase === "loading") {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of questions</label>
          <div className="flex flex-wrap gap-2">
            {countOptions.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`px-4 py-2 rounded-lg text-sm border ${count === c ? "bg-ink-600 border-ink-600 text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
              >
                {c === total && !COUNT_CHOICES.includes(c) ? `All ${c}` : c}
              </button>
            ))}
          </div>
        </div>

        {years.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full sm:w-60 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
          Timed test (about 1 minute per question)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={start}
          disabled={phase === "loading"}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink-600 hover:bg-ink-700 text-white font-medium px-6 py-3 rounded-xl disabled:opacity-60"
        >
          {phase === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          Start {examName} {subjectName} test
        </button>
      </div>
    )
  }

  // ---------------- results ----------------
  if (phase === "results") {
    const pct = Math.round((score / questions.length) * 100)
    const shown = questions.filter((x) => reviewFilter === "all" || answers[x.id] !== x.correct_option)
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Your score</p>
          <p className="text-5xl font-bold text-gray-900">{score}<span className="text-2xl text-gray-400"> / {questions.length}</span></p>
          <p className="text-gray-500 mt-1">{pct}% · {answeredCount} answered · {fmt(secondsUsed)} used</p>
          <button onClick={() => setPhase("setup")} className="mt-5 inline-flex items-center gap-2 bg-ink-600 hover:bg-ink-700 text-white font-medium px-5 py-2.5 rounded-xl">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>

        {topics.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Topics to revise</h2>
            <ul className="space-y-2">
              {topics.map((t) => (
                <li key={t.topic} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-700">{t.topic}</span>
                  <span className={t.pct < 50 ? "text-red-600 font-medium" : "text-gray-500"}>{t.right}/{t.total} ({t.pct}%)</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Review</h2>
            <div className="flex gap-2 text-sm">
              {(["all", "wrong"] as const).map((f) => (
                <button key={f} onClick={() => setReviewFilter(f)} className={`px-3 py-1 rounded-lg border ${reviewFilter === f ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600"}`}>
                  {f === "all" ? "All" : "Wrong only"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {shown.map((x) => {
              const mine = answers[x.id]
              const right = mine === x.correct_option
              return (
                <div key={x.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                  {x.passage && <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-3 whitespace-pre-line">{x.passage}</p>}
                  <p className="text-gray-900 font-medium whitespace-pre-line mb-3">{x.question_text}</p>
                  <ul className="space-y-1.5 text-sm">
                    {x.options.map((o) => {
                      const isRight = o.key === x.correct_option
                      const isMine = o.key === mine
                      return (
                        <li key={o.key} className={`flex items-start gap-2 rounded-lg px-3 py-2 ${isRight ? "bg-green-50 text-green-800" : isMine ? "bg-red-50 text-red-700" : "text-gray-600"}`}>
                          <span className="font-semibold uppercase">{o.key}.</span>
                          <span className="flex-1">{o.text}</span>
                          {isRight && <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                          {isMine && !isRight && <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        </li>
                      )
                    })}
                  </ul>
                  {!mine && <p className="text-xs text-gray-400 mt-2">Not answered</p>}
                  {x.explanation && <p className="text-sm text-gray-600 mt-3"><span className="font-medium">Explanation: </span>{x.explanation}</p>}
                  <p className="text-xs text-gray-400 mt-3">{right ? "Correct" : "Incorrect"}{x.year ? ` · ${x.year}` : ""}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ---------------- running ----------------
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Question {index + 1} of {questions.length} · {answeredCount} answered</span>
        {timed && (
          <span className={`inline-flex items-center gap-1.5 font-mono font-semibold ${secondsLeft <= 60 ? "text-red-600" : "text-gray-800"}`}>
            <Clock className="h-4 w-4" /> {fmt(secondsLeft)}
          </span>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
        {q.passage && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-4 whitespace-pre-line max-h-64 overflow-y-auto">{q.passage}</p>}
        <p className="text-lg text-gray-900 whitespace-pre-line mb-4">{q.question_text}</p>
        <div className="space-y-2">
          {q.options.map((o) => {
            const selected = answers[q.id] === o.key
            return (
              <button
                key={o.key}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.key }))}
                className={`w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${selected ? "border-ink-600 bg-ink-50 text-gray-900" : "border-gray-200 hover:bg-gray-50 text-gray-700"}`}
              >
                <span className={`font-semibold uppercase ${selected ? "text-ink-700" : "text-gray-400"}`}>{o.key}.</span>
                <span className="flex-1">{o.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        {index < questions.length - 1 ? (
          <button onClick={() => setIndex((i) => i + 1)} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-ink-600 hover:bg-ink-700 text-white text-sm">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => {
              if (answeredCount < questions.length && !confirm(`You have ${questions.length - answeredCount} unanswered question(s). Submit anyway?`)) return
              finish()
            }}
            className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
          >
            Submit
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {questions.map((x, i) => (
            <button
              key={x.id}
              onClick={() => setIndex(i)}
              className={`h-9 w-9 rounded-lg text-xs font-medium border ${i === index ? "border-ink-600 ring-2 ring-ink-200" : "border-gray-200"} ${answers[x.id] ? "bg-ink-600 text-white" : "bg-white text-gray-600"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            if (answeredCount < questions.length && !confirm(`You have ${questions.length - answeredCount} unanswered question(s). Submit anyway?`)) return
            finish()
          }}
          className="mt-4 text-sm text-gray-500 hover:text-gray-800 underline"
        >
          Submit test now
        </button>
      </div>
    </div>
  )
}
