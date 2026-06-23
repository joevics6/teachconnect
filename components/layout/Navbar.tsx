"use client"

// ============================================================
// components/layout/Navbar.tsx — with auth state
// ============================================================

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, GraduationCap, ChevronDown, LogOut, User, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface AuthUser {
  id: string
  email: string
  role: "teacher" | "school"
  display_name: string
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: userRecord } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single()

        const role = userRecord?.role || session.user.user_metadata?.role || "teacher"

        // Get display name from appropriate profile
        let display_name = session.user.email || ""
        if (role === "teacher") {
          const { data: profile } = await supabase
            .from("teacher_profiles")
            .select("full_name")
            .eq("user_id", session.user.id)
            .single()
          display_name = profile?.full_name || display_name
        } else {
          const { data: profile } = await supabase
            .from("school_profiles")
            .select("school_name")
            .eq("user_id", session.user.id)
            .single()
          display_name = profile?.school_name || display_name
        }

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          role,
          display_name,
        })
      }
      setIsLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setUser(null)
        } else if (session?.user) {
          const { data: userRecord } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single()

          const role = userRecord?.role || session.user.user_metadata?.role || "teacher"
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role,
            display_name: session.user.user_metadata?.full_name || session.user.email || "",
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
    window.location.href = "/"
  }

  const dashboardLink = user?.role === "school"
    ? "/dashboard/school"
    : "/dashboard/teacher"

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white p-1.5 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm text-gray-900">JobMeter</span>
              <span className="font-bold text-sm text-green-600">TeachConnect</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900">Browse Jobs</Link>
            <Link href="/talent" className="text-sm text-gray-600 hover:text-gray-900">Find Teachers</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/resources" className="text-sm text-gray-600 hover:text-gray-900">Resources</Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              // Logged in state
              <div className="relative">
                <div className="flex items-center">
                  {/* Avatar + name — direct link to dashboard */}
                  <Link
                    href={dashboardLink}
                    className="flex items-center gap-2 pl-3 pr-1 py-2 rounded-l-xl hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold text-xs">
                        {getInitials(user.display_name)}
                      </span>
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-semibold text-gray-900 max-w-32 truncate">
                        {user.display_name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                  </Link>
                  {/* Chevron — toggles dropdown only */}
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-2 rounded-r-xl hover:bg-gray-50 transition"
                    aria-label="Open user menu"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      <div className="px-3 py-2.5 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-900 truncate">{user.display_name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={dashboardLink}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-gray-400" />
                        Dashboard
                      </Link>
                      <Link
                        href={user.role === "school" ? "/dashboard/school/settings" : "/dashboard/teacher/profile"}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        {user.role === "school" ? "School Settings" : "My Profile"}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full border-t border-gray-100"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Logged out state
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/register/teacher">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    Find Jobs
                  </Button>
                </Link>
                <Link href="/register/school">
                  <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">
                    Hire Teachers
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t flex flex-col gap-4">
            <Link href="/jobs" className="text-sm text-gray-600" onClick={() => setIsOpen(false)}>Browse Jobs</Link>
            <Link href="/talent" className="text-sm text-gray-600" onClick={() => setIsOpen(false)}>Find Teachers</Link>
            <Link href="/pricing" className="text-sm text-gray-600" onClick={() => setIsOpen(false)}>Pricing</Link>
            <Link href="/resources" className="text-sm text-gray-600" onClick={() => setIsOpen(false)}>Resources</Link>
            <div className="flex flex-col gap-2 pt-2 border-t">
              {user ? (
                <>
                  <Link href={dashboardLink} onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />Dashboard
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-red-500"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">Log in</Button>
                  </Link>
                  <Link href="/register/teacher" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">Find Jobs</Button>
                  </Link>
                  <Link href="/register/school" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="w-full bg-blue-700 hover:bg-blue-800 text-white">Hire Teachers</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}