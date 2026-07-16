"use client"

import { useState, useEffect } from "react"
import { Loader2, Mail, Download } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { AdminShell } from "@/components/admin/AdminShell"

interface Subscriber {
  id: string
  email: string
  is_active: boolean
  subscribed_at: string
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/newsletter")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setSubscribers(data.subscribers || [])
      })
      .catch((err) => console.error("Failed to load subscribers:", err))
      .finally(() => setIsLoading(false))
  }, [])

  const activeCount = subscribers.filter((s) => s.is_active).length

  const exportCsv = () => {
    const rows = [["Email", "Subscribed At", "Active"]]
    subscribers.forEach((s) => rows.push([s.email, s.subscribed_at, String(s.is_active)]))
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "newsletter-subscribers.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-700" />
            <h1 className="text-xl font-bold text-gray-900">Newsletter Subscribers</h1>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              {activeCount} active
            </span>
          </div>
          {subscribers.length > 0 && (
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-sm font-medium rounded-lg text-gray-700"
            >
              <Download className="h-4 w-4" />Export CSV
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-green-600 animate-spin" /></div>
        ) : subscribers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
            No subscribers yet.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Subscribed</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-gray-900">{s.email}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(s.subscribed_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {s.is_active ? "Active" : "Unsubscribed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
