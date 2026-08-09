// ============================================================
// app/api/teacher/cv-signed-url/route.ts
// POST — get a fresh, short-lived signed URL for a teacher's CV.
// body: { teacher_id: string }  (teacher_profiles.id)
//
// Authorized if the caller is:
//   (a) that teacher themselves, or
//   (b) a school on any paid plan (Single Post, Monthly, or Term) —
//       matches the existing contact-detail gate on the public
//       profile page, which isn't scoped to actual applicants only.
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSignedCvUrl, resolveCvStoragePath } from "@/lib/cv-storage"
import { getActivePlanType, isPremiumPlan } from "@/lib/school-plan"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { teacher_id } = await request.json()
    if (!teacher_id) return NextResponse.json({ error: "teacher_id required" }, { status: 400 })

    const { data: targetTeacher } = await supabase
      .from("teacher_profiles")
      .select("id, user_id, cv_url")
      .eq("id", teacher_id)
      .single()

    if (!targetTeacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })

    // (a) Own CV — always allowed.
    let authorized = targetTeacher.user_id === user.id

    if (!authorized) {
      const { data: school } = await supabase
        .from("school_profiles")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (school) {
        const planType = await getActivePlanType(supabase, school.id)
        // Any school on a paid plan can view any teacher's CV — this
        // matches the existing contact-detail paywall on the public
        // profile page (app/api/teacher/profile/[id]/route.ts), which
        // isn't scoped to "actual applicants only". If that's ever
        // tightened, add an `applications` check here for (teacher_id,
        // school.id) before setting authorized = true.
        authorized = isPremiumPlan(planType)
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Not authorized to view this CV" }, { status: 403 })
    }

    const storagePath = resolveCvStoragePath(targetTeacher.cv_url, targetTeacher.user_id)
    const signedUrl = await getSignedCvUrl(supabase, storagePath)
    if (!signedUrl) {
      return NextResponse.json({ error: "This teacher hasn't uploaded a CV" }, { status: 404 })
    }

    return NextResponse.json({ url: signedUrl })
  } catch (err) {
    console.error("cv-signed-url error:", err)
    return NextResponse.json({ error: "Failed to generate CV link" }, { status: 500 })
  }
}
