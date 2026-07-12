// ============================================================
// lib/admin.ts
// Shared admin auth check. There's no "admin" role in the schema,
// so access is restricted to email addresses listed in the
// ADMIN_EMAILS environment variable (comma-separated).
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.toLowerCase())
}

/** Returns the authenticated admin user, or null if not logged in / not an admin. */
export async function requireAdmin(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}
