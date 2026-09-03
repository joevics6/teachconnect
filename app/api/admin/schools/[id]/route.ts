import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin"

const EDITABLE_FIELDS = [
  "school_name", "school_type", "school_levels", "state", "lga",
  "address", "website", "logo_url", "about", "claim_note",
]

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const adminDb = createAdminClient()
    const { data: school, error } = await adminDb
      .from("school_profiles")
      .select("id, school_name, school_type, state, lga, address, website, logo_url, about, is_claimed, created_by_admin, claim_note")
      .eq("id", id)
      .single()

    if (error || !school || !school.created_by_admin) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    return NextResponse.json({ school })
  } catch (err) {
    console.error("GET admin school error:", err)
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const updates: Record<string, unknown> = {}
    for (const field of EDITABLE_FIELDS) {
      if (field in body) updates[field] = body[field]
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from("school_profiles")
      .update(updates)
      .eq("id", id)
      .eq("created_by_admin", true) // never lets this accidentally edit a real school's row

    if (error) {
      console.error("Ghost school update error:", error)
      return NextResponse.json({ error: "Something went wrong saving changes." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("PATCH admin school error:", err)
    return NextResponse.json({ error: "Something went wrong saving changes." }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const admin = await requireAdmin(supabase)
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const adminDb = createAdminClient()

    // Jobs cascade with the school in the DB, but surfacing an explicit
    // count first avoids silently deleting live listings by accident —
    // require confirm=true once the caller has seen the count.
    const { searchParams } = new URL(_request.url)
    if (searchParams.get("confirm") !== "true") {
      const { count } = await adminDb
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("school_id", id)
      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { error: `This school has ${count} job(s) posted. Deleting it will delete those jobs too.`, jobs_count: count, requires_confirm: true },
          { status: 409 }
        )
      }
    }

    const { error } = await adminDb
      .from("school_profiles")
      .delete()
      .eq("id", id)
      .eq("created_by_admin", true)

    if (error) {
      console.error("Ghost school delete error:", error)
      return NextResponse.json({ error: "Something went wrong deleting this school." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE admin school error:", err)
    return NextResponse.json({ error: "Something went wrong deleting this school." }, { status: 500 })
  }
}
