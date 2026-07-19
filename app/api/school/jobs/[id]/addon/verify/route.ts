// ============================================================
// app/api/school/jobs/[id]/addon/verify/route.ts
// POST — verify a job add-on payment with Paystack and apply it
// (mark the job featured, or push its deadline out by 15 days)
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Verify with Paystack — never trust a client-submitted "success" flag
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    )
    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 })
    }

    const { job_id, school_id, addon_type } = paystackData.data.metadata

    if (job_id !== jobId) {
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
      return NextResponse.json({ error: "This payment does not belong to your account" }, { status: 403 })
    }

    // Idempotency — a refreshed callback page shouldn't double-apply
    const { data: existingPurchase } = await supabase
      .from("job_addon_purchases")
      .select("id, status")
      .eq("paystack_reference", reference)
      .single()

    if (existingPurchase?.status === "completed") {
      return NextResponse.json({ ok: true, already_processed: true })
    }

    if (addon_type === "featured") {
      await supabase.from("jobs").update({ is_featured: true }).eq("id", job_id).eq("school_id", school_id)
    } else if (addon_type === "extended") {
      const { data: job } = await supabase
        .from("jobs")
        .select("deadline")
        .eq("id", job_id)
        .eq("school_id", school_id)
        .single()
      if (job?.deadline) {
        const newDeadline = new Date(job.deadline)
        newDeadline.setDate(newDeadline.getDate() + 15)
        await supabase
          .from("jobs")
          .update({ deadline: newDeadline.toISOString().split("T")[0] })
          .eq("id", job_id)
          .eq("school_id", school_id)
      }
    } else {
      return NextResponse.json({ error: "Unknown add-on type" }, { status: 400 })
    }

    await supabase
      .from("job_addon_purchases")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("paystack_reference", reference)

    return NextResponse.json({ ok: true, addon_type })
  } catch (err) {
    console.error("Verify job addon payment error:", err)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
