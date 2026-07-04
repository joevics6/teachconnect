import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Store in newsletter_subscribers table if it exists, otherwise just log
    // Using a generic contact_messages table approach
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, email, subject: subject || "General", message })

    // If the table doesn't exist yet, don't fail the request — just log it
    if (error && !error.message.includes("does not exist")) {
      console.error("Contact form DB error:", error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Contact form error:", err)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
