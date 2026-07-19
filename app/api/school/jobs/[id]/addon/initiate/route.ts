// ============================================================
// app/api/school/jobs/[id]/addon/initiate/route.ts
// POST — initiate Paystack payment for a job add-on
// (Featured Listing or Extended Posting)
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADDON_PRICES: Record<string, number> = {
  featured: 1_000_000, // in kobo (₦10,000)
  extended: 500_000,   // in kobo (₦5,000)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { addon_type } = await request.json()
    if (!ADDON_PRICES[addon_type]) {
      return NextResponse.json({ error: "Invalid add-on type" }, { status: 400 })
    }

    const { data: schoolRows } = await supabase
      .from("school_profiles")
      .select("id, contact_email, school_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const school = (schoolRows ?? [])[0] ?? null
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

    // Confirm the job belongs to this school before letting them pay for it
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, is_featured, status")
      .eq("id", jobId)
      .eq("school_id", school.id)
      .single()

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    if (addon_type === "featured" && job.is_featured) {
      return NextResponse.json({ error: "This job is already featured" }, { status: 400 })
    }

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
          amount: ADDON_PRICES[addon_type],
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/school/jobs?addon_job_id=${job.id}`,
          metadata: {
            job_id: job.id,
            school_id: school.id,
            addon_type,
            school_name: school.school_name,
          },
        }),
      }
    )

    const paystackData = await paystackResponse.json()
    if (!paystackData.status) {
      throw new Error(paystackData.message || "Paystack error")
    }

    // Record as pending — verify route flips this to completed
    await supabase.from("job_addon_purchases").insert({
      job_id: job.id,
      school_id: school.id,
      addon_type,
      amount_kobo: ADDON_PRICES[addon_type],
      paystack_reference: paystackData.data.reference,
      status: "pending",
    })

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    })
  } catch (err) {
    console.error("Initiate job addon payment error:", err)
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 })
  }
}
