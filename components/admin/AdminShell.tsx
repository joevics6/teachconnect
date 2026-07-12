"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Mail, Users, BookOpen, Newspaper, Loader2, AlertCircle } from "lucide-react"

const ADMIN_NAV = [
  { href: "/admin/contact",   label: "Messages",  icon: Mail },
  { href: "/admin/users",     label: "Users",      icon: Users },
  { href: "/admin/resources", label: "Resources",  icon: BookOpen },
  { href: "/admin/blog",      label: "Blog",       icon: Newspaper },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading")

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => setStatus(res.ok ? "ok" : "denied"))
      .catch(() => setStatus("denied"))
  }, [])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700">You don&apos;t have access to this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto">
          {ADMIN_NAV.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  active ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
      {children}
    </div>
  )
}
