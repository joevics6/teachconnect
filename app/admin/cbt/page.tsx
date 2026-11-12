"use client"

// /admin/cbt — import past questions (AI, as drafts), review and edit them,
// then publish. Nothing reaches the public CBT pages until it is published.

import { useEffect, useState } from "react"
import { Loader2, Upload, Trash2, Eye, EyeOff, Save, AlertTriangle, Plus } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import type { CbtExam, CbtSubject } from "@/lib/cbt"

interface Question {
  id: string
  exam_id: string
  subject_id: string
  year: number | null
  region: string | null
  topic: string | null
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string | null
  correct_option: "a" | "b" | "c" | "d" | "e"
  explanation: string | null
  answer_source: "document" | "ai" | "manual"
  status: "draft" | "published"
  import_batch: string | null
  passage: { body: string } | null
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"

export default function AdminCbtPage() {
  const [exams, setExams] = useState<CbtExam[]>([])
  const [subjects, setSubjects] = useState<CbtSubject[]>([])

  // import form
  const [impExam, setImpExam] = useState("")
  const [impSubject, setImpSubject] = useState("")
  const [impYear, setImpYear] = useState("")
  const [impRegion, setImpRegion] = useState("")
  const [impFrom, setImpFrom] = useState("1")
  const [impCount, setImpCount] = useState("40")
  const [impText, setImpText] = useState("")
  const [impFile, setImpFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [impMsg, setImpMsg] = useState("")

  // review filters + list
  const [fExam, setFExam] = useState("")
  const [fSubject, setFSubject] = useState("")
  const [fStatus, setFStatus] = useState("draft")
  const [fYear, setFYear] = useState("")
  const [fBatch, setFBatch] = useState("")
  const [page, setPage] = useState(1)
  const [list, setList] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const [metaTick, setMetaTick] = useState(0)
  const [reloadTick, setReloadTick] = useState(0)
  const [loadedKey, setLoadedKey] = useState("")

  const listKey = [page, fExam, fSubject, fStatus, fYear, fBatch, reloadTick].join("|")
  const loading = loadedKey !== listKey

  useEffect(() => {
    let live = true
    fetch("/api/admin/cbt/meta")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (live && data) {
          setExams(data.exams)
          setSubjects(data.subjects)
        }
      })
    return () => { live = false }
  }, [metaTick])

