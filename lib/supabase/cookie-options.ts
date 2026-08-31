// ============================================================
// lib/supabase/cookie-options.ts
// Explicit auth cookie settings shared by every Supabase client
// factory (browser, server, middleware) so the session persists
// consistently until the user actually clicks logout.
//
// Previously none of the three factories passed cookieOptions, so
// persistence relied entirely on @supabase/ssr's internal default
// (currently 400 days maxAge — the max Chrome/Safari allow anyway).
// That's fine today, but it was implicit: a future @supabase/ssr
// upgrade could quietly ship a shorter default and nobody would
// notice until users started getting logged out. Setting it here,
// once, makes "stay signed in" a deliberate decision instead of a
// side effect of whatever the library happens to default to.
// ============================================================

export const AUTH_COOKIE_OPTIONS = {
  // 400 days is the actual ceiling browsers enforce (Chrome/Safari
  // both cap Set-Cookie maxAge here) — asking for more just gets
  // silently clamped, so this is the longest a cookie can persist.
  maxAge: 400 * 24 * 60 * 60,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
}
