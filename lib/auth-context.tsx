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
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const u = await loadUserProfile(
        authUser.id,
        authUser.email || "",
        authUser.user_metadata || {}
      )
      setUser(u)
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Get initial user — getUser() verifies with the Supabase server rather
    // than trusting whatever session getSession() finds in local storage,
    // which was the actual cause of the navbar showing "logged out" for
    // people who were, in fact, logged in. getUser() makes a network call
    // though, so it can fail transiently (cold start, brief network blip);
    // if it errors, fall back to getSession() rather than concluding
    // "not logged in" from a request that never actually completed.
    const checkAuth = async () => {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
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
      if (error) {
        console.warn("auth.getUser() failed, falling back to cached session:", error.message)
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
      }
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
