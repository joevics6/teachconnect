"use client"

// ============================================================
// components/dashboard/TeacherSidebar.tsx
// Shared sidebar for every teacher dashboard page. Single source
// of truth for nav items and the logged-in teacher's profile info,
// so pages can't drift out of sync with each other.
// ============================================================

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  GraduationCap,
  Briefcase,
  Bell,
  BookOpen,
  Star,
  Zap,
  User,
  Settings,
  X,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react"
import { LogoutButton } from "@/components/layout/LogoutButton"

export const TEACHER_NAV_ITEMS = [
  { href: "/dashboard/teacher",                     label: "Overview",        icon: GraduationCap },
  { href: "/dashboard/teacher/applications",        label: "My Applications", icon: Briefcase     },
  { href: "/dashboard/teacher/invites",             label: "Invites",         icon: Bell          },
  { href: "/dashboard/teacher/saved-jobs",          label: "Saved Jobs",      icon: BookOpen      },
  { href: "/dashboard/teacher/quiz-results",        label: "Quiz Results",    icon: Star          },
  { href: "/dashboard/teacher/specialization-quiz", label: "Subject Mastery", icon: Zap           },
  { href: "/dashboard/teacher/edit-profile",        label: "Edit Profile",    icon: User          },
  { href: "/dashboard/teacher/settings",            label: "Settings",        icon: Settings      },
]

interface SidebarProfile {
  full_name: string
  state: string | null
  subjects: string[]
  photo_url: string | null
  is_visible: boolean
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export function TeacherSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<SidebarProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  useEffect(() => {
    fetch("/api/teacher/profile")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        if (data.profile) setProfile(data.profile)
      })
      .catch((err) => console.error("Sidebar profile fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleToggleVisibility = async () => {
    if (!profile) return
    const next = !profile.is_visible
    setTogglingVisibility(true)
    try {
      const res = await fetch("/api/teacher/profile/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: next }),
      })
      if (res.ok) setProfile((p) => (p ? { ...p, is_visible: next } : p))
    } catch (err) {
      console.error("Visibility toggle error:", err)
    } finally {
      setTogglingVisibility(false)
    }
  }

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-auto flex flex-col`}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white p-1.5 rounded-lg"><GraduationCap className="h-4 w-4" /></div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-xs text-gray-900">JobMeter</span>
              <span className="font-bold text-xs text-green-600">TeachConnect</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button>
        </div>

        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt={profile.full_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="text-green-700 font-bold text-sm">{profile ? getInitials(profile.full_name) : "?"}</span>
              )}
            </div>
            <div className="min-w-0">
              {loading ? (
                <>
                  <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-900 text-sm truncate">{profile?.full_name || "Teacher"}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {profile?.subjects?.[0] || "Teacher"}{profile?.state ? ` • ${profile.state}` : ""}
                  </p>
                </>
              )}
            </div>
          </div>

          {profile && (
            <button
              onClick={handleToggleVisibility}
              disabled={togglingVisibility}
              className={`mt-4 w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                profile.is_visible
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
            >
              <span>{profile.is_visible ? "Visible to Schools" : "Hidden from Schools"}</span>
              {togglingVisibility ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : profile.is_visible ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          {TEACHER_NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-0.5 ${
                  active ? "bg-green-50 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />{item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <LogoutButton />
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />}
    </>
  )
}
