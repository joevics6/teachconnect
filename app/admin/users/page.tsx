"use client"

import { useState, useEffect } from "react"
import { Loader2, Search, ShieldCheck, ShieldOff, Ban, CheckCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { AdminShell } from "@/components/admin/AdminShell"

interface AdminUser {
  id: string
  user_id: string
  role: "teacher" | "school"
  name: string
  email: string | null
  phone: string | null
  state: string | null
  contact_name?: string | null
  is_verified: boolean | null
  is_visible: boolean | null
  is_disabled: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "teacher" | "school">("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    fetch(`/api/admin/users?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setUsers(data.users || [])
      })
      .catch((err) => console.error("Failed to load users:", err))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleAction = async (u: AdminUser, action: "toggle_disabled" | "verify", value: boolean) => {
    setBusyId(u.id)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: u.role, id: u.id, action, value }),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((x) => x.id === u.id
          ? { ...x, ...(action === "toggle_disabled" ? { is_disabled: value } : { is_verified: value }) }
          : x))
      }
    } catch (err) {
      console.error("Action failed:", err)
    } finally {
      setBusyId(null)
    }
  }

  const filtered = users.filter((u) => roleFilter === "all" || u.role === roleFilter)

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Users</h1>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["all", "teacher", "school"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition ${
                  roleFilter === r ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-green-600 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
            No users found.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={`${u.role}-${u.id}`} className={u.is_disabled ? "bg-red-50/40" : ""}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "school" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.email || u.phone || <span className="text-gray-400">— (no email on file)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.state || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {u.is_disabled && (
                          <span className="text-xs font-medium text-red-600">Disabled</span>
                        )}
                        {u.role === "school" && (
                          <span className={`text-xs font-medium ${u.is_verified ? "text-green-600" : "text-gray-400"}`}>
                            {u.is_verified ? "Verified" : "Not verified"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {u.role === "school" && (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => handleAction(u, "verify", !u.is_verified)}
                            title={u.is_verified ? "Remove verification" : "Verify school"}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                          >
                            {u.is_verified ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4 text-green-600" />}
                          </button>
                        )}
                        <button
                          disabled={busyId === u.id}
                          onClick={() => handleAction(u, "toggle_disabled", !u.is_disabled)}
                          title={u.is_disabled ? "Enable account" : "Disable account"}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                        >
                          {u.is_disabled ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Ban className="h-4 w-4 text-red-500" />}
                        </button>
                      </div>
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
