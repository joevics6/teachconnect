// ============================================================
// app/api/school/jobs/[id]/addon/verify/route.ts
// POST — verify a job add-on payment with Paystack and apply it
// (mark the job featured, or push its deadline out by 15 days)
// (client-triggered fast path — see /api/webhooks/paystack for
// the authoritative path that runs even if the browser never
// returns here)
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPaystackTransaction, applyJobAddonFromPayment } from "@/lib/paystack"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { reference } = await request.json()
    if (!reference) return NextResponse.json({ error: "reference required" }, { status: 400 })

    console.log("Verify job addon payment: starting", { reference, jobId, user_id: user.id })

    // Verify with Paystack — never trust a client-submitted "success" flag
    const txn = await verifyPaystackTransaction(reference)
    if (!txn) {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 })
    }

    const { job_id, school_id } = txn.metadata

    if (job_id !== jobId) {
      console.error("Verify job addon: job_id mismatch", { reference, jobId, txn_job_id: job_id })
      return NextResponse.json({ error: "Reference does not match this job" }, { status: 400 })
    }

    // Caller must own the school this transaction's metadata says paid —
    // same protection as the subscription verify route.
    const { data: schoolRows } = await supabase
      .from("school_profiles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const school = (schoolRows ?? [])[0] ?? null
    if (!school || school.id !== school_id) {
      console.error("Verify job addon: reference does not belong to caller", {
        reference,
        caller_user_id: user.id,
        caller_school_id: school?.id,
        txn_school_id: school_id,
      })
      return NextResponse.json({ error: "This payment does not belong to your account" }, { status: 403 })
    }

    const result = await applyJobAddonFromPayment(supabase, txn)
    if (!result.ok) {
      console.error("Verify job addon: apply failed", { reference, error: result.error })
      return NextResponse.json({ error: result.error || "Failed to apply add-on" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, addon_type: result.addon_type, already_processed: result.already_processed })
  } catch (err) {
    console.error("Verify job addon payment error:", err)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
