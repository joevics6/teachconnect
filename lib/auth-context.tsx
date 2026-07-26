"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getCached, setCached, clearAllUserCache } from "@/lib/client-cache"

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

const CACHE_KEY = "auth:me"

// Fetches login state from a same-origin API route (server-side, cookie
// based) instead of calling supabase.auth.getSession()/getUser() directly
// from the browser. Two real problems with the direct-from-browser
// approach: (1) if the auth cookie is httpOnly, browser-side Supabase JS
// can't read it at all — getSession() and getUser() both silently come
// back empty; (2) getUser() specifically requires a live cross-origin
// network call to *.supabase.co, which is exactly the kind of request
// that fails on mobile. Dashboard pages never had this bug because they
// already fetch their own data through a same-origin API route rather
// than calling Supabase directly from the browser — this applies that
// same pattern to the navbar.
async function fetchAuthUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" })
  if (!res.ok) return null
  const data = await res.json()
  return data.user ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const u = await fetchAuthUser()
      setUser(u)
      if (u) setCached(CACHE_KEY, u)
    } catch (err) {
      console.warn("refresh() failed:", err)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    // Stale-while-revalidate: a cached user (from earlier this tab
    // session) paints instantly — no loading flash on every navigation —
    // while a fresh fetch confirms/updates in the background. This is
    // what was making the navbar feel slow: every full page load was
    // waiting on a network round trip before showing anything.
    const cachedUser = getCached<AuthUser>(CACHE_KEY)
    if (cachedUser) {
      setUser(cachedUser)
      setIsLoading(false)
    }

    fetchAuthUser()
      .then((u) => {
        if (cancelled) return
        setUser(u)
        setIsLoading(false)
        if (u) setCached(CACHE_KEY, u)
        else clearAllUserCache()
      })
      .catch((err) => {
        console.warn("fetchAuthUser() failed:", err)
        if (!cancelled && !cachedUser) setIsLoading(false)
      })

    // Still listen for in-tab auth changes (e.g. a session refresh or an
    // explicit sign-out triggered elsewhere on the page). Login/logout
    // themselves already do a hard navigation (window.location.href),
    // which re-runs the fetch above fresh on the new page load, so this
    // listener is a nice-to-have, not load-bearing.
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          setUser(null)
          setIsLoading(false)
          clearAllUserCache()
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          fetchAuthUser().then((u) => {
            if (cancelled) return
            setUser(u)
            setIsLoading(false)
            if (u) setCached(CACHE_KEY, u)
          }).catch((err) => console.warn("onAuthStateChange refetch failed:", err))
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
