"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, FileText, CheckCircle2, AlertCircle, Inbox, Plus, Trash2, Play } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/button"

interface ParseResult {
  success: boolean
  batchId: string | null
  totalJobs: number
  processedJobs: number
  failedJobs: number
  skippedJobs: number
  errors: { job: string; error: string }[]
  jobs: { id: string; title: string; school: string }[]
  error?: string
}

async function parseText(jobText: string): Promise<ParseResult> {
  const res = await fetch("/api/admin/jobs/parse-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobText }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok && !data.error) throw new Error("Parsing failed")
  return data as ParseResult
}

// ---- Pocket: stash pasted text now, process later (saved in this browser) ----

type PocketStatus = "pending" | "processing" | "processed" | "failed"
interface PocketItem {
  id: string
  content: string
  status: PocketStatus
  note?: string
}
const POCKET_KEY = "pocket:admin-job-text"
const newBox = (): PocketItem => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, content: "", status: "pending" })

function Pocket({ onDone }: { onDone: () => void }) {
  const [items, setItems] = useState<PocketItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POCKET_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setLoaded(true)
  }, [])
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(POCKET_KEY, JSON.stringify(items))
    } catch {}
  }, [items, loaded])

  const update = useCallback((id: string, patch: Partial<PocketItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const run = useCallback(
    async (item: PocketItem) => {
      if (!item.content.trim()) return
      update(item.id, { status: "processing", note: undefined })
      try {
        const data = await parseText(item.content)
        if (!data.success) throw new Error(data.error || "Parsing failed")
        update(item.id, {
          status: "processed",
          note: `${data.processedJobs} saved${data.skippedJobs ? `, ${data.skippedJobs} duplicate` : ""}${data.failedJobs ? `, ${data.failedJobs} failed` : ""}`,
        })
        onDone()
      } catch (err) {
        update(item.id, { status: "failed", note: err instanceof Error ? err.message : "Failed" })
      }
    },
    [update, onDone]
  )

  const processAll = async () => {
    for (const item of items.filter((i) => i.status !== "processed" && i.content.trim())) {
      // one at a time — each parse is a single AI call
      // eslint-disable-next-line no-await-in-loop
      await run(item)
    }
  }

  const badge: Record<PocketStatus, string> = {
    pending: "border border-gray-300 text-gray-600",
    processing: "bg-ink-600 text-white",
    processed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  }
  const processed = items.filter((i) => i.status === "processed").length

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-gray-900"><Inbox className="h-5 w-5" />Text Pocket (save for later)</h2>
        <p className="text-sm text-gray-500">Paste job text now and process it whenever you&apos;re ready. Saved in this browser until you delete it.</p>
      </div>

      {items.length === 0 && <p className="text-sm text-gray-500">No saved boxes yet. Add one to start stashing content.</p>}

      {items.map((item, idx) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Box {idx + 1}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${badge[item.status]}`}>{item.status}</span>
          </div>
          <textarea
            value={item.content}
            onChange={(e) => update(item.id, { content: e.target.value, status: "pending", note: undefined })}
            placeholder="Paste job posting text here to process later..."
            rows={6}
            disabled={item.status === "processing"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
          {item.note && <p className={`text-xs ${item.status === "failed" ? "text-red-600" : "text-gray-500"}`}>{item.note}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={item.status === "processing"} onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))} className="flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />Delete
            </Button>
            <Button size="sm" disabled={item.status === "processing"} onClick={() => run(item)} className="flex items-center gap-1.5">
              {item.status === "processing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {item.status === "processed" ? "Process again" : "Process"}
            </Button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={() => setItems((p) => [...p, newBox()])} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />Add box
        </Button>
        <div className="flex gap-2">
          {processed > 0 && (
            <Button variant="outline" onClick={() => setItems((p) => p.filter((i) => i.status !== "processed"))}>
              Clear processed ({processed})
            </Button>
          )}
          <Button onClick={processAll} disabled={items.length === 0}>Process all pending</Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminParseJobsPage() {
  const [jobText, setJobText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)

  const handleParse = async () => {
    if (!jobText.trim()) return
    setLoading(true)
    setResult(null)
    try {
      setResult(await parseText(jobText))
    } catch (err) {
      setResult({
        success: false, batchId: null, totalJobs: 0, processedJobs: 0, failedJobs: 0, skippedJobs: 0, errors: [], jobs: [],
        error: err instanceof Error ? err.message : "An error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Text Parser</h1>
            <p className="text-sm text-gray-500">Paste job postings and let AI parse them — every job is written individually.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/parse-jobs/batches"><Button variant="outline">View Batches</Button></Link>
            <Link href="/admin/jobs"><Button variant="outline">View Jobs</Button></Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><FileText className="h-5 w-5" />Paste Job Text</h2>
            <p className="text-sm text-gray-500">
              Paste one or multiple job postings. AI finds the school, splits the text into individual jobs and writes each one&apos;s own
              description, requirements and search content. Jobs are saved as <strong>Pending Approval</strong>.
            </p>
          </div>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            disabled={loading}
            rows={15}
            placeholder={"Paste job posting text here...\n\nYou can paste several postings, or one advert listing several subjects, separated by blank lines or clear dividers.\n\nExample:\n---\nGreenfield Academy, Ikeja, Lagos\nWe need a Mathematics teacher (JSS & SSS) and an English teacher (Primary).\nRequirements: B.Ed or B.Sc with Education, 2 years experience...\nSend CV to jobs@greenfield.ng\n---"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={loading} onClick={() => { setJobText(""); setResult(null) }}>Clear</Button>
            <Button onClick={handleParse} disabled={loading || !jobText.trim()} className="flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Parsing..." : "Parse Jobs"}
            </Button>
          </div>
          {loading && <p className="text-xs text-gray-500 text-right">Writing each job individually — this can take a minute or two for a long paste.</p>}

          {result && (
            <div className={`rounded-xl border p-4 space-y-3 ${result.success ? "border-green-500" : "border-red-500"}`}>
              <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                {result.success ? (
                  <><CheckCircle2 className="h-5 w-5 text-green-500" />Parsing Complete</>
                ) : (
                  <><AlertCircle className="h-5 w-5 text-red-500" />Parsing Failed</>
                )}
              </h3>
              {result.success ? (
                <>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div><div className="text-gray-500">Total Jobs</div><div className="text-2xl font-bold">{result.totalJobs}</div></div>
                    <div><div className="text-gray-500">Saved</div><div className="text-2xl font-bold text-green-600">{result.processedJobs}</div></div>
                    <div><div className="text-gray-500">Duplicates</div><div className="text-2xl font-bold text-gray-600">{result.skippedJobs}</div></div>
                    <div><div className="text-gray-500">Failed</div><div className="text-2xl font-bold text-red-600">{result.failedJobs}</div></div>
                  </div>

                  {result.jobs.length > 0 && (
                    <ul className="text-sm divide-y divide-gray-100 border border-gray-100 rounded-lg">
                      {result.jobs.map((j) => (
                        <li key={j.id} className="px-3 py-2 flex justify-between gap-3">
                          <span className="text-gray-900">{j.title}</span>
                          <span className="text-gray-500 truncate">{j.school}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {result.errors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Errors:</h4>
                      <div className="space-y-1">
                        {result.errors.map((e, i) => (
                          <div key={i} className="text-sm text-red-600 bg-red-50 p-2 rounded">{e.job}: {e.error}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href="/admin/jobs"><Button>Review &amp; Approve Jobs</Button></Link>
                    <Link href="/admin/parse-jobs/batches"><Button variant="outline">View Batch Details</Button></Link>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-600">{result.error || "An unknown error occurred"}</p>
              )}
            </div>
          )}
        </div>

        <Pocket onDone={() => {}} />

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Tips for Better Results</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-500">
            <li>Include the school name and its location (state and LGA) — jobs without a findable location can&apos;t be saved</li>
            <li>Separate unrelated postings with a divider (---) or blank lines</li>
            <li>One advert for several subjects becomes one job per subject, each written separately</li>
            <li>If the school isn&apos;t named, the job is saved under a Confidential School and needs a contact to apply with</li>
            <li>Posts already saved in the last 7 days for the same school and title are skipped as duplicates</li>
            <li>Approve jobs on the Jobs page — approving publishes them and creates their social posts</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  )
}
