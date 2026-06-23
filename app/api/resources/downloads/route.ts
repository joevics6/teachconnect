// ============================================================
// app/api/resources/downloads/route.ts
// GET /api/resources/downloads
// ============================================================
 
// Create at: app/api/resources/downloads/route.ts
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function GET() {
  try {
    const supabase = await createClient()
 
    const { data: downloads, error } = await supabase
      .from("resource_downloads")
      .select("id, title, slug, description, category, download_count")
      .eq("is_active", true)
      .order("download_count", { ascending: false })
 
    if (error) throw error
 
    return NextResponse.json({ downloads: downloads || [] })
  } catch (err) {
    console.error("GET downloads error:", err)
    return NextResponse.json({ error: "Failed to fetch downloads" }, { status: 500 })
  }
}