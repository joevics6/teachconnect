// ============================================================
// app/api/cron/process-blog-queue/route.ts
// GET/POST — called hourly by cronjob.org.
//
// Takes the OLDEST 'not_processed' item in blog_queue, runs the same parser
// as the admin "Auto-fill with AI" button (extractContent), and saves the
// result to blog_posts as a DRAFT (the daily publisher releases it later).
//
// No secret key, so the limits live here: at most ONE item per call, and at
// most one attempt every 50 minutes across the whole queue, so stray or
// repeated calls cannot burn AI quota. An item that fails 3 times is left
// alone (its error shows in the admin list) so it can't block the queue.
// ============================================================

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { extractContent } from "@/lib/content-writer"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const MIN_GAP_MS = 50 * 60 * 1000
const MAX_ATTEMPTS = 3

async function run() {
  const db = createAdminClient()
  const now = Date.now()
  const cutoff = new Date(now - MIN_GAP_MS).toISOString()

  // Rate limit: any attempt in the last 50 minutes means "come back later".
  const { data: recent, error: recentErr } = await db
    .from("blog_queue")
    .select("id")
    .gte("last_attempt_at", cutoff)
    .limit(1)
  if (recentErr) throw recentErr
  if (recent && recent.length > 0) return NextResponse.json({ processed: false, reason: "Too soon since the last attempt" })

  const { data: next, error: pickErr } = await db
    .from("blog_queue")
    .select("id, content, attempts")
    .eq("status", "not_processed")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (pickErr) throw pickErr
  if (!next) return NextResponse.json({ processed: false, reason: "Nothing waiting in the queue" })

  // Claim it: only one of several simultaneous calls gets the row.
  const { data: claimed, error: claimErr } = await db
    .from("blog_queue")
    .update({ last_attempt_at: new Date(now).toISOString(), attempts: next.attempts + 1 })
    .eq("id", next.id)
    .eq("status", "not_processed")
    .eq("attempts", next.attempts)
    .select("id")
    .maybeSingle()
  if (claimErr) throw claimErr
  if (!claimed) return NextResponse.json({ processed: false, reason: "Already being processed" })

  try {
    const out = await extractContent("blog", "", next.content)
    const title = out.title?.trim()
    const body = out.cleaned_content?.trim()
    if (!title || !body || !out.excerpt?.trim()) throw new Error("The parser returned no title, excerpt or content")

    // Same slug as an existing post? Add -2, -3… instead of failing.
    const baseSlug = (out.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "post"
    let post: { id: string; slug: string } | null = null
    for (let i = 1; i <= 20 && !post; i++) {
      const slug = i === 1 ? baseSlug : `${baseSlug}-${i}`
      const { data, error } = await db
        .from("blog_posts")
        .insert({
          title,
          slug,
          excerpt: out.excerpt.trim(),
          body,
          tags: out.tags ?? [],
          read_time_minutes: out.reading_time_minutes ?? null,
          seo_title: out.seo_title || null,
          seo_description: out.seo_description || null,
          is_published: false,
        })
        .select("id, slug")
        .single()
      if (error) {
        if (error.code === "23505") continue
        throw error
      }
      post = data
    }
    if (!post) throw new Error("Could not find a free slug")

    await db
      .from("blog_queue")
      .update({ status: "processed", blog_post_id: post.id, processed_at: new Date().toISOString(), error: null })
      .eq("id", next.id)
    return NextResponse.json({ processed: true, draft: { id: post.id, slug: post.slug, title } })
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 500) : "Processing failed"
    console.error("Blog queue processing failed:", err)
    await db.from("blog_queue").update({ error: message }).eq("id", next.id)
    return NextResponse.json({ processed: false, error: message }, { status: 500 })
  }
}

async function handle() {
  try {
    return await run()
  } catch (err) {
    console.error("Blog queue cron failed:", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
