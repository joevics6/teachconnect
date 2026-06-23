// ============================================================
// app/api/auth/logout/route.ts
// POST — sign out current user
// ============================================================
 
// Create at: app/api/auth/logout/route.ts

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
 
    if (error) throw error
 
    return NextResponse.json({ success: true, redirectTo: "/" })
  } catch (err) {
    console.error("Logout error:", err)
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    )
  }
}