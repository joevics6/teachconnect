// ============================================================
// app/api/teacher/profile/visibility/route.ts
// PATCH — toggle teacher profile visibility
// ============================================================

// Create at: app/api/teacher/profile/visibility/route.ts


import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { is_visible } = await request.json()

    const { data, error } = await supabase
      .from("teacher_profiles")
      .update({ is_visible })
      .eq("user_id", user.id)
      .select("id, is_visible")
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    console.error("PATCH visibility error:", err)
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 }
    )
  }
}