"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function DashboardIndexPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        return
      }
      // Determine role from metadata first (fast), then DB as fallback
      const role = user.user_metadata?.role
      if (role === "school") {
        router.replace("/dashboard/school")
      } else {
        // Default to teacher dashboard — also handles unknown roles
        router.replace("/dashboard/teacher")
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        <p className="text-sm text-gray-500">Redirecting to your dashboard…</p>
      </div>
    </div>
  )
}
