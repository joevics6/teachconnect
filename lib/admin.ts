// ============================================================
// lib/admin.ts
// Shared admin auth check. There's no "admin" role in the schema —
// access is granted by email, from two sources:
//   1. The admin_emails table in Supabase (the primary, editable
//      source — see /admin/users to manage it... for now, direct
//      DB access, since there's no UI for editing this list yet).
//   2. The ADMIN_EMAILS env var (comma-separated), kept as a
//      fallback so existing deploys/local dev don't lose access.
// A match on either grants access.
//
// admin_emails has RLS enabled with no policies at all (default deny
// for every role), so it's only reachable via the service-role
// client — never exposed to a normal user's session.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

function isEnvAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.toLowerCase())
}

/** Checks the admin_emails table in Supabase (service-role — RLS blocks every other client). */
async function isDbAdminEmail(email: string | undefined | null): Promise<boolean> {
  if (!email) return false
  try {
    const adminDb = createAdminClient()
    const { data } = await adminDb
      .from("admin_emails")
      .select("email")
      .eq("email", email.toLowerCase())
      .maybeSingle()
    return !!data
  } catch (err) {
    console.error("admin_emails lookup failed:", err)
    return false
  }
}

/** True if this email has admin access, via either the DB list or the env var. */
export async function isAdminEmail(email: string | undefined | null): Promise<boolean> {
  if (!email) return false
  if (isEnvAdminEmail(email)) return true
  return isDbAdminEmail(email)
}

/** Returns the authenticated admin user, or null if not logged in / not an admin. */
export async function requireAdmin(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdminEmail(user.email))) return null
  return user
}
