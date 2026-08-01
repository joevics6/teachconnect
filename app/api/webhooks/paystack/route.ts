// ============================================================
// app/api/webhooks/paystack/route.ts
// POST — Paystack webhook. This is the AUTHORITATIVE payment
// confirmation path: it fires from Paystack's servers directly,
// so a subscription/add-on gets applied even if the school closes
// the tab before the client-side /verify call ever runs.
//
// The client-triggered /verify routes (subscription/verify,
// jobs/[id]/addon/verify) are a fast-UX-feedback path only — both
// paths call the same functions in lib/paystack.ts, and both are
// idempotent (checked by paystack_reference), so it's safe for
// this webhook and a /verify call to race each other.
//
// Configure this URL in the Paystack dashboard under
// Settings → API Keys & Webhooks → Webhook URL:
//   https://<your-domain>/api/webhooks/paystack
// ============================================================

import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import {
  activateSubscriptionFromPayment,
  applyJobAddonFromPayment,
  classifyPayment,
  type PaystackTransaction,
} from "@/lib/paystack"

export async function POST(request: Request) {
  const rawBody = await request.text()

  // Paystack signs the raw request body with your secret key (HMAC SHA512)
  // and sends it in this header — this is how we know the request really
  // came from Paystack and not someone hitting this URL directly.
  const signature = request.headers.get("x-paystack-signature")
  const expectedSignature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
    .update(rawBody)
    .digest("hex")

  if (!signature || signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { event: string; data: { reference: string; amount: number; status: string; metadata: Record<string, string> } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  // Always 200 back to Paystack quickly once verified — it retries on
  // non-2xx, and we don't want retries piling up over an event type we
  // simply don't act on.
  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true, ignored: event.event })
  }

  const txn: PaystackTransaction = {
    reference: event.data.reference,
    amount: event.data.amount,
    status: event.data.status,
    metadata: event.data.metadata || {},
  }

  if (txn.status !== "success") {
    return NextResponse.json({ ok: true, ignored: "not successful" })
  }

  try {
    // Webhook is server-authenticated via signature, not a user session —
    // no "does this belong to the caller" check needed here, unlike the
    // client /verify routes (Paystack itself is asserting this event).
    const supabase = await createClient()
    const kind = classifyPayment(txn.metadata)

    if (kind === "subscription") {
      const result = await activateSubscriptionFromPayment(supabase, txn)
      if (!result.ok) {
        console.error("Webhook: failed to activate subscription", result.error)
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    } else if (kind === "job_addon") {
      const result = await applyJobAddonFromPayment(supabase, txn)
      if (!result.ok) {
        console.error("Webhook: failed to apply job add-on", result.error)
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    } else {
      console.error("Webhook: unrecognized metadata shape", txn.metadata)
      return NextResponse.json({ ok: true, ignored: "unrecognized metadata" })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Paystack webhook error:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
