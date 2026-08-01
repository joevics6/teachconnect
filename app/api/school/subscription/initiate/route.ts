// ============================================================
// app/api/school/subscription/initiate/route.ts
// POST — initiate Paystack payment for a plan
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPlanAmountKobo } from "@/lib/pricing"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan_id } = await request.json()

    const amountKobo = getPlanAmountKobo(plan_id)
    if (!amountKobo) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      )
    }

    const { data: school } = await supabase
      .from("school_profiles")
      .select("id, contact_email, school_name")
      .eq("user_id", user.id)
      .single()

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      )
    }

    // Initiate Paystack transaction
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: school.contact_email,
          amount: amountKobo,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/school/subscription`,
          metadata: {
            school_id: school.id,
            plan_id,
            school_name: school.school_name,
          },
        }),
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Paystack error")
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    })
  } catch (err) {
    console.error("Initiate payment error:", err)
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    )
  }
}
