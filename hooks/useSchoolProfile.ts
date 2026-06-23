// ============================================================
// hooks/useSchoolProfile.ts
// Fetch authenticated school's profile + subscription status
// ============================================================
 
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
 
interface SchoolDashboardData {
  id: string
  school_name: string
  school_type: string
  state: string
  logo_url: string | null
  is_verified: boolean
  plan_type: "free" | "standard" | "term"
  subscription_expires_at: string | null
}
 
export function useSchoolProfile() {
  const [profile, setProfile] = useState<SchoolDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
 
  useEffect(() => {
    const supabase = createClient()
 
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setIsLoading(false); return }
 
      // Get school profile
      const { data: school } = await supabase
        .from("school_profiles")
        .select("id, school_name, school_type, state, logo_url, is_verified")
        .eq("user_id", session.user.id)
        .single()
 
      if (!school) { setIsLoading(false); return }
 
      // Get active subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_type, expires_at")
        .eq("school_id", school.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
 
      setProfile({
        ...school,
        plan_type: subscription?.plan_type || "free",
        subscription_expires_at: subscription?.expires_at || null,
      })
      setIsLoading(false)
    }
 
    fetchProfile()
  }, [])
 
  return { profile, isLoading }
}