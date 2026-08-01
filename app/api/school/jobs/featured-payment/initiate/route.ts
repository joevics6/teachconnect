// ============================================================
// app/api/school/jobs/featured-payment/initiate/route.ts
// POST — initiate a standalone ₦10,000 Paystack payment for a
// Featured Listing, used when posting a NEW job (which doesn't have
// an id yet) after a school has used up their plan's bundled
// allowance. See app/api/school/jobs/route.ts for how the reference
// this returns gets verified and consumed at job-creation time.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FEATURED_LISTING_PRICE_KOBO = 1_000_000 // ₦10,000

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: schoolRows } = await supabase
      .from("school_profiles")
      .select("id, contact_email, school_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const school = (schoolRows ?? [])[0] ?? null
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

    const { returnPath } = await request.json().catch(() => ({ returnPath: null }))

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
          amount: FEATURED_LISTING_PRICE_KOBO,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}${returnPath || "/dashboard/school/post-job"}`,
          metadata: {
            school_id: school.id,
            addon_type: "featured",
            standalone: true, // not yet tied to a job_id
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
    console.error("Initiate featured-listing payment error:", err)
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 })
  }
}
