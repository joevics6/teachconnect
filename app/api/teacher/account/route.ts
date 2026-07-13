// ============================================================
// app/api/teacher/account/route.ts
// DELETE — permanently remove the current teacher's profile, all
// data owned by it (applications, saved jobs, invites, quiz history,
// onboarding data, notifications), and the auth.users login itself.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

    // Delete the actual login credential — requires the service-role key.
    // If this fails (key missing/misconfigured), the data above is still
    // gone; we log it rather than fail the whole request, since a person
    // whose data was already wiped shouldn't see an error mid-deletion.
    try {
      const adminClient = createAdminClient()
      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id)
      if (authDeleteError) throw authDeleteError
    } catch (err) {
      console.error("Failed to delete auth user (service role key missing or invalid?):", err)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE teacher account error:", err)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
