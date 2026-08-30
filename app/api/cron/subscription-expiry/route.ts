// ============================================================
// app/api/cron/subscription-expiry/route.ts
// GET — triggered daily by Vercel Cron (see vercel.json).
//
// Finds subscriptions expiring within REMINDER_WINDOW_DAYS that
// haven't been reminded about yet, and notifies each school once
// (in-app + email, subject to their sub_expiry preference) via the
// shared notifyUser() pipeline.
//
// Single-plan renewal isn't cancellation: a school that renews the
// SAME plan type just extends this row's expires_at further out
// (see lib/paystack.ts), which naturally moves it back out of the
// reminder window — no separate "cancel the reminder" logic needed.
// ============================================================

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notifyUser } from "@/lib/notifications"
import { PLANS, type PlanType } from "@/lib/pricing"

const REMINDER_WINDOW_DAYS = 3

export async function GET(request: Request) {
  // Vercel Cron sends this header automatically on scheduled
  // invocations; anyone else calling this route needs the same
  // secret, so this can't be triggered by a stray public GET.
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminDb = createAdminClient()
  const now = new Date()
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const { data: expiring, error } = await adminDb
    .from("subscriptions")
    .select("id, school_id, plan_type, expires_at, school_profiles!inner(user_id, school_name)")
    .eq("is_active", true)
    .is("expiry_reminder_sent_at", null)
    .gte("expires_at", now.toISOString())
    .lte("expires_at", windowEnd.toISOString())

  if (error) {
    console.error("subscription-expiry cron query error:", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  let notified = 0
  for (const sub of expiring ?? []) {
    // Supabase's embedded-relation typing comes back as an array even
    // for a to-one join — narrow it defensively rather than assume shape.
    const schoolProfile = Array.isArray(sub.school_profiles) ? sub.school_profiles[0] : sub.school_profiles
    if (!schoolProfile?.user_id) continue

    const planName = PLANS[sub.plan_type as Exclude<PlanType, "free">]?.name ?? sub.plan_type
    const daysLeft = Math.ceil((new Date(sub.expires_at).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    await notifyUser(adminDb, {
      userId: schoolProfile.user_id,
      role: "school",
      type: "sub_expiry",
      title: `Your ${planName} plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      message: `Renew your ${planName} plan to keep your job postings active and avoid losing access to Talent search and other plan features.`,
      metadata: { subscription_id: sub.id, plan_type: sub.plan_type, expires_at: sub.expires_at },
      prefKey: "sub_expiry",
    })

    await adminDb
      .from("subscriptions")
      .update({ expiry_reminder_sent_at: now.toISOString() })
      .eq("id", sub.id)

    notified++
  }

  return NextResponse.json({ checked: expiring?.length ?? 0, notified })
}
