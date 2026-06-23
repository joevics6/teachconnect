// ============================================================
// app/api/newsletter/route.ts
// POST /api/newsletter
// ============================================================
 
// Create at: app/api/newsletter/route.ts
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email } = await request.json()
 
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }
 
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email })
 
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already subscribed" })
      }
      throw error
    }
 
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("POST newsletter error:", err)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}