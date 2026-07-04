import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient()

    await supabase.rpc("increment_resource_count", { resource_slug: params.slug })

    return NextResponse.json({ success: true })
  } catch {
    // Non-critical — don't fail the user action
    return NextResponse.json({ success: true })
  }
}
