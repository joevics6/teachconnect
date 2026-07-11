"use client"

// ============================================================
// components/dashboard/SchoolSidebar.tsx
// Shared sidebar for every school dashboard page. Single source
// of truth for nav items and the logged-in school's profile info,
// so pages can't drift out of sync with each other.
// ============================================================

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Briefcase,
  GraduationCap,
  Star,
  CreditCard,
  Settings,
  X,
} from "lucide-react"
import { LogoutButton } from "@/components/layout/LogoutButton"

// "Applicants" isn't its own page — applicants are reviewed per-job from
// My Jobs (each job has a "Review Applicants" link), so there's no
// standalone destination to send this nav item to.
export const SCHOOL_NAV_ITEMS = [
  { href: "/dashboard/school",              label: "Overview",        icon: Building2     },
  { href: "/dashboard/school/jobs",         label: "My Jobs",         icon: Briefcase     },
  { href: "/talent",                        label: "Browse Teachers", icon: GraduationCap },
  { href: "/dashboard/school/saved-teachers", label: "Saved Teachers", icon: Star          },
  { href: "/dashboard/school/subscription", label: "Subscription",    icon: CreditCard    },
  { href: "/dashboard/school/edit-profile", label: "Edit Profile",    icon: Building2     },
  { href: "/dashboard/school/settings",     label: "Settings",        icon: Settings      },
]

interface SidebarProfile {
  school_name: string
  school_type: string | null
  state: string | null
  logo_url: string | null
}

export function SchoolSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<SidebarProfile | null>(null)
  const [planType, setPlanType] = useState<"free" | "standard" | "term">("free")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/school/profile")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        if (data.school) setProfile(data.school)
      })
      .catch((err) => console.error("Sidebar profile fetch error:", err))
      .finally(() => setLoading(false))

    fetch("/api/school/subscription")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setPlanType(data.subscription?.plan_type || "free")
      })
      .catch((err) => console.error("Sidebar subscription fetch error:", err))
  }, [])

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
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt={profile.school_name} className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 className="h-5 w-5 text-blue-700" />
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
                  <p className="font-semibold text-gray-900 text-sm truncate">{profile?.school_name || "School"}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {profile?.school_type || ""}{profile?.state ? ` • ${profile.state}` : ""}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-xs font-medium text-yellow-700 capitalize">
              {planType === "free" ? "Free Plan" : planType === "term" ? "Term Plan" : "Standard"}
            </span>
            {planType === "free" && (
              <Link href="/dashboard/school/subscription" className="text-xs text-blue-600 font-semibold hover:underline">Upgrade</Link>
            )}
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          {SCHOOL_NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-0.5 ${
                  active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
