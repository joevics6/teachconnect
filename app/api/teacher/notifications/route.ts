// ============================================================
// app/api/teacher/notifications/route.ts
// GET  — fetch notifications for current user (teacher or school)
// PATCH — mark notifications as read
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, is_read, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount,
    })
  } catch (err) {
    console.error("GET notifications error:", err)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { ids, mark_all_read } = body

    if (mark_all_read) {
      // Mark all as read for this user
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) throw error
    } else if (ids && ids.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids)
        .eq("user_id", user.id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("PATCH notifications error:", err)
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    )
  }
}