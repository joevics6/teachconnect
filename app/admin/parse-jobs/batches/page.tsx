"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/button"

interface Batch {
  id: string
  source_type: string
  status: string
  total_jobs: number
  processed_jobs: number
  failed_jobs: number
  skipped_jobs: number
  errors: { job?: string; error: string }[] | null
  processing_duration_ms: number | null
  created_at: string
}
interface Stats {
  totalBatches: number
  completedBatches: number
  totalJobsProcessed: number
  totalJobsFailed: number
}

const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  processing: "bg-blue-100 text-blue-700",
  pending: "bg-gray-100 text-gray-600",
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />
  if (status === "processing") return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
  if (status === "partial") return <AlertCircle className="h-4 w-4 text-yellow-500" />
  return <Clock className="h-4 w-4 text-gray-500" />
}

export default function AdminParseBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [missingTable, setMissingTable] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/admin/jobs/batches")
      .then((r) => r.json())
      .then((d) => {
        setBatches(d.batches || [])
        setStats(d.stats || null)
        setMissingTable(!!d.missingTable)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const statCards = stats
    ? [
        { label: "Total Batches", value: stats.totalBatches, color: "text-gray-900" },
        { label: "Completed", value: stats.completedBatches, color: "text-green-600" },
        { label: "Jobs Saved", value: stats.totalJobsProcessed, color: "text-blue-600" },
        { label: "Failed Jobs", value: stats.totalJobsFailed, color: "text-red-600" },
      ]
    : []

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Processing Batches</h1>
            <p className="text-sm text-gray-500">Track job parsing runs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading} className="flex items-center gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
            </Button>
            <Link href="/admin/parse-jobs"><Button>Parse New Jobs</Button></Link>
          </div>
        </div>

        {missingTable && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
            Batch history isn&apos;t set up yet. Run <span className="font-mono">supabase/job_batches.sql</span> in the Supabase SQL editor.
            Parsing works without it, but runs won&apos;t be recorded here.
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((c) => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-sm text-gray-500">{c.label}</div>
                <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Batch History</h2>
          {loading && batches.length === 0 ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : batches.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No batches found. Start by parsing some jobs!</p>
          ) : (
            <div className="space-y-4">
              {batches.map((b) => (
                <div key={b.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={b.status} />
                      <div>
                        <div className="font-semibold text-gray-900">Text Parser</div>
                        <div className="text-sm text-gray-500">{ago(b.created_at)}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>{b.status}</span>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div><div className="text-gray-500">Total</div><div className="text-lg font-semibold">{b.total_jobs}</div></div>
                    <div><div className="text-gray-500">Saved</div><div className="text-lg font-semibold text-green-600">{b.processed_jobs}</div></div>
                    <div><div className="text-gray-500">Duplicates</div><div className="text-lg font-semibold text-gray-600">{b.skipped_jobs}</div></div>
                    <div><div className="text-gray-500">Failed</div><div className="text-lg font-semibold text-red-600">{b.failed_jobs}</div></div>
                    <div>
                      <div className="text-gray-500">Duration</div>
                      <div className="text-lg font-semibold">{b.processing_duration_ms ? `${(b.processing_duration_ms / 1000).toFixed(1)}s` : "-"}</div>
                    </div>
                  </div>

                  {Array.isArray(b.errors) && b.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-sm font-semibold text-red-900 mb-2">Errors ({b.errors.length})</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {b.errors.slice(0, 5).map((e, i) => (
                          <div key={i} className="text-xs text-red-700">{e.job ? `${e.job}: ` : ""}{e.error}</div>
                        ))}
                        {b.errors.length > 5 && <div className="text-xs text-red-700">... and {b.errors.length - 5} more</div>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
