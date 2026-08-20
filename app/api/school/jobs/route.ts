import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkJobPostingLimit } from "@/lib/job-limits"
import { getActivePlanType, isPremiumPlan, hasExternalApplyAccess, findSubscriptionWithFeaturedCredit } from "@/lib/school-plan"
import { getFeaturedAddonAmountKobo } from "@/lib/pricing"

// Helper — get or auto-create school profile row
async function getSchoolProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: rows } = await supabase
    .from("school_profiles")
    .select("id, school_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)

  if (rows?.[0]) return rows[0]

  const { data: { user } } = await supabase.auth.getUser()
  const meta = user?.user_metadata || {}

  const { data: created } = await supabase
    .from("school_profiles")
    .insert({
        user_id:           userId,
        school_name:       (meta.school_name as string) || (meta.full_name as string) || "My School",
        school_type:       (meta.school_type as string) || "private",
        school_levels:     [],
        state:             (meta.state as string) || "",
        lga:               (meta.lga as string) || "",
        address:           "",
        website:           null,
        contact_name:      (meta.full_name as string) || "",
        contact_role:      "",
        contact_email:     user?.email || "",
        contact_phone:     "",
        contact_phone_alt: null,
        cac_number:        "",
        logo_url:          null,
        is_verified:       false,
      })
    .select("id, school_name")

  return created?.[0] ?? null
}

