// ============================================================
// lib/paystack.ts
//
// Shared logic for confirming a Paystack transaction and applying
// its effect (activating a subscription, or applying a job add-on).
// Used by BOTH the client-triggered /verify routes (fast UX path —
// runs the moment the browser returns from Paystack) and the
// /api/webhooks/paystack route (authoritative path — runs even if
// the browser never comes back). Both call the same functions here
// so the two paths can never apply a payment differently, and both
// are safe to run twice for the same reference (idempotent).
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPlanDurationDays, getPlanPriceNaira, getPlanFeaturedCredits } from "@/lib/pricing"
import { notifyUser } from "@/lib/notifications"

export interface PaystackTransaction {
  reference: string
  amount: number
  status: string
  metadata: Record<string, string>
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackTransaction | null> {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.status || data.data?.status !== "success") {
    // Log the actual reason — a wrong/missing secret key, a test/live key
    // mismatch, an unrecognized reference, or a genuinely pending/failed
    // transaction all land here, and previously all looked identical
    // (silent null) with zero way to tell them apart from the logs.
    console.error("Paystack verify failed:", {
      reference,
      http_status: res.status,
      paystack_status: data?.status,
      paystack_message: data?.message,
      transaction_status: data?.data?.status,
    })
    return null
  }
  return {
    reference: data.data.reference,
    amount: data.data.amount,
    status: data.data.status,
    metadata: data.data.metadata || {},
  }
}

function planLabel(planId: string) {
  return ({ standard: "Single Post", monthly: "Monthly", term: "Term Plan" } as Record<string, string>)[planId] || planId
}

export async function activateSubscriptionFromPayment(
  // Kept for backward compatibility with both call sites (webhook has no
  // session at all; /verify has one, but this is payment-critical and
  // needs to work identically either way) — see adminDb below.
  supabase: SupabaseClient,
  txn: PaystackTransaction
): Promise<{ ok: boolean; already_processed?: boolean; error?: string; subscription?: unknown }> {
  const { school_id, plan_id } = txn.metadata
  if (!school_id || !plan_id) return { ok: false, error: "Missing school_id/plan_id in transaction metadata" }

  const adminDb = createAdminClient()

  // Idempotency — safe to call this twice for the same reference (webhook + client verify race)
  const { data: existing } = await adminDb
    .from("subscriptions").select("id").eq("paystack_reference", txn.reference).single()
  if (existing) return { ok: true, already_processed: true }

  const durationDays = getPlanDurationDays(plan_id)
  const priceNaira = getPlanPriceNaira(plan_id)
  if (!durationDays || !priceNaira) return { ok: false, error: `Unknown plan_id "${plan_id}"` }

  // A school can hold multiple concurrently-valid plans at once — a
  // Single Post credit alongside a Monthly subscription, or (mid-
  // upgrade) both Monthly and Term until Monthly naturally expires.
  // Nothing here deactivates a DIFFERENT plan type just because a new
  // one was bought: each plan simply runs its own paid-for duration,
  // so upgrading (or adding a Single Post on top) never costs the
  // school time or benefits they already paid for.
  //
  // Renewing the SAME plan type while a currently-valid one already
  // exists is different — that extends the existing row's expiry
  // (and tops up its featured-listing credits) instead of creating a
  // second concurrent row of the same type, which would just be
  // confusing to show and reason about.
  const { data: currentRows } = await adminDb
    .from("subscriptions")
    .select("id, expires_at, featured_listings_included")
    .eq("school_id", school_id)
    .eq("plan_type", plan_id)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
    .order("expires_at", { ascending: false })
    .limit(1)
  const currentSamePlan = (currentRows ?? [])[0] ?? null

  let subscription: unknown
  let error: { message: string } | null = null

  if (currentSamePlan) {
    const newExpiry = new Date(currentSamePlan.expires_at)
    newExpiry.setDate(newExpiry.getDate() + durationDays)
    const result = await adminDb
      .from("subscriptions")
      .update({
        expires_at: newExpiry.toISOString(),
        featured_listings_included: (currentSamePlan.featured_listings_included || 0) + getPlanFeaturedCredits(plan_id),
        // Keep the reference of the renewal payment for this row's audit trail;
        // amount_paid intentionally reflects only the latest payment, not a running total.
        paystack_reference: txn.reference,
        amount_paid: priceNaira,
      })
      .eq("id", currentSamePlan.id)
      .select()
      .single()
    subscription = result.data
    error = result.error
  } else {
    const startsAt = new Date()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    // Insert-first — if this fails (e.g. a bad plan_type, a constraint
    // we forgot to update), the school keeps whatever plan(s) they
    // already have instead of losing anything. This exact bug happened
    // once already: a failed 'monthly' insert (missing from a check
    // constraint) still deactivated an existing paid plan first, then
    // failed to replace it.
    const result = await adminDb
      .from("subscriptions")
      .insert({
        school_id,
        plan_type: plan_id,
        paystack_reference: txn.reference,
        amount_paid: priceNaira,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        featured_listings_included: getPlanFeaturedCredits(plan_id),
        featured_listings_used: 0,
      })
      .select()
      .single()
    subscription = result.data
    error = result.error
  }

  if (error) return { ok: false, error: error.message }

  const { data: school } = await adminDb
    .from("school_profiles").select("user_id").eq("id", school_id).single()

  if (school) {
    // Transactional (payment receipt) — always sends regardless of
    // notification preferences, hence no prefKey.
    await notifyUser(adminDb, {
      userId: school.user_id,
      role: "school",
      type: "subscription_activated",
      title: "Subscription Activated",
      message: `Your ${planLabel(plan_id)} subscription is now active.`,
      metadata: { subscription_id: (subscription as { id: string }).id },
    })
  }

  return { ok: true, subscription }
}

