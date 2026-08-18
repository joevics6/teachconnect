// ============================================================
// lib/supabase/public.ts
// Plain (no-cookie) Supabase client for fully public, cacheable
// reads — job search, job/school public profiles. Safe to call
// from inside unstable_cache() because it never touches cookies()
// or any other per-request dynamic API (the regular server client
// in lib/supabase/server.ts does, via next/headers, which is what
// makes a route dynamic and un-cacheable in the first place).
//
// Uses the anon key, so it's bound by the same RLS policies a
// logged-out visitor would see — the explicit .eq("status","active")
// style filters in each query are a second, explicit guard on top
// of that, not a replacement for it.
//
// Do NOT use this for anything that needs to know who's logged in,
// or anything gated on ownership — it has no session at all.
// ============================================================

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  return createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
