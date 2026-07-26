// ============================================================
// app/api/auth/me/route.ts
// GET — returns the logged-in user's display info, or { user: null }.
//
// The navbar was calling supabase.auth.getSession()/getUser() directly
// from the browser. Those reads depend on the browser-side Supabase JS
// client being able to see the auth cookie — which it can't if that
// cookie is httpOnly, and getUser() additionally requires a real
// cross-origin network call to *.supabase.co that's prone to failing on
// mobile. Dashboard pages never had this problem because they fetch
// their own data through a same-origin API route instead of calling
// Supabase directly from the browser. This route lets the navbar do
// the same thing: the cookie is read server-side (works regardless of
// httpOnly) and the result comes back over a plain same-origin fetch.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ user: null })
    }

    const role = (authUser.user_metadata?.role as string) || "teacher"
    let display_name = (authUser.user_metadata?.full_name as string) || authUser.email || ""
    let photo_url: string | null = null

    if (role === "teacher") {
      const { data } = await supabase
        .from("teacher_profiles")
        .select("full_name, photo_url")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
      if (data?.[0]?.full_name) display_name = data[0].full_name
      if (data?.[0]?.photo_url) photo_url = data[0].photo_url
    } else {
      const { data } = await supabase
        .from("school_profiles")
        .select("school_name, logo_url")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
      if (data?.[0]?.school_name) display_name = data[0].school_name
      if (data?.[0]?.logo_url) photo_url = data[0].logo_url
    }

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email || "",
        role,
        display_name,
        photo_url,
      },
    })
  } catch (err) {
    console.error("GET /api/auth/me error:", err)
    // Fail as "logged out" rather than erroring the navbar — a person
    // who really is logged in will still reach protected pages fine
    // via middleware, this only affects what the navbar displays.
    return NextResponse.json({ user: null })
  }
}
