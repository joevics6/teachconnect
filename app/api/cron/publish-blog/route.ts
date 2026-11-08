// ============================================================
// app/api/cron/publish-blog/route.ts
// GET/POST — called once a day by cronjob.org.
//
// Publishes the OLDEST draft in blog_posts (by created_at) and stamps it
// with today's date. At most ONE post is published per calendar day
// (Nigeria time, WAT = UTC+1, no daylight saving).
//
// No secret key on purpose: the daily limit is enforced here, so extra
// or stray calls are harmless — after the first publish of the day every
// further call just answers "already published today".
//
// Two calls at the same instant both pick the same draft; the update only
// matches while that draft is still unpublished, so only one of them wins.
// ============================================================

import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const HOUR_MS = 60 * 60 * 1000
const DAILY_LIMIT = 1

/** Start of the current day in Nigeria (00:00 WAT), as a UTC timestamp. */
function startOfTodayWat(now: Date): Date {
  const wat = new Date(now.getTime() + HOUR_MS)
  wat.setUTCHours(0, 0, 0, 0)
  return new Date(wat.getTime() - HOUR_MS)
}

async function run() {
  const db = createAdminClient()
  const now = new Date()
  const dayStart = startOfTodayWat(now).toISOString()

  // Daily limit: anything already published since midnight (WAT) uses it up.
  const { count: publishedToday, error: countErr } = await db
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .gte("published_at", dayStart)
  if (countErr) throw countErr
  if ((publishedToday ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ published: false, reason: "Already published today" })
  }

  // Oldest draft first; id breaks ties so every caller picks the same one.
  const { data: next, error: pickErr } = await db
    .from("blog_posts")
    .select("id, slug, title")
    .eq("is_published", false)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (pickErr) throw pickErr
  if (!next) return NextResponse.json({ published: false, reason: "No drafts left to publish" })

  const stamp = now.toISOString()
  const { data: done, error: updErr } = await db
    .from("blog_posts")
    .update({ is_published: true, published_at: stamp, updated_at: stamp })
    .eq("id", next.id)
    .eq("is_published", false) // lose gracefully if another call just published it
    .select("id, slug, title")
    .maybeSingle()
  if (updErr) throw updErr
  if (!done) return NextResponse.json({ published: false, reason: "Already published today" })

  revalidateTag("blog", "max")
  return NextResponse.json({ published: true, post: done })
}

async function handle() {
  try {
    return await run()
  } catch (err) {
    console.error("Daily blog publish failed:", err)
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