// ── GET: list school's own jobs ─────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const school = await getSchoolProfile(supabase, user.id)
    if (!school) return NextResponse.json({ error: "School profile not found" }, { status: 404 })

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(`
        id, title, subject, teaching_levels, employment_type,
        salary_min, salary_max, accommodation_offered,
        quiz_enabled, deadline, status, is_featured, created_at,
        applications(count)
      `)
      .eq("school_id", school.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Shape jobs to include applicant counts
    const shaped = (jobs ?? []).map((j) => ({
      ...j,
      applicants_count:   (j.applications as unknown as { count: number }[])?.[0]?.count ?? 0,
      passed_quiz_count:  0,
    }))

    return NextResponse.json({ jobs: shaped })
  } catch (err) {
    console.error("GET /api/school/jobs error:", err)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

// ── POST: create a new job ──────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const school = await getSchoolProfile(supabase, user.id)
    if (!school) {
      return NextResponse.json(
        { error: "School profile not found. Please complete your profile first." },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Enforce plan limits — see lib/job-limits.ts for the rules.
    const limitCheck = await checkJobPostingLimit(supabase, school.id)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error, upgrade_required: true }, { status: 402 })
    }

    // Enforce premium-only fields (see pricing page comparison table) —
    // Free plan can't turn on private postings or featured placement.
    // Quiz screening is available to every plan, including Free.
    const planType = await getActivePlanType(supabase, school.id)
    if (!isPremiumPlan(planType)) {
      if (body.is_private) {
        return NextResponse.json(
          { error: "Private postings require a paid plan (Single Post, Monthly, or Term).", upgrade_required: true },
          { status: 402 }
        )
      }
    }
    if (body.external_apply_enabled && !hasExternalApplyAccess(planType)) {
      return NextResponse.json(
        { error: "External Application requires a Monthly or Term plan.", upgrade_required: true },
        { status: 402 }
      )
    }

    // Featured Listing: available on EVERY plan, including Free — Free
    // schools just always pay (no bundled allowance, and priced higher:
    // see getFeaturedAddonPrice in lib/pricing.ts). Term comes with 3
    // bundled credits, Monthly with 1; Single Post and Free have none.
    // Once bundled credits are used up (or there are none), it requires a
    // real Paystack payment, verified here before the job is allowed to
    // go out featured. usesBundledSlot tracks which path applied so the
    // slot only gets consumed after the job insert actually succeeds below.
    let usesBundledSlot = false
    let verifiedFeaturedReference: string | null = null
    const isPaidPlan = isPremiumPlan(planType)
    const featuredAmountKobo = getFeaturedAddonAmountKobo(isPaidPlan)

    if (body.is_featured) {
      const sub = await findSubscriptionWithFeaturedCredit(supabase, school.id)
      const remaining = sub ? sub.featured_listings_included - sub.featured_listings_used : 0

      if (remaining > 0) {
        usesBundledSlot = true
      } else {
        const reference: string | undefined = body.featured_payment_reference
        if (!reference) {
          return NextResponse.json(
            {
              error: `You've used all the featured listings included in your plan. Pay ₦${featuredAmountKobo / 100} to feature this listing.`,
              featured_payment_required: true,
            },
            { status: 402 }
          )
        }

        // A reference already spent on another job/purchase can't be
        // reused — the UNIQUE constraint on job_addon_purchases.paystack_reference
        // is the actual backstop for this, checked at insert time below,
        // but verifying with Paystack here confirms it's real, paid, and
        // for the right amount before we even attempt to create the job.
        const verifyRes = await fetch(
          `https://api.paystack.co/transaction/verify/${reference}`,
          { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
        )
        const verifyData = await verifyRes.json()
        if (
          !verifyData.status ||
          verifyData.data?.status !== "success" ||
          verifyData.data?.amount !== featuredAmountKobo ||
          verifyData.data?.metadata?.school_id !== school.id
        ) {
          return NextResponse.json(
            { error: "Featured listing payment could not be verified.", featured_payment_required: true },
            { status: 402 }
          )
        }
        verifiedFeaturedReference = reference
      }
    }

    const required = ["title", "subject", "employment_type", "deadline", "description", "required_qualifications"]
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
    if (!body.teaching_levels?.length) {
      return NextResponse.json({ error: "At least one teaching level is required" }, { status: 400 })
    }
    if (body.quiz_enabled) {
      if (!body.quiz_subject_levels?.length) {
        return NextResponse.json({ error: "Select at least one quiz subject" }, { status: 400 })
      }
      if (body.quiz_subject_levels.length > 3) {
        return NextResponse.json({ error: "A quiz can test at most 3 subjects" }, { status: 400 })
      }
    }
    if (body.external_apply_enabled && !String(body.external_apply_value || "").trim()) {
      return NextResponse.json(
        { error: "Enter an email, phone number, or URL for external applications" },
        { status: 400 }
      )
    }

    const jobPayload = {
      school_id:                school.id,
      title:                    body.title,
      subject:                  body.subject,
      teaching_levels:          body.teaching_levels,
      employment_type:          body.employment_type,
      positions:                parseInt(body.positions) || 1,
      salary_min:               parseInt(body.salary_min) || 0,
      salary_max:               parseInt(body.salary_max) || 0,
      accommodation_offered:    body.accommodation_offered ?? false,
      accommodation_type:       body.accommodation_offered ? (body.accommodation_type || null) : null,
      benefits:                 body.benefits ?? [],
      is_private:               body.is_private ?? false,
      is_featured:              body.is_featured ?? false,
      external_apply_enabled:   body.external_apply_enabled ?? false,
      external_apply_value:     body.external_apply_enabled ? String(body.external_apply_value || "").trim() : null,
      quiz_enabled:             body.quiz_enabled ?? false,
      // quiz_subjects/quiz_difficulty are kept in sync (subject names /
      // first selected level) purely for backward compatibility with
      // anything still reading the old columns — quiz_subject_levels
      // (subject+level pairs, can span more than one grade level) is
      // what app/api/quiz/[jobid]/route.ts actually uses now.
      quiz_subjects:            body.quiz_enabled ? (body.quiz_subject_levels || []).map((sl: { subject: string }) => sl.subject) : [],
      quiz_difficulty:          body.quiz_enabled ? (body.quiz_subject_levels?.[0]?.level || null) : null,
      quiz_subject_levels:      body.quiz_enabled ? (body.quiz_subject_levels || []) : null,
      quiz_pass_mark:           body.quiz_enabled ? (parseInt(body.quiz_pass_mark) || 70) : null,
      quiz_mode:                body.quiz_enabled ? (body.quiz_mode || "speed") : null,
      quiz_duration:            body.quiz_enabled ? (parseInt(body.quiz_duration) || 20) : null,
      quiz_question_count:      body.quiz_enabled ? (parseInt(body.quiz_question_count) || 20) : null,
      custom_questions:         [],
      description:              body.description,
      required_qualifications:  body.required_qualifications,
      preferred_qualifications: body.preferred_qualifications || null,
      deadline:                 body.deadline,
      // Every new job now needs admin approval before it's publicly
      // visible — see /admin/jobs. The existing "status = 'active'"
      // read policies are the actual gate; nothing else needed to
      // change for a pending job to stay hidden until approved.
      status:                   "pending_approval",
    }

    const { data: newJob, error: insertError } = await supabase
      .from("jobs")
      .insert(jobPayload)
      .select("id, title")

    if (insertError) {
      console.error("Job insert error:", insertError)
      return NextResponse.json({ error: insertError.message || "Failed to create job" }, { status: 500 })
    }

    const job = (newJob ?? [])[0]

    // Consume the featured-listing slot only now that the job actually
    // exists — a failure earlier (validation, etc.) shouldn't burn a
    // bundled slot or leave a payment unaccounted for.
    if (usesBundledSlot) {
      const sub = await findSubscriptionWithFeaturedCredit(supabase, school.id)
      if (sub) {
        await supabase
          .from("subscriptions")
          .update({ featured_listings_used: sub.featured_listings_used + 1 })
          .eq("id", sub.id)
      }
    } else if (verifiedFeaturedReference && job?.id) {
      // Records the payment against the now-real job. The UNIQUE
      // constraint on paystack_reference is what actually prevents the
      // same payment being applied to two different jobs — if this
      // insert fails, un-feature the job rather than leave it featured
      // with no payment on record.
      const { error: purchaseError } = await supabase.from("job_addon_purchases").insert({
        job_id: job.id,
        school_id: school.id,
        addon_type: "featured",
        amount_kobo: featuredAmountKobo,
        paystack_reference: verifiedFeaturedReference,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      if (purchaseError) {
        console.error("Featured payment record error, un-featuring job:", purchaseError)
        await supabase.from("jobs").update({ is_featured: false }).eq("id", job.id)
      }
    }

    return NextResponse.json({ success: true, job: { id: job?.id, title: job?.title } })
  } catch (err) {
    console.error("POST /api/school/jobs error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to post job" }, { status: 500 })
  }
}
