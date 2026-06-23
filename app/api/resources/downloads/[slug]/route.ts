// ============================================================
// app/api/resources/downloads/[slug]/route.ts
// GET — return signed URL for a download
// ============================================================
 
// Create at: app/api/resources/downloads/[slug]/route.ts
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient()
    const { slug } = params
 
    const { data: download, error } = await supabase
      .from("resource_downloads")
      .select("id, file_url, download_count")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
 
    if (error || !download) {
      return NextResponse.json({ error: "Download not found" }, { status: 404 })
    }
 
    // Increment download count
    await supabase
      .from("resource_downloads")
      .update({ download_count: download.download_count + 1 })
      .eq("id", download.id)
 
    // If file is in Supabase storage, create signed URL
    if (download.file_url.startsWith("resources/")) {
      const { data: signedUrl } = await supabase.storage
        .from("resources")
        .createSignedUrl(download.file_url, 60)
 
      return NextResponse.json({ url: signedUrl?.signedUrl })
    }
 
    // Otherwise return direct URL
    return NextResponse.json({ url: download.file_url })
  } catch (err) {
    console.error("GET download error:", err)
    return NextResponse.json({ error: "Failed to get download" }, { status: 500 })
  }
}