"use client"

import { useMemo, useState } from "react"
import { AlertCircle, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CLASS_GROUPS, OTHER_SUBJECT, TERMS, subjectsFor } from "@/lib/tools/curriculum"
import { buildLessonNoteDoc, type LessonNoteContent } from "@/lib/tools/lesson-note"
import { DocActions, DocPreview } from "./DocPreview"

const field = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
const labelCls = "mb-1 block text-sm font-medium text-gray-700"
const DURATIONS = [30, 35, 40, 45, 60, 80]

export default function LessonNoteTool() {
  const [className, setClassName] = useState("")
  const [subjectChoice, setSubjectChoice] = useState("")
  const [customSubject, setCustomSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [subtopic, setSubtopic] = useState("")
  const [term, setTerm] = useState("")
  const [week, setWeek] = useState("")
  const [duration, setDuration] = useState(40)
  const [includeAnswers, setIncludeAnswers] = useState(true)
  const [school, setSchool] = useState("")
  const [teacher, setTeacher] = useState("")
  const [date, setDate] = useState("")
  const [pupilsInClass, setPupilsInClass] = useState("")
  const [averageAge, setAverageAge] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ note: LessonNoteContent; snapshot: ReturnType<typeof snapshotOf> } | null>(null)

  const subjects = useMemo(() => (className ? subjectsFor(className) : []), [className])
  const subject = subjectChoice === OTHER_SUBJECT ? customSubject.trim() : subjectChoice

  function snapshotOf() {
    return {
      req: {
        className, subject, topic: topic.trim(), subtopic: subtopic.trim() || undefined,
        term: term || undefined, week: week || undefined, duration, includeAnswers,
      },
      details: { school: school.trim(), teacher: teacher.trim(), date, pupilsInClass: pupilsInClass.trim(), averageAge: averageAge.trim() },
    }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!className || !subject || topic.trim().length < 2) {
      setError("Please choose a class and subject and enter the topic.")
      return
    }
    const snapshot = snapshotOf()
    setLoading(true)
    try {
      const res = await fetch("/api/tools/lesson-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot.req),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Something went wrong. Please try again.")
      setResult({ note: data.note, snapshot })
      setTimeout(() => document.getElementById("lesson-note-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const doc = result ? buildLessonNoteDoc(result.snapshot.req, result.snapshot.details, result.note) : null

  return (
    <div className="space-y-6">
      <form onSubmit={generate} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Class <span className="text-red-500">*</span></label>
            <select className={field} value={className} onChange={(e) => { setClassName(e.target.value); setSubjectChoice("") }}>
              <option value="">Select class</option>
              {CLASS_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Subject <span className="text-red-500">*</span></label>
            <select className={field} value={subjectChoice} onChange={(e) => setSubjectChoice(e.target.value)} disabled={!className}>
              <option value="">{className ? "Select subject" : "Choose a class first"}</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {subjectChoice === OTHER_SUBJECT && (
          <div>
            <label className={labelCls}>Your subject</label>
            <input className={field} maxLength={60} value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="e.g. Music" />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Topic <span className="text-red-500">*</span></label>
            <input className={field} maxLength={120} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Addition of fractions" />
          </div>
          <div>
            <label className={labelCls}>Sub-topic <span className="text-gray-400">(optional)</span></label>
            <input className={field} maxLength={120} value={subtopic} onChange={(e) => setSubtopic(e.target.value)} placeholder="e.g. Like denominators" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Term <span className="text-gray-400">(optional)</span></label>
            <select className={field} value={term} onChange={(e) => setTerm(e.target.value)}>
              <option value="">—</option>
              {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Week <span className="text-gray-400">(optional)</span></label>
            <select className={field} value={week} onChange={(e) => setWeek(e.target.value)}>
              <option value="">—</option>
              {Array.from({ length: 14 }, (_, i) => <option key={i} value={String(i + 1)}>Week {i + 1}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Lesson length</label>
            <select className={field} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
            </select>
          </div>
        </div>

        <details className="rounded-lg border border-gray-200 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">Add school and teacher details (optional)</summary>
          <p className="mt-2 text-xs text-gray-500">These go on the printed note only. They are not sent to the AI.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>School name</label><input className={field} maxLength={80} value={school} onChange={(e) => setSchool(e.target.value)} /></div>
            <div><label className={labelCls}>Teacher&apos;s name</label><input className={field} maxLength={80} value={teacher} onChange={(e) => setTeacher(e.target.value)} /></div>
            <div><label className={labelCls}>Date</label><input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>No. in class</label><input className={field} inputMode="numeric" maxLength={3} value={pupilsInClass} onChange={(e) => setPupilsInClass(e.target.value.replace(/\D/g, ""))} /></div>
              <div><label className={labelCls}>Average age</label><input className={field} inputMode="numeric" maxLength={2} value={averageAge} onChange={(e) => setAverageAge(e.target.value.replace(/\D/g, ""))} /></div>
            </div>
          </div>
        </details>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={includeAnswers} onChange={(e) => setIncludeAnswers(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
          Include answers to the evaluation questions
        </label>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <Button type="submit" size="lg" className="h-11 w-full text-base sm:w-auto sm:px-8" disabled={loading}>
          {loading ? <><Loader2 className="animate-spin" /> Writing your lesson note… (about 20 seconds)</> : <><Sparkles /> Generate lesson note</>}
        </Button>
      </form>

      {doc && (
        <div id="lesson-note-result" className="space-y-4 scroll-mt-20">
          <DocActions doc={doc} />
          <DocPreview doc={doc} />
          <p className="text-xs text-gray-500">
            This note is AI-generated. Please read it through and adjust it to your scheme of work, your class and your school&apos;s format before you teach.
          </p>
        </div>
      )}
    </div>
  )
}
