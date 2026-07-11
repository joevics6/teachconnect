"use client"

import { useState } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Shared logout control for every dashboard sidebar. Always signs out via
// the Supabase client SDK, then does a *hard* redirect to the homepage
// (window.location.href, not router.push) so every bit of client state
// and cached data is thrown away — this is what makes logout reliable
// across teacher and school dashboards.
export function LogoutButton({
  className,
  label = "Log Out",
}: {
  className?: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) console.error("Logout error:", error)
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      // Always redirect, even if signOut() failed — a hard navigation to a
      // protected-by-default app forces middleware to re-check auth, and a
      // stuck client-side session is worse than a stale one that gets
      // re-validated on the next request.
      window.location.href = "/"
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        className ??
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition w-full disabled:opacity-60"
      }
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {loading ? "Logging out…" : label}
    </button>
  )
}
