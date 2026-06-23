// ============================================================
// app/api/school/subscription/verify/route.ts
// POST — verify Paystack payment and activate subscription
// ============================================================

// Create at: app/api/school/subscription/verify/route.ts

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PLAN_DURATIONS: Record<string, number> = {
  standard: 30,  // 30 days
  term: 91,      // ~13 weeks
}

const PLAN_AMOUNTS: Record<string, number> = {
  standard: 15000,
  term: 75000,
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { reference } = await request.json()

    // Verify with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()

    if (
      !paystackData.status ||
      paystackData.data.status !== "success"
    ) {
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      )
    }

    const { school_id, plan_id } = paystackData.data.metadata

    // Check reference not already used
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("paystack_reference", reference)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Payment already processed" },
        { status: 409 }
      )
    }

    // Deactivate any existing active subscriptions
    await supabase
      .from("subscriptions")
      .update({ is_active: false })
      .eq("school_id", school_id)
      .eq("is_active", true)

    // Calculate expiry
    const startsAt = new Date()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + PLAN_DURATIONS[plan_id])

    // Create new subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        school_id,
        plan_type: plan_id,
        paystack_reference: reference,
        amount_paid: PLAN_AMOUNTS[plan_id],
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    // Notify school
    const { data: school } = await supabase
      .from("school_profiles")
      .select("user_id")
      .eq("id", school_id)
      .single()

    if (school) {
      await supabase.from("notifications").insert({
        user_id: school.user_id,
        type: "subscription_activated",
        title: "Subscription Activated",
        message: `Your ${plan_id === "term" ? "Term Plan" : "Standard"} subscription is now active.`,
        metadata: { subscription_id: subscription.id },
      })
    }

    return NextResponse.json({ subscription })
  } catch (err) {
    console.error("Verify payment error:", err)
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    )
  }
}