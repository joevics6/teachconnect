// ============================================================
// lib/supabase/admin.ts
// Service-role Supabase client. Bypasses RLS entirely and can
// call the Auth Admin API (list/get/delete users by id).
//
// SERVER-SIDE ONLY. Never import this in a "use client" component
// or anywhere that could end up in browser JS — the service role
// key has full database access with no RLS restrictions at all.
// ============================================================

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
