// ============================================================
// lib/slug.ts
// Slug generation for school_profiles.slug, used at insert time by
// both real school registration (api/auth/register/school) and
// admin-created ghost schools (api/admin/schools). Existing rows
// were backfilled directly in Supabase with the same slugify logic
// (see the add_slug_and_seo_content_to_school_profiles migration) —
// this keeps new rows consistent with that backfill.
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js"

export function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
  return base || "school"
}

/**
 * Finds a slug for `schoolName` that isn't already taken, appending
 * -2, -3, etc. as needed. Takes an admin/service-role client since
 * this needs to read across all schools regardless of RLS.
 */
export async function generateUniqueSchoolSlug(
  supabase: SupabaseClient,
  schoolName: string
): Promise<string> {
  const base = slugify(schoolName)

  const { data } = await supabase
    .from("school_profiles")
    .select("slug")
    .like("slug", `${base}%`)

  const taken = new Set((data ?? []).map((r) => r.slug as string))
  if (!taken.has(base)) return base

  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}
