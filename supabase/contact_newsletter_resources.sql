-- ============================================================
-- TeachConnect: Contact & Resources Tables
-- Run in Supabase SQL Editor (fresh — tables deleted beforehand)
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


-- ─── 3. Resource Posts ───────────────────────────────────────
-- Supports: articles, PDFs, documents, videos, YouTube links
-- Each row is a full SEO page at /resources/[slug]

CREATE TABLE resource_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  slug              text UNIQUE NOT NULL,
  excerpt           text NOT NULL,
  body              text,
  category          text NOT NULL,
  author            text,
  resource_type     text NOT NULL DEFAULT 'article',
  cover_image_url   text,
  file_url          text,
  external_url      text,
  youtube_id        text,
  tags              text[] DEFAULT '{}',
  read_time_minutes int,
  download_count    int DEFAULT 0,
  seo_title         text,
  seo_description   text,
  is_published      boolean DEFAULT false,
  published_at      timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE resource_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published resources"
  ON resource_posts FOR SELECT
  USING (is_published = true);


-- ─── 3. Helper: increment view/download count ────────────────

CREATE OR REPLACE FUNCTION increment_resource_count(resource_slug text)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE resource_posts
  SET download_count = download_count + 1
  WHERE slug = resource_slug;
$$;


-- ─── 4. Seed examples ────────────────────────────────────────

INSERT INTO resource_posts
  (title, slug, excerpt, body, category, resource_type, tags, read_time_minutes, seo_title, seo_description, is_published, youtube_id)
VALUES
  (
    'How to Write a Teaching CV That Gets You Hired in Nigeria',
    'teaching-cv-guide-nigeria',
    'A step-by-step guide to writing a professional teaching CV that stands out to Nigerian school recruiters.',
    '<h2>Why Your CV Matters</h2><p>Your CV is the first thing a school sees. Most hiring decisions in Nigerian schools are made within 60 seconds of reading a CV...</p><h2>Key Sections to Include</h2><ul><li>Personal statement</li><li>Teaching experience with impact metrics</li><li>TRCN registration status</li><li>Subject specialisations</li><li>Qualifications and certifications</li></ul>',
    'Career Advice',
    'article',
    ARRAY['cv', 'job application', 'career', 'nigeria'],
    8,
    'Teaching CV Guide Nigeria 2025 — TeachConnect',
    'Learn how to write a teaching CV that gets you hired in Nigeria. Includes templates, tips, and examples for Nigerian teachers.',
    true,
    null
  ),
  (
    'TRCN Registration Process Explained (2025)',
    'trcn-registration-guide-2025',
    'Everything Nigerian teachers need to know about registering with the Teachers Registration Council of Nigeria.',
    '<h2>What is TRCN?</h2><p>The Teachers Registration Council of Nigeria (TRCN) is the statutory body that regulates teaching as a profession in Nigeria...</p>',
    'TRCN Guide',
    'youtube',
    ARRAY['trcn', 'registration', 'teaching licence', 'nigeria'],
    null,
    'TRCN Registration Guide 2025 — How to Register as a Teacher in Nigeria',
    'Step-by-step guide to TRCN registration for Nigerian teachers. Watch our video walkthrough and download the checklist.',
    true,
    'EXAMPLE_YOUTUBE_ID'
  );


-- ─── Verify ──────────────────────────────────────────────────
-- SELECT resource_type, count(*) FROM resource_posts GROUP BY resource_type;
-- SELECT count(*) FROM contact_submissions;
