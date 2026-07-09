"use client"

import { LogOut } from "lucide-react"
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
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={
        className ??
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition w-full"
      }
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  )
}
