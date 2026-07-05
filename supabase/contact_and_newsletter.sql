-- ============================================================
-- TeachConnect: Contact & Newsletter Tables
-- Run in Supabase SQL Editor
-- (resource_posts already created separately)
-- ============================================================


-- ─── 1. Contact Submissions ──────────────────────────────────

CREATE TABLE contact_submissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  subject    text NOT NULL,
  message    text NOT NULL,
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);


-- ─── 2. Newsletter Subscribers ───────────────────────────────

CREATE TABLE newsletter_subscribers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  is_active     boolean DEFAULT true,
  subscribed_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Can check own subscription"
  ON newsletter_subscribers FOR SELECT
  USING (true);


-- ─── Verify ──────────────────────────────────────────────────
-- SELECT count(*) FROM contact_submissions;
-- SELECT count(*) FROM newsletter_subscribers;
