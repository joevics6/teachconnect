"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface AuthUser {
  id: string
  email: string
  role: "teacher" | "school"
  display_name: string
  photo_url: string | null
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  dashboardLink: string
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  dashboardLink: "/dashboard/teacher",
  refresh: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// Fetches login state from a same-origin API route (server-side, cookie
// based) instead of calling supabase.auth.getSession()/getUser() directly
// from the browser. Two real problems with the direct-from-browser
// approach: (1) if the auth cookie is httpOnly, browser-side Supabase JS
// can't read it at all — getSession() and getUser() both silently come
// back empty regardless of how they're ordered or wrapped; (2) getUser()
// specifically requires a live cross-origin network call to *.supabase.co,
// which is exactly the kind of request that fails on mobile (flaky data,
// in-app browsers, DNS filtering). Dashboard pages never had this bug
// because they already fetch their own data through a same-origin API
// route rather than calling Supabase directly from the browser — this
// applies that same pattern to the navbar.
async function fetchAuthUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    return data.user ?? null
  } catch (err) {
    console.warn("fetchAuthUser() failed:", err)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const u = await fetchAuthUser()
    setUser(u)
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchAuthUser().then((u) => {
      if (!cancelled) {
        setUser(u)
        setIsLoading(false)
      }
    })

    // Still listen for in-tab auth changes (e.g. a session refresh or an
    // explicit sign-out triggered elsewhere on the page) so the navbar
    // updates immediately without needing a full reload. Login/logout
    // themselves already do a hard navigation (window.location.href),
    // which re-runs the fetch above from scratch on the fresh page load,
    // so this listener is a nice-to-have, not load-bearing.
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          setUser(null)
          setIsLoading(false)
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          fetchAuthUser().then((u) => {
            if (!cancelled) {
              setUser(u)
              setIsLoading(false)
            }
          })
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const dashboardLink = user?.role === "school" ? "/dashboard/school" : "/dashboard/teacher"

  return (
    <AuthContext.Provider value={{ user, isLoading, dashboardLink, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
