// ============================================================
// app/api/school/account/route.ts
// DELETE — permanently remove the current school's profile, all
// data owned by it (jobs, applications received, invites sent,
// saved teachers, subscription, notifications), and the auth.users
// login itself.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: schoolRows } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const school = (schoolRows ?? [])[0] ?? null

    if (school) {
      const { data: jobRows } = await supabase
        .from("jobs")
        .select("id")
        .eq("school_id", school.id)
      const jobIds = (jobRows ?? []).map((j) => j.id)

      if (jobIds.length > 0) {
        await supabase.from("applications").delete().in("job_id", jobIds)
      }
      await supabase.from("school_invites").delete().eq("school_id", school.id)
      await supabase.from("school_saved_teachers").delete().eq("school_id", school.id)
      await supabase.from("subscriptions").delete().eq("school_id", school.id)
      await supabase.from("jobs").delete().eq("school_id", school.id)
      await supabase.from("school_profiles").delete().eq("id", school.id)
    }

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
    console.error("DELETE school account error:", err)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
