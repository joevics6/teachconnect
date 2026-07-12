"use client"

import { useState, useEffect } from "react"
import { Mail, Loader2, AlertCircle, CheckCircle2, Circle } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Submission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<Submission | null>(null)

  useEffect(() => {
    fetch("/api/admin/contact-submissions")
      .then(async (res) => {
        if (res.status === 403) { setError("You don't have access to this page."); return }
        if (res.status === 401) { setError("Please log in."); return }
        if (!res.ok) { setError("Failed to load messages."); return }
        const data = await res.json()
        setSubmissions(data.submissions || [])
      })
      .catch(() => setError("Failed to load messages."))
      .finally(() => setIsLoading(false))
  }, [])

  const openMessage = async (s: Submission) => {
    setSelected(s)
    if (!s.is_read) {
      setSubmissions((prev) => prev.map((m) => m.id === s.id ? { ...m, is_read: true } : m))
      try {
        await fetch("/api/admin/contact-submissions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, is_read: true }),
        })
      } catch (err) {
        console.error("Failed to mark message read:", err)
      }
    }
  }

  const unreadCount = submissions.filter((s) => !s.is_read).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="h-5 w-5 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">Contact Messages</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">{unreadCount} unread</span>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
            No messages yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {submissions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openMessage(s)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${selected?.id === s.id ? "bg-green-50" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {s.is_read ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-green-600 fill-green-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${s.is_read ? "text-gray-600" : "font-semibold text-gray-900"}`}>{s.subject}</p>
                      <p className="text-xs text-gray-500 truncate">{s.name} · {s.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-6">
              {selected ? (
                <>
                  <h2 className="font-bold text-gray-900 mb-1">{selected.subject}</h2>
                  <p className="text-sm text-gray-500 mb-1">
                    From <span className="font-medium text-gray-700">{selected.name}</span> —{" "}
                    <a href={`mailto:${selected.email}`} className="text-green-600 hover:underline">{selected.email}</a>
                  </p>
                  <p className="text-xs text-gray-400 mb-4">{formatDate(selected.created_at)}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Select a message to read it.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
