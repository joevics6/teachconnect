import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false })
      .limit(1000)

    if (error) throw error
    return NextResponse.json({ subscribers: subscribers || [] })
  } catch (err) {
    console.error("GET admin newsletter error:", err)
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 })
  }
}
