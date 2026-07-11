// ============================================================
// app/api/teacher/account/route.ts
// DELETE — permanently remove the current teacher's profile and
// all data owned by it (applications, saved jobs, invites, quiz
// history, onboarding data, notifications).
//
// Note: this does not delete the underlying auth.users row — that
// requires the Supabase service-role key, which this project does
// not have configured server-side. If the person logs back in,
// they'll land on a fresh, empty profile with none of their old
// data, which matches "delete my account" from the user's
// perspective even though the login credential itself still exists.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: teacherRows } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const teacher = (teacherRows ?? [])[0] ?? null

    if (teacher) {
      // Delete owned rows explicitly (children first) rather than relying on
      // FK cascade, since not every relationship here is confirmed CASCADE.
      await supabase.from("saved_jobs").delete().eq("teacher_id", teacher.id)
      await supabase.from("school_invites").delete().eq("teacher_id", teacher.id)
      await supabase.from("quiz_attempts").delete().eq("teacher_id", teacher.id)
      await supabase.from("applications").delete().eq("teacher_id", teacher.id)
      await supabase.from("teacher_profiles").delete().eq("id", teacher.id)
    }

    await supabase.from("onboarding_data").delete().eq("user_id", user.id)
    await supabase.from("notifications").delete().eq("user_id", user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE teacher account error:", err)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
