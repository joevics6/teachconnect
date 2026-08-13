"use client"

// ============================================================
// components/dashboard/AdminLink.tsx
// Small "Admin" button shown in the teacher/school dashboard
// sidebars, but only to accounts whose email is in the admin list
// (see lib/admin.ts / admin_emails table). Renders nothing for
// everyone else — checks /api/admin/me, the same endpoint the
// admin panel itself uses to gate access, so this can never show
// the button to someone the panel would then reject.
// ============================================================

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => {
        if (res.ok) setIsAdmin(true)
      })
      .catch(() => { /* not an admin, or not logged in — stay hidden */ })
  }, [])

  if (!isAdmin) return null

  return (
    <Link
      href="/admin"
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-0.5 text-purple-700 bg-purple-50 hover:bg-purple-100 font-medium"
    >
      <ShieldCheck className="h-4 w-4 flex-shrink-0" />Admin
    </Link>
  )
}
