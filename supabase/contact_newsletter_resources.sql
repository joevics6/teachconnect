-- ============================================================
-- TeachConnect: Contact & Resources Tables
-- Run in Supabase SQL Editor
-- Note: newsletter_subscribers table already exists — excluded
-- ============================================================


-- ─── 1. Contact Submissions ──────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_submissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  subject    text NOT NULL,
  message    text NOT NULL,
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- Optional: authenticated admins can read
-- CREATE POLICY "Admins can read submissions"
--   ON contact_submissions FOR SELECT
--   USING (auth.jwt() ->> 'role' = 'admin');


-- ─── 2. Resource Posts ───────────────────────────────────────
-- Supports: articles, PDFs, documents, videos, YouTube links
-- Each row has enough SEO content to rank independently.

CREATE TABLE IF NOT EXISTS resource_posts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core content
  title               text NOT NULL,
  slug                text UNIQUE NOT NULL,
  excerpt             text NOT NULL,           -- 1-2 sentence summary, shown in cards
  body                text,                    -- Full HTML body for SEO + reading
  category            text NOT NULL,           -- 'Career Advice' | 'School Management' | 'TRCN Guide' | 'Salary Insights' | 'Curriculum Guide'
  author              text,

  -- Resource type determines which access field is used
  -- Values: 'article' | 'pdf' | 'document' | 'video' | 'youtube'
  resource_type       text NOT NULL DEFAULT 'article',

  -- File/media access
  cover_image_url     text,                    -- Header image
  file_url            text,                    -- Supabase storage URL (for pdf/document)
  external_url        text,                    -- External URL (for video/youtube or external docs)
  youtube_id          text,                    -- YouTube video ID for embedding

  -- Metadata
  tags                text[] DEFAULT '{}',
  read_time_minutes   int,
  download_count      int DEFAULT 0,

  -- SEO
  seo_title           text,                    -- Overrides <title> tag if set
  seo_description     text,                    -- Meta description for Google

  -- Publishing
  is_published        boolean DEFAULT false,
  published_at        timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE resource_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published resources" ON resource_posts;
CREATE POLICY "Anyone can read published resources"
  ON resource_posts FOR SELECT
  USING (is_published = true);


-- ─── 3. Resource Downloads (simple files) ────────────────────
-- Table already exists in DB — skipped to avoid conflicts.


-- ─── 4. Helper: increment view/download count ─────────────────

CREATE OR REPLACE FUNCTION increment_resource_count(resource_slug text)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE resource_posts
  SET download_count = download_count + 1
  WHERE slug = resource_slug;
$$;


-- ─── 5. Seed examples ────────────────────────────────────────
-- Adapt or remove before running in production.

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
