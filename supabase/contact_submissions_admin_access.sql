-- ============================================================
-- Allow reading contact_submissions (admin page)
-- Run this in Supabase SQL Editor
-- ============================================================
-- contact_submissions currently only has an INSERT policy — nothing
-- can be read back at all, which is why submitted messages were
-- invisible. The actual "is this person allowed to read these" check
-- happens in application code (app/api/admin/contact-submissions,
-- restricted to the ADMIN_EMAILS environment variable), so this
-- policy just needs to allow logged-in users through; it does not
-- need to duplicate the admin-email check itself.

CREATE POLICY "Authenticated users can read contact submissions"
  ON contact_submissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can mark contact submissions read"
  ON contact_submissions FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