export async function applyJobAddonFromPayment(
  // Kept for backward compatibility — see adminDb below, same reasoning
  // as activateSubscriptionFromPayment above.
  supabase: SupabaseClient,
  txn: PaystackTransaction
): Promise<{ ok: boolean; already_processed?: boolean; error?: string; addon_type?: string }> {
  const { job_id, school_id, addon_type } = txn.metadata
  if (!job_id || !school_id || !addon_type) {
    return { ok: false, error: "Missing job_id/school_id/addon_type in transaction metadata" }
  }

  const adminDb = createAdminClient()

  const { data: existingPurchase } = await adminDb
    .from("job_addon_purchases")
    .select("id, status")
    .eq("paystack_reference", txn.reference)
    .single()

  if (existingPurchase?.status === "completed") return { ok: true, already_processed: true }

  if (addon_type === "featured") {
    await adminDb.from("jobs").update({ is_featured: true }).eq("id", job_id).eq("school_id", school_id)
  } else if (addon_type === "extended") {
    const { data: job } = await adminDb
      .from("jobs").select("deadline").eq("id", job_id).eq("school_id", school_id).single()
    if (job?.deadline) {
      const newDeadline = new Date(job.deadline)
      newDeadline.setDate(newDeadline.getDate() + 15)
      await adminDb
        .from("jobs")
        .update({ deadline: newDeadline.toISOString().split("T")[0] })
        .eq("id", job_id)
        .eq("school_id", school_id)
    }
  } else {
    return { ok: false, error: `Unknown add-on type "${addon_type}"` }
  }

  await adminDb
    .from("job_addon_purchases")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("paystack_reference", txn.reference)

  return { ok: true, addon_type }
}

/** Which kind of payment this is, based on the metadata shape Paystack echoes back. */
export function classifyPayment(metadata: Record<string, string>): "subscription" | "job_addon" | "unknown" {
  if (metadata.plan_id && metadata.school_id) return "subscription"
  if (metadata.job_id && metadata.addon_type) return "job_addon"
  return "unknown"
}
