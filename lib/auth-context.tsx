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

async function loadUserProfile(
  userId: string,
  email: string,
  metadata: Record<string, unknown>
): Promise<AuthUser> {
  const supabase = createClient()
  const role = (metadata?.role as string) || "teacher"
  let display_name = (metadata?.full_name as string) || email
  let photo_url: string | null = null

  try {
    if (role === "teacher") {
      const { data } = await supabase
        .from("teacher_profiles")
        .select("full_name, photo_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
      if (data?.[0]?.full_name) display_name = data[0].full_name
      if (data?.[0]?.photo_url) photo_url = data[0].photo_url
    } else {
      const { data } = await supabase
        .from("school_profiles")
        .select("school_name, logo_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
      if (data?.[0]?.school_name) display_name = data[0].school_name
      if (data?.[0]?.logo_url) photo_url = data[0].logo_url
    }
  } catch { /* fall back to metadata values */ }

  return { id: userId, email, role: role as "teacher" | "school", display_name, photo_url }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const u = await loadUserProfile(
          session.user.id,
          session.user.email || "",
          session.user.user_metadata || {}
        )
        setUser(u)
        return
      }
    } catch (err) {
      console.warn("refresh(): getSession() failed:", err)
    }
    setUser(null)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // getSession() is the primary source here: it's a local, cookie-based
    // read with no network call, so it can't fail due to a flaky mobile
    // connection, DNS filtering, or an in-app browser blocking a
    // cross-origin request to *.supabase.co. It's fine for *display*
    // purposes (deciding what the navbar shows) — every actually
    // security-sensitive check (dashboard access, API writes) already
    // goes through middleware/API routes, which call getUser() server-side
    // and can't be spoofed by a tampered local session.
    //
    // A previous version of this called getUser() first for extra
    // verification, but that call is a real network request to a
    // different origin than the app itself, and supabase-js doesn't
    // always wrap a raw network failure as a clean `{ error }` — it can
    // throw. Since that call wasn't wrapped in try/catch, a failure there
    // (much more common on mobile) killed checkAuth() mid-execution:
    // isLoading never got set to false and the navbar was stuck showing
    // "logged out" forever, even though the person genuinely was logged
    // in (dashboard pages worked fine because they fetch their own
    // profile via a same-origin API route, not this hook). Everything
    // below is now wrapped in try/catch so nothing here can throw
    // unhandled and freeze the UI.
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const u = await loadUserProfile(
            session.user.id,
            session.user.email || "",
            session.user.user_metadata || {}
          )
          setUser(u)
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.warn("auth.getSession() failed, falling back to getUser():", err)
      }

      // No local session found (or the read above failed) — try the
      // network-verified getUser() as a fallback rather than immediately
      // concluding "logged out", in case getSession() itself hiccuped.
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const u = await loadUserProfile(
            authUser.id,
            authUser.email || "",
            authUser.user_metadata || {}
          )
          setUser(u)
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.warn("auth.getUser() fallback also failed:", err)
      }

      setUser(null)
      setIsLoading(false)
    }
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setUser(null)
          setIsLoading(false)
        } else if (session?.user) {
          const u = await loadUserProfile(
            session.user.id,
            session.user.email || "",
            session.user.user_metadata || {}
          )
          setUser(u)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const dashboardLink = user?.role === "school" ? "/dashboard/school" : "/dashboard/teacher"

  return (
    <AuthContext.Provider value={{ user, isLoading, dashboardLink, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
