// ============================================================
// lib/tools/rate-limit.ts
// Per-visitor limit for the AI tools, so one person can't drain the Gemini
// keys. Counts rows in tool_usage (supabase/tool_usage.sql) for a salted
// hash of the IP. The limits are generous because many Nigerian mobile users
// share one carrier IP.
// ============================================================

import { createHash } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

const PER_HOUR = 10
const PER_DAY = 30

export function ipHashFor(req: Request): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  return createHash("sha256").update(`${process.env.TOOLS_IP_SALT ?? "classhire-tools"}:${ip}`).digest("hex")
}

export type UsageCheck = { ok: true } | { ok: false; message: string }

/** Checks the visitor's limits and, if they pass, records this use. Fails open if the log is unreachable. */
export async function checkAndRecordUsage(tool: string, ipHash: string): Promise<UsageCheck> {
  try {
    const db = createAdminClient()
    const since = (ms: number) => new Date(Date.now() - ms).toISOString()
    const [hour, day] = await Promise.all([
      db.from("tool_usage").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since(3600_000)),
      db.from("tool_usage").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since(86_400_000)),
    ])
    if ((hour.count ?? 0) >= PER_HOUR) {
      return { ok: false, message: "You've used the free generators a lot in the last hour. Please try again in a little while." }
    }
    if ((day.count ?? 0) >= PER_DAY) {
      return { ok: false, message: "You've reached today's free limit. Please come back tomorrow." }
    }
    await db.from("tool_usage").insert({ tool, ip_hash: ipHash })
    // Housekeeping: now and then drop rows nobody needs any more.
    if (Math.random() < 0.02) {
      await db.from("tool_usage").delete().lt("created_at", since(3 * 86_400_000))
    }
  } catch (err) {
    console.error("Tool rate limit check failed (allowing):", err)
  }
  return { ok: true }
}
