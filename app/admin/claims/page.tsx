"use client"

import { useState, useEffect, useCallback } from "react"
import { ClipboardCheck, Loader2, CheckCircle2, XCircle, School } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { getFetchErrorMessage } from "@/lib/network-error"

interface ClaimRequest {
  id: string
  school_id: string
  message: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
  reviewed_at: string | null
  school_profiles: { school_name: string; state: string; lga: string; logo_url: string | null } | null
  requester: { email: string } | null
}

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

export default function AdminClaimsPage() {
  const [requests, setRequests] = useState<ClaimRequest[]>([])
  const [tab, setTab] = useState("pending")
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  const fetchClaims = useCallback(async () => {
    setIsLoading(true)
    setFetchError("")
    try {
      const res = await fetch(`/api/admin/claims?status=${tab}`)
      if (!res.ok) throw new Error("Failed to load claims")
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (err) {
      setFetchError(getFetchErrorMessage(err, "Failed to load claims"))
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => {
    const t = setTimeout(fetchClaims, 0)
    return () => clearTimeout(t)
  }, [fetchClaims])

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActioningId(id)
    setActionError("")
    try {
      const res = await fetch(`/api/admin/claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to review claim")
      fetchClaims()
    } catch (err) {
      setActionError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Failed to review claim"))
    } finally {
      setActioningId(null)
    }
  }

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <ClipboardCheck className="h-6 w-6" />
          School Claims
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Schools requesting to claim a profile you created. Approving moves any jobs already posted to the requester&apos;s real account.
        </p>

        <div className="flex gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                tab === t.value ? "bg-ink-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {actionError && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{actionError}</p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : fetchError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 text-sm mb-4">{fetchError}</p>
            <Button variant="outline" onClick={fetchClaims}>Try Again</Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 text-sm">No {tab} claim requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <School className="h-4 w-4 text-gray-400" />
                      {req.school_profiles?.school_name || "Unknown school"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.school_profiles?.lga}, {req.school_profiles?.state}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(req.created_at)}</p>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  Requested by <span className="font-medium text-gray-900">{req.requester?.email || "unknown"}</span>
                </p>
                {req.message && (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mt-2">{req.message}</p>
                )}

                {req.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="bg-ink-600 hover:bg-ink-700 text-white flex items-center gap-1.5"
                      onClick={() => handleAction(req.id, "approve")}
                      disabled={actioningId === req.id}
                    >
                      {actioningId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1.5 text-red-600 border-red-200"
                      onClick={() => handleAction(req.id, "reject")}
                      disabled={actioningId === req.id}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
