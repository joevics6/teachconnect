import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Get the full column list with NOT NULL info from information_schema
  const { data: columns } = await supabase
    .from("information_schema.columns" as never)
    .select("column_name, data_type, is_nullable, column_default")
    .eq("table_name", "school_profiles")
    .eq("table_schema", "public")
    .order("ordinal_position")

  const { data: schoolProfiles } = await supabase
    .from("school_profiles")
    .select("*")
    .eq("user_id", user.id)

  return NextResponse.json({
    user_id: user.id,
    email:   user.email,
    role:    user.user_metadata?.role,
    school_profiles_count: schoolProfiles?.length ?? 0,
    school_profiles: schoolProfiles ?? [],
    not_null_columns: (columns ?? []).filter((c: {is_nullable: string}) => c.is_nullable === "NO"),
    all_columns: columns ?? [],
  })
}
