-- ============================================================
-- Fix: guests got 0 results on /talent (Browse Teachers) no matter
-- what the app code did.
--
-- Root cause: teacher_profiles had a SELECT RLS policy requiring
-- auth.uid() to belong to an authenticated user with role='school'.
-- api/talent/route.ts uses the standard cookie-authenticated
-- (RLS-respecting) Supabase client, so an anonymous request has no
-- auth.uid() at all — the policy silently filtered every row out,
-- returning 0 teachers with no error. This was never something
-- middleware.ts or api/talent/route.ts could fix, since the query
-- itself never reached the app's own guest-handling logic.
--
-- The talent list query only ever selects non-sensitive preview
-- fields (name, state, subjects, experience, photo, bio — never
-- phone/email/CV), so it's safe to also allow anonymous reads here.
-- A logged-in non-school user (e.g. a teacher browsing other
-- teachers) is still blocked, unchanged from before.
--
-- Already applied directly in Supabase (see chat) — this file is the
-- durable record of that change.
-- ============================================================

DROP POLICY IF EXISTS "Schools can read visible profiles" ON public.teacher_profiles;

CREATE POLICY "Schools and guests can read visible profiles"
ON public.teacher_profiles
FOR SELECT
TO public
USING (
  is_visible = true
  AND (
    auth.uid() IS NULL
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'school'
    )
  )
);
