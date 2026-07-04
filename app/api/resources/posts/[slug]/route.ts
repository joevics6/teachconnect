import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient()
    const { slug } = params

    const { data: resource, error } = await supabase
      .from("resource_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (error || !resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Fetch related resources — same category, exclude self
    const { data: related } = await supabase
      .from("resource_posts")
      .select("id, title, slug, category, resource_type")
      .eq("category", resource.category)
      .eq("is_published", true)
      .neq("id", resource.id)
      .limit(4)

    return NextResponse.json({ resource, related: related || [] })
  } catch (err) {
    console.error("GET resource detail error:", err)
    return NextResponse.json({ error: "Failed to fetch resource" }, { status: 500 })
  }
}