  useEffect(() => {
    let live = true
    const qs = new URLSearchParams({ page: String(page) })
    if (fExam) qs.set("exam_id", fExam)
    if (fSubject) qs.set("subject_id", fSubject)
    if (fStatus) qs.set("status", fStatus)
    if (fYear) qs.set("year", fYear)
    if (fBatch) qs.set("import_batch", fBatch)
    fetch(`/api/admin/cbt/questions?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live) return
        if (data) {
          setList(data.questions)
          setTotal(data.total)
          setPageSize(data.page_size)
        }
        setLoadedKey(listKey)
      })
      .catch(() => { if (live) setLoadedKey(listKey) })
    return () => { live = false }
  }, [page, fExam, fSubject, fStatus, fYear, fBatch, listKey])

  async function addMeta(type: "exam" | "subject") {
    const name = prompt(type === "exam" ? "New exam name (e.g. NABTEB)" : "New subject name")?.trim()
    if (!name) return
    const res = await fetch("/api/admin/cbt/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name, short_name: type === "exam" ? name : undefined }),
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error || "Failed")
    setMetaTick((t) => t + 1)
  }

  async function runImport() {
    setImpMsg("")
    if (!impExam || !impSubject) return setImpMsg("Choose an exam and a subject.")
    if (!impFile && !impText.trim()) return setImpMsg("Upload a file or paste the questions.")
    setImporting(true)
    try {
      const fd = new FormData()
      fd.set("exam_id", impExam)
      fd.set("subject_id", impSubject)
      fd.set("year", impYear)
      fd.set("region", impRegion)
      fd.set("from", impFrom)
      fd.set("count", impCount)
      if (impFile) fd.set("file", impFile)
      else fd.set("text", impText)
      const res = await fetch("/api/admin/cbt/import", { method: "POST", body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Import failed (${res.status})`)
      setImpMsg(
        `Added ${data.inserted} draft question(s). ${data.duplicates} duplicate(s) skipped, ${data.invalid} invalid, ${data.skipped} skipped (need a diagram). Open the review list below and check each answer before publishing.`
      )
      setFExam(impExam); setFSubject(impSubject); setFStatus("draft"); setFBatch(data.batch); setFYear(""); setPage(1)
      setImpFile(null)
    } catch (err) {
      setImpMsg(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  async function save(q: Question, patch: Partial<Question>) {
    setBusy(q.id)
    try {
      const res = await fetch(`/api/admin/cbt/questions/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) return alert(data.error || "Save failed")
      setList((prev) => prev.map((x) => (x.id === q.id ? { ...x, ...data.question } : x)))
      // A status change moves it out of a status-filtered list.
      if ("status" in patch && fStatus) setList((prev) => prev.filter((x) => x.id !== q.id))
    } finally {
      setBusy(null)
    }
  }

  async function remove(q: Question) {
    if (!confirm("Delete this question? This can't be undone.")) return
    setBusy(q.id)
    const res = await fetch(`/api/admin/cbt/questions/${q.id}`, { method: "DELETE" })
    setBusy(null)
    if (res.ok) setList((prev) => prev.filter((x) => x.id !== q.id))
  }

  async function bulk(action: "publish" | "unpublish" | "delete", scope: "page" | "filter") {
    const label = scope === "page" ? `${list.length} question(s) on this page` : `ALL ${total} matching question(s)`
    if (!confirm(`${action[0].toUpperCase()}${action.slice(1)} ${label}?`)) return
    const body =
      scope === "page"
        ? { action, ids: list.map((q) => q.id) }
        : { action, filter: { exam_id: fExam || undefined, subject_id: fSubject || undefined, status: fStatus || undefined, import_batch: fBatch || undefined } }
    const res = await fetch("/api/admin/cbt/questions/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) return alert(data.error || "Failed")
    setNote(`${data.affected} question(s) updated.`)
    setPage(1)
    setReloadTick((t) => t + 1)
  }

  const setLocal = (id: string, patch: Partial<Question>) => setList((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const canFilterBulk = !!fBatch || (!!fExam && !!fSubject)

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">CBT Practice</h1>
          <div className="flex gap-2">
            <button onClick={() => addMeta("exam")} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700"><Plus className="h-3.5 w-3.5" />Exam</button>
            <button onClick={() => addMeta("subject")} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700"><Plus className="h-3.5 w-3.5" />Subject</button>
          </div>
        </div>

        {/* ---------- Import ---------- */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Import past questions</h2>
          <p className="text-sm text-gray-500">
            Upload a PDF or photo (up to 4 MB) or paste the text. Questions are added as drafts. Do about 40 at a time: set the first question number and how many to read, then run again for the next batch.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <select className={inputCls} value={impExam} onChange={(e) => setImpExam(e.target.value)}>
              <option value="">Exam…</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select className={inputCls} value={impSubject} onChange={(e) => setImpSubject(e.target.value)}>
              <option value="">Subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input className={inputCls} placeholder="Year (e.g. 2019)" value={impYear} onChange={(e) => setImpYear(e.target.value)} inputMode="numeric" />
            <input className={inputCls} placeholder="State (only for state exams, e.g. Lagos)" value={impRegion} onChange={(e) => setImpRegion(e.target.value)} />
            <input className={inputCls} placeholder="Start at question no." value={impFrom} onChange={(e) => setImpFrom(e.target.value)} inputMode="numeric" />
            <input className={inputCls} placeholder="How many (max 60)" value={impCount} onChange={(e) => setImpCount(e.target.value)} inputMode="numeric" />
          </div>
          <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => setImpFile(e.target.files?.[0] ?? null)} className="text-sm" />
          <textarea className={`${inputCls} h-32`} placeholder="…or paste the questions (and answers) here" value={impText} onChange={(e) => setImpText(e.target.value)} disabled={!!impFile} />
          <button onClick={runImport} disabled={importing} className="inline-flex items-center gap-2 bg-ink-600 hover:bg-ink-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-60">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? "Reading questions… (up to a minute)" : "Import as drafts"}
          </button>
          {impMsg && <p className="text-sm text-gray-700">{impMsg}</p>}
        </section>

        {/* ---------- Review ---------- */}
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-900">Review and publish</h2>
          <div className="grid sm:grid-cols-5 gap-2">
            <select className={inputCls} value={fExam} onChange={(e) => { setFExam(e.target.value); setFBatch(""); setPage(1) }}>
              <option value="">All exams</option>
              {exams.map((e) => <option key={e.id} value={e.id}>{e.short_name}</option>)}
            </select>
            <select className={inputCls} value={fSubject} onChange={(e) => { setFSubject(e.target.value); setFBatch(""); setPage(1) }}>
              <option value="">All subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className={inputCls} value={fStatus} onChange={(e) => { setFStatus(e.target.value); setPage(1) }}>
              <option value="draft">Drafts</option>
              <option value="published">Published</option>
              <option value="">All</option>
            </select>
            <input className={inputCls} placeholder="Year" value={fYear} onChange={(e) => { setFYear(e.target.value); setPage(1) }} inputMode="numeric" />
            {fBatch ? (
              <button onClick={() => { setFBatch(""); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Clear batch filter</button>
            ) : <span />}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">{total} question(s)</span>
            {list.length > 0 && (
              <>
                <button onClick={() => bulk("publish", "page")} className="px-3 py-1.5 rounded-lg bg-green-600 text-white">Publish this page</button>
                <button onClick={() => bulk("publish", "filter")} disabled={!canFilterBulk} title={canFilterBulk ? "" : "Pick an exam and subject first"} className="px-3 py-1.5 rounded-lg border border-green-600 text-green-700 disabled:opacity-40">Publish all matching</button>
                <button onClick={() => bulk("delete", "filter")} disabled={!canFilterBulk} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 disabled:opacity-40">Delete all matching</button>
              </>
            )}
            {note && <span className="text-green-700">{note}</span>}
          </div>

          {loading ? (
            <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
          ) : list.length === 0 ? (
            <p className="text-gray-500 py-10 text-center">No questions match.</p>
          ) : (
            <div className="space-y-4">
              {list.map((q) => (
                <div key={q.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full ${q.status === "published" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{q.status}</span>
                    {q.year && <span>{q.year}</span>}
                    {q.region && <span>{q.region}</span>}
                    {q.answer_source === "ai" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700"><AlertTriangle className="h-3 w-3" />Answer worked out by AI — check it</span>
                    )}
                  </div>
                  {q.passage && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 whitespace-pre-line max-h-28 overflow-y-auto">{q.passage.body}</p>}
                  <textarea className={`${inputCls} h-20`} value={q.question_text} onChange={(e) => setLocal(q.id, { question_text: e.target.value })} />
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(["a", "b", "c", "d", "e"] as const).map((k) => {
                      const field = `option_${k}` as "option_a"
                      if (k === "e" && !q.option_e) return null
                      return (
                        <label key={k} className="flex items-center gap-2 text-sm">
                          <input type="radio" name={`ans-${q.id}`} checked={q.correct_option === k} onChange={() => setLocal(q.id, { correct_option: k })} title="Correct answer" />
                          <span className="uppercase font-semibold text-gray-500">{k}</span>
                          <input className={inputCls} value={(q[field] as string) ?? ""} onChange={(e) => setLocal(q.id, { [field]: e.target.value } as Partial<Question>)} />
                        </label>
                      )
                    })}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input className={inputCls} placeholder="Topic" value={q.topic ?? ""} onChange={(e) => setLocal(q.id, { topic: e.target.value })} />
                    <input className={`${inputCls} sm:col-span-2`} placeholder="Explanation" value={q.explanation ?? ""} onChange={(e) => setLocal(q.id, { explanation: e.target.value })} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busy === q.id}
                      onClick={() => save(q, { question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, option_e: q.option_e, correct_option: q.correct_option, topic: q.topic, explanation: q.explanation })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 disabled:opacity-50"
                    ><Save className="h-3.5 w-3.5" />Save</button>
                    <button
                      disabled={busy === q.id}
                      onClick={() => save(q, { status: q.status === "published" ? "draft" : "published", question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, option_e: q.option_e, correct_option: q.correct_option, topic: q.topic, explanation: q.explanation })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 ${q.status === "published" ? "border-gray-200 text-gray-700" : "border-green-600 bg-green-600 text-white"}`}
                    >{q.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{q.status === "published" ? "Unpublish" : "Save & publish"}</button>
                    <button disabled={busy === q.id} onClick={() => remove(q)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
              <span className="text-gray-500">Page {page} of {lastPage}</span>
              <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  )
}
