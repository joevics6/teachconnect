// ============================================================
// app/api/school/subscription/verify/route.ts
// POST — verify Paystack payment and activate subscription
// (client-triggered fast path — see /api/webhooks/paystack for
// the authoritative path that runs even if the browser never
// returns here)
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPaystackTransaction, activateSubscriptionFromPayment } from "@/lib/paystack"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error("Verify payment: no authenticated user (session/cookie issue?)")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reference } = await request.json()
    if (!reference) return NextResponse.json({ error: "reference required" }, { status: 400 })

    console.log("Verify payment: starting", { reference, user_id: user.id })

    const txn = await verifyPaystackTransaction(reference)
    if (!txn) {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 })
    }

    const { school_id } = txn.metadata

    // The transaction must belong to the school the caller is logged in as —
    // otherwise a reference obtained elsewhere (e.g. browser history) could be
    // replayed to activate/notify a different school's subscription.
    const { data: callerSchool } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!callerSchool || callerSchool.id !== school_id) {
      console.error("Verify payment: reference does not belong to caller", {
        reference,
        caller_user_id: user.id,
        caller_school_id: callerSchool?.id,
        txn_school_id: school_id,
      })
      return NextResponse.json({ error: "This payment does not belong to your account" }, { status: 403 })
    }

    const result = await activateSubscriptionFromPayment(supabase, txn)
    if (!result.ok) {
      console.error("Verify payment: activation failed", { reference, error: result.error })
      return NextResponse.json({ error: result.error || "Failed to activate subscription" }, { status: 500 })
    }
    if (result.already_processed) {
      return NextResponse.json({ ok: true, already_processed: true })
    }

    return NextResponse.json({ subscription: result.subscription })
  } catch (err) {
    console.error("Verify payment error:", err)
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    )
  }
}
