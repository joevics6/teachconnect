"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2, Briefcase, Users, GraduationCap, CreditCard,
  Settings, LogOut, Menu, X, Lock, Bell, Trash2,
  CheckCircle2, AlertTriangle, Eye, EyeOff, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const NAV_ITEMS = [
  { href: "/dashboard/school",              label: "Overview",        icon: Building2     },
  { href: "/dashboard/school/jobs",         label: "My Jobs",         icon: Briefcase     },
  { href: "/dashboard/school/jobs/applicants", label: "Applicants",  icon: Users         },
  { href: "/talent",                        label: "Browse Teachers", icon: GraduationCap },
  { href: "/dashboard/school/subscription", label: "Subscription",   icon: CreditCard    },
  { href: "/dashboard/school/settings",     label: "Settings",        icon: Settings      },
]

function Section({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
      <div className="mb-5">
        <h2 className="font-bold text-gray-900 text-base">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export default function SchoolSettingsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword,     setNewPassword]     = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent,     setShowCurrent]     = useState(false)
  const [showNew,         setShowNew]         = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMsg,     setPasswordMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Notifications
  const [notifNewApplicant,  setNotifNewApplicant]  = useState(true)
  const [notifQuizPassed,    setNotifQuizPassed]    = useState(true)
  const [notifSubExpiry,     setNotifSubExpiry]     = useState(true)
  const [notifPlatformNews,  setNotifPlatformNews]  = useState(false)
  const [notifSaving,        setNotifSaving]        = useState(false)
  const [notifMsg,           setNotifMsg]           = useState<string | null>(null)

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteBox, setShowDeleteBox] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handlePasswordChange = async () => {
    setPasswordMsg(null)
    if (!newPassword || !currentPassword) {
      setPasswordMsg({ type: "error", text: "Please fill in all fields." })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters." })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords don't match." })
      return
    }
    setPasswordLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("Not authenticated")
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInErr) {
        setPasswordMsg({ type: "error", text: "Current password is incorrect." })
        return
      }
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updateErr) throw updateErr
      setPasswordMsg({ type: "success", text: "Password updated successfully." })
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch {
      setPasswordMsg({ type: "error", text: "Failed to update password. Please try again." })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setNotifSaving(true)
    setNotifMsg(null)
    try {
      localStorage.setItem("tc_school_notif_prefs", JSON.stringify({
        new_applicant:   notifNewApplicant,
        quiz_passed:     notifQuizPassed,
        sub_expiry:      notifSubExpiry,
        platform_news:   notifPlatformNews,
      }))
      setNotifMsg("Preferences saved.")
    } finally {
      setNotifSaving(false)
      setTimeout(() => setNotifMsg(null), 3000)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return
    setDeleteLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/?deleted=1")
    } catch {
      setDeleteLoading(false)
    }
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={mobile ? "flex flex-col h-full" : ""}>
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-green-600 text-white p-1.5 rounded-lg">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-gray-900">TeachConnect</span>
        </Link>
      </div>
      <div className="p-3 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/dashboard/school/settings"
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                active
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </div>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 fixed inset-y-0">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-sm">Menu</span>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}

      <main className="flex-1 lg:ml-56">
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 text-sm">Settings</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <Link href="/dashboard/school/edit-profile">
              <Button variant="outline" size="sm" className="text-xs">
                Edit School Profile
              </Button>
            </Link>
          </div>

          {/* ── Change Password ── */}
          <Section title="Change Password" description="Use a strong password of at least 8 characters.">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                />
              </div>
              {passwordMsg && (
                <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                  passwordMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                  {passwordMsg.type === "success"
                    ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
                  {passwordMsg.text}
                </div>
              )}
              <Button onClick={handlePasswordChange} disabled={passwordLoading}
                className="bg-green-600 hover:bg-green-700 text-white">
                {passwordLoading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</>
                  : <><Lock className="h-4 w-4 mr-2" />Update Password</>}
              </Button>
            </div>
          </Section>

          {/* ── Notification Preferences ── */}
          <Section title="Notification Preferences" description="Choose which alerts you receive.">
            <div className="space-y-4">
              {[
                {
                  label: "New applicants",
                  description: "When a teacher applies to one of your job postings",
                  value: notifNewApplicant, setter: setNotifNewApplicant,
                },
                {
                  label: "Quiz passed",
                  description: "When an applicant passes your quiz screening",
                  value: notifQuizPassed, setter: setNotifQuizPassed,
                },
                {
                  label: "Subscription expiry reminders",
                  description: "Alerts before your plan expires",
                  value: notifSubExpiry, setter: setNotifSubExpiry,
                },
                {
                  label: "Platform news & updates",
                  description: "New features, tips for better hiring outcomes",
                  value: notifPlatformNews, setter: setNotifPlatformNews,
                },
              ].map((pref) => (
                <div key={pref.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pref.description}</p>
                  </div>
                  <button
                    onClick={() => pref.setter(!pref.value)}
                    className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
                      pref.value ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      pref.value ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveNotifications} disabled={notifSaving}
                  className="bg-green-600 hover:bg-green-700 text-white">
                  {notifSaving
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                    : <><Bell className="h-4 w-4 mr-2" />Save Preferences</>}
                </Button>
                {notifMsg && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />{notifMsg}
                  </span>
                )}
              </div>
            </div>
          </Section>

          {/* ── Danger Zone ── */}
          <Section title="Danger Zone">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Deleting your account permanently removes your school profile, all job postings,
                and applicant data. This cannot be undone.
              </p>
              {!showDeleteBox ? (
                <Button variant="outline" onClick={() => setShowDeleteBox(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete School Account
                </Button>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    This action is permanent and cannot be reversed.
                  </div>
                  <p className="text-xs text-red-600">Type <strong>DELETE</strong> below to confirm.</p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== "DELETE" || deleteLoading}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Account"}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowDeleteBox(false); setDeleteConfirm("") }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>
      </main>
    </div>
  )
}
