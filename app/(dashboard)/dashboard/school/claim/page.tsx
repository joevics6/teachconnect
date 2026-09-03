"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, School, Loader2, Send, CheckCircle2, Clock, XCircle, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SchoolSidebar } from "@/components/dashboard/SchoolSidebar"
import { formatDate } from "@/lib/utils"
import { getFetchErrorMessage } from "@/lib/network-error"

interface UnclaimedSchool {
  id: string
  school_name: string
  school_type: string
  state: string
  lga: string
  logo_url: string | null
}

interface ClaimRequest {
  id: string
  school_id: string
  message: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
  school_profiles: { school_name: string; state: string; lga: string } | null
}

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "Pending Review", color: "text-yellow-600 bg-yellow-50" },
  approved: { icon: CheckCircle2, label: "Approved", color: "text-ink-600 bg-ink-50" },
  rejected: { icon: XCircle, label: "Rejected", color: "text-red-600 bg-red-50" },
}

export default function ClaimSchoolPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<UnclaimedSchool[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<UnclaimedSchool | null>(null)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [myRequests, setMyRequests] = useState<ClaimRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  const fetchMyRequests = useCallback(async () => {
    setLoadingRequests(true)
    try {
      const res = await fetch("/api/school/claim")
      const data = await res.json()
      setMyRequests(data.requests || [])
    } catch {
      // silent — this is a secondary status list, not the main task
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchMyRequests, 0)
    return () => clearTimeout(t)
  }, [fetchMyRequests])

  useEffect(() => {
    if (search.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the query is too short to search; doesn't cascade since `results` isn't a dependency here
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/schools/search-unclaimed?search=${encodeURIComponent(search)}`)
        const data = await res.json()
        setResults(data.schools || [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch("/api/school/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id: selected.id, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit claim")
      setSubmitted(true)
      setSelected(null)
      setSearch("")
      setMessage("")
      fetchMyRequests()
    } catch (err) {
      setSubmitError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Failed to submit claim"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SchoolSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
          <span className="font-bold text-gray-900">Claim Your School</span>
          <div className="w-6" />
        </div>

        <div className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Claim Your School</h1>
          <p className="text-sm text-gray-500 mb-6">
            If ClassHire already has a listing for your school (posted by our team), search for it below and claim it — any jobs already posted will move into your dashboard once approved.
          </p>

          {submitted && (
            <div className="bg-ink-50 border border-ink-200 rounded-xl p-4 mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-ink-600 flex-shrink-0" />
              <p className="text-sm text-ink-700">Claim request submitted — we&apos;ll review it shortly.</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(null) }}
                placeholder="Search by school name"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {searching && <p className="text-xs text-gray-400">Searching...</p>}

            {!searching && search.trim().length >= 2 && results.length === 0 && (
              <p className="text-xs text-gray-400">No matching unclaimed schools found.</p>
            )}

            {results.length > 0 && !selected && (
              <div className="space-y-2">
                {results.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-ink-300 hover:bg-ink-50/50 transition-colors flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <School className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.school_name}</p>
                      <p className="text-xs text-gray-500">{s.lga}, {s.state}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <div className="border border-ink-300 bg-ink-50/50 rounded-lg p-4 mt-2">
                <p className="text-sm font-semibold text-gray-900 mb-1">{selected.school_name}</p>
                <p className="text-xs text-gray-500 mb-3">{selected.lga}, {selected.state}</p>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Message to admin (optional — e.g. your role at the school)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                  placeholder="I'm the proprietor / HR contact for this school..."
                />
                {submitError && <p className="text-red-500 text-xs mb-2">{submitError}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Cancel</Button>
                  <Button
                    size="sm"
                    className="bg-ink-600 hover:bg-ink-700 text-white flex items-center gap-1.5"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Submit Claim
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!loadingRequests && myRequests.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-3">Your Claim Requests</h2>
              <div className="space-y-2">
                {myRequests.map((req) => {
                  const cfg = STATUS_CONFIG[req.status]
                  const StatusIcon = cfg.icon
                  return (
                    <div key={req.id} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{req.school_profiles?.school_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(req.created_at)}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
