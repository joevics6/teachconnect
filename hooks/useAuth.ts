// ============================================================
// hooks/useAuth.ts
// Shared auth hook — use in any component that needs user data
// ============================================================
 
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
 
interface AuthUser {
  id: string
  email: string
  role: "teacher" | "school"
}
 
export function useAuth(redirectIfUnauthenticated?: string) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
 
  useEffect(() => {
    const supabase = createClient()
 
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        if (redirectIfUnauthenticated) {
          router.push(redirectIfUnauthenticated)
        }
        setIsLoading(false)
        return
      }
 
      const { data: userRecord } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single()
 
      setUser({
        id: session.user.id,
        email: session.user.email || "",
        role: userRecord?.role || session.user.user_metadata?.role || "teacher",
      })
      setIsLoading(false)
    }
 
    getSession()
 
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setUser(null)
          if (redirectIfUnauthenticated) {
            router.push(redirectIfUnauthenticated)
          }
        }
      }
    )
 
    return () => subscription.unsubscribe()
  }, [redirectIfUnauthenticated, router])
 
  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }
 
  return { user, isLoading, logout }
}