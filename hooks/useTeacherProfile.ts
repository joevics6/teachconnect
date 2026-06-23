// ============================================================
// hooks/useTeacherProfile.ts
// Fetch authenticated teacher's full profile
// ============================================================
 
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
 
interface TeacherDashboardData {
  id: string
  full_name: string
  state: string
  subjects: string[]
  teaching_levels: string[]
  photo_url: string | null
  profile_completion: number
  is_visible: boolean
  trcn_status: string
}
 
export function useTeacherProfile() {
  const [profile, setProfile] = useState<TeacherDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
 
  useEffect(() => {
    const supabase = createClient()
 
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setIsLoading(false); return }
 
      const { data } = await supabase
        .from("teacher_profiles")
        .select(`
          id, full_name, state, subjects, teaching_levels,
          photo_url, profile_completion, is_visible, trcn_status
        `)
        .eq("user_id", session.user.id)
        .single()
 
      setProfile(data)
      setIsLoading(false)
    }
 
    fetchProfile()
  }, [])
 
  const toggleVisibility = async (is_visible: boolean) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
 
    await supabase
      .from("teacher_profiles")
      .update({ is_visible })
      .eq("user_id", session.user.id)
 
    setProfile((prev) => prev ? { ...prev, is_visible } : prev)
  }
 
  return { profile, isLoading, toggleVisibility }
}