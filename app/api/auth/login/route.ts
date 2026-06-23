// ============================================================
// app/api/auth/login/route.ts
// POST — sign in with email + password, redirect by role
// ============================================================
 
// Create at: app/api/auth/login/route.ts
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email, password } = await request.json()
 
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }
 
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
 
    if (error) {
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("Email not confirmed")
      ) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        )
      }
      throw error
    }
 
    if (!data.user) {
      return NextResponse.json(
        { error: "Login failed" },
        { status: 401 }
      )
    }
 
    // Get user role to determine redirect
    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single()
 
    const role = userRecord?.role || data.user.user_metadata?.role || "teacher"
    const redirectTo =
      role === "school" ? "/dashboard/school" : "/dashboard/teacher"
 
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
      redirectTo,
    })
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    )
  }
}