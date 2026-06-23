// ============================================================
// app/api/auth/forgot-password/route.ts
// POST — send password reset email via Supabase
// ============================================================
 
// Create at: app/api/auth/forgot-password/route.ts
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email } = await request.json()
 
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      )
    }
 
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
 
    if (error) throw error
 
    // Always return success even if email not found
    // (security best practice — don't reveal if email exists)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Forgot password error:", err)
    return NextResponse.json(
      { error: "Failed to send reset email. Please try again." },
      { status: 500 }
    )
  }
}