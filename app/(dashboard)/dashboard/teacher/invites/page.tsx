"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Bell, Building2, Briefcase, CheckCircle2,
  XCircle, Clock, Loader2, MapPin, Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Invite {
  id: string
  status: "pending" | "accepted" | "declined"
  created_at: string
  job_id: string
  job_title: string
  job_subject: string
  deadline: string
  job_quiz_enabled: boolean
  school_id: string
  school_name: string
  school_logo: string | null
  school_state: string
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700", icon: Clock         },
    accepted: { label: "Accepted", color: "bg-ink-100 text-ink-700",   icon: CheckCircle2  },
    declined: { label: "Declined", color: "bg-red-100 text-red-500",       icon: XCircle       },
  }
  const s = map[status] || map.pending
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
      <s.icon className="h-3 w-3" />{s.label}
    </span>
  )
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function TeacherInvitesPage() {
  const router = useRouter()
  const [invites, setInvites]   = useState<Invite[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<"all" | "pending" | "accepted" | "declined">("all")
  const [responding, setResponding] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/teacher/invites")
      .then(async (res) => {
        if (res.status === 401) { router.push("/login"); return }
        if (!res.ok) return
        const data = await res.json()
        setInvites(data.invites || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  const handleRespond = async (inviteId: string, status: "accepted" | "declined") => {
    setResponding(inviteId)
    try {
      const res = await fetch("/api/teacher/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_id: inviteId, status }),
      })
      if (!res.ok) return
      setInvites((prev) =>
        prev.map((inv) => inv.id === inviteId ? { ...inv, status } : inv)
      )

      // Accepting an invite means applying — send the teacher into the same
      // apply flow used everywhere else on the site (quiz-gated or direct).
      if (status === "accepted") {
        const invite = invites.find((inv) => inv.id === inviteId)
        if (invite?.job_id) {
          router.push(invite.job_quiz_enabled ? `/quiz/${invite.job_id}` : `/apply/${invite.job_id}`)
          return
        }
      }
    } catch (err) {
      console.error("Respond error:", err)
    } finally {
      setResponding(null)
    }
  }

  const filtered = filter === "all" ? invites : invites.filter((i) => i.status === filter)
  const pendingCount = invites.filter((i) => i.status === "pending").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard/teacher">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-ink-600" />
            <h1 className="text-lg font-bold text-gray-900">Job Invites</h1>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount} new
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "accepted", "declined"] as const).map((f) => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                filter === f
                  ? "bg-ink-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-ink-400"
              }`}>
              {f} {f === "all" ? `(${invites.length})` : f === "pending" ? `(${pendingCount})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-ink-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 mb-1">
              {filter === "all" ? "No invites yet" : `No ${filter} invites`}
            </p>
            <p className="text-sm text-gray-400">
              {filter === "all"
                ? "When schools invite you to apply for a job, it will appear here."
                : `You have no ${filter} invites at the moment.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((invite) => (
              <div key={invite.id}
                className={`bg-white rounded-xl border p-5 transition ${
                  invite.status === "pending" ? "border-ink-200 shadow-sm" : "border-gray-100"
                }`}>

                {/* School + Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {invite.school_logo
                        ? <img src={invite.school_logo} alt={invite.school_name} className="w-full h-full object-contain p-1" />
                        : <span className="text-blue-700 font-bold text-xs">{getInitials(invite.school_name)}</span>
                      }
                    </div>
                    <div>
                      <Link href={`/schools/${invite.school_id}`}
                        className="font-bold text-gray-900 text-sm hover:text-ink-700 transition">
                        {invite.school_name}
                      </Link>
                      {invite.school_state && (
                        <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <MapPin className="h-3 w-3" />{invite.school_state}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={invite.status} />
                </div>

                {/* Job details */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{invite.job_title}</p>
                      {invite.job_subject && (
                        <p className="text-xs text-gray-500 mt-0.5">Subject: {invite.job_subject}</p>
                      )}
                      {invite.deadline && (
                        <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Calendar className="h-3 w-3" />
                          Deadline: {new Date(invite.deadline).toLocaleDateString("en-NG", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invited at */}
                <p className="text-xs text-gray-400 mb-4">
                  Invited {new Date(invite.created_at).toLocaleDateString("en-NG", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </p>

                {/* Actions */}
                {invite.status === "pending" ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleRespond(invite.id, "accepted")}
                      disabled={responding === invite.id}
                      className="flex-1 bg-ink-600 hover:bg-ink-700 text-white flex items-center gap-2"
                    >
                      {responding === invite.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <CheckCircle2 className="h-4 w-4" />
                      }
                      Accept & Apply
                    </Button>
                    <Button
                      onClick={() => handleRespond(invite.id, "declined")}
                      disabled={responding === invite.id}
                      variant="outline"
                      className="flex-1 text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link href={`/jobs/${invite.job_id}`} className="flex-1">
                      <Button variant="outline" className="w-full flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        View Job
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
