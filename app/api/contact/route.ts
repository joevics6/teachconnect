import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 })
    }

    const { error } = await supabase
      .from("contact_submissions")
      .insert({ name, email, subject, message })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("POST contact error:", err)
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 })
  }
}
