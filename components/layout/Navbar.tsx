"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, GraduationCap, ChevronDown, LogOut, User, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

export default function Navbar() {
  const { user, isLoading, dashboardLink } = useAuth()
  const [isOpen,       setIsOpen]       = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    setUserMenuOpen(false)
    setIsOpen(false)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) console.error("Logout error:", error)
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      window.location.href = "/"
    }
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const Avatar = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
    const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10"
    const txt = size === "sm" ? "text-xs" : "text-sm"
    return user?.photo_url ? (
      <img
        src={user.photo_url}
        alt={user.display_name}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    ) : (
      <div className={`${dim} rounded-full bg-green-100 flex items-center justify-center flex-shrink-0`}>
        <span className={`text-green-700 font-bold ${txt}`}>{getInitials(user?.display_name || "U")}</span>
      </div>
    )
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white p-1.5 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-base text-gray-900">Teach<span className="text-green-600">Connect</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {!isLoading && user && (
              <Link href={dashboardLink} className="text-sm font-semibold text-green-700 hover:text-green-800">
                Dashboard
              </Link>
            )}
            {(!user || user.role === "teacher") && (
              <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900">Browse Jobs</Link>
            )}
            {(!user || user.role === "school") && (
              <Link href="/talent" className="text-sm text-gray-600 hover:text-gray-900">Find Teachers</Link>
            )}
            <Link href="/pricing"   className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/resources" className="text-sm text-gray-600 hover:text-gray-900">Resources</Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <div className="flex items-center">
                  <Link href={dashboardLink} className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-l-xl hover:bg-gray-50 transition">
                    <Avatar size="sm" />
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-semibold text-gray-900 max-w-32 truncate">{user.display_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-2 rounded-r-xl hover:bg-gray-50 transition"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
                        <Avatar size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{user.display_name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Link href={dashboardLink} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard className="h-4 w-4 text-gray-400" />Dashboard
                      </Link>
                      <Link
                        href={user.role === "school" ? "/dashboard/school/edit-profile" : "/dashboard/teacher/edit-profile"}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        {user.role === "school" ? "Edit Profile" : "Edit Profile"}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full border-t border-gray-100"
                      >
                        <LogOut className="h-4 w-4" />Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/register/teacher">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Find Jobs</Button>
                </Link>
                <Link href="/register/school">
                  <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">Hire Teachers</Button>
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
          <div className="md:hidden py-4 border-t flex flex-col gap-1">

            {/* Auth-dependent top section */}
            {isLoading ? (
              <div className="h-10 bg-gray-50 rounded-lg animate-pulse mb-2" />
            ) : user ? (
              <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3 px-1 py-2 mb-2">
                  <Avatar size="lg" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.display_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <Link
                  href={dashboardLink}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 bg-green-50 text-green-700 font-bold text-sm rounded-xl mb-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </div>
            ) : null}

            {/* Nav links */}
            <div className="flex flex-col gap-1">
              {(!user || user.role === "teacher") && (
                <Link href="/jobs" className="px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50" onClick={() => setIsOpen(false)}>
                  Browse Jobs
                </Link>
              )}
              {(!user || user.role === "school") && (
                <Link href="/talent" className="px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50" onClick={() => setIsOpen(false)}>
                  Find Teachers
                </Link>
              )}
              <Link href="/pricing"   className="px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50" onClick={() => setIsOpen(false)}>Pricing</Link>
              <Link href="/resources" className="px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50" onClick={() => setIsOpen(false)}>Resources</Link>
            </div>

            {/* Bottom auth actions */}
            {!isLoading && (
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-gray-100">
                {user ? (
                  <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 rounded-xl hover:bg-red-50 w-full">
                    <LogOut className="h-4 w-4" />Log Out
                  </button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">Log in</Button>
                    </Link>
                    <Link href="/register/teacher" onClick={() => setIsOpen(false)}>
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">Find Teaching Jobs</Button>
                    </Link>
                    <Link href="/register/school" onClick={() => setIsOpen(false)}>
                      <Button size="sm" className="w-full bg-blue-700 hover:bg-blue-800 text-white">Hire Teachers</Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
