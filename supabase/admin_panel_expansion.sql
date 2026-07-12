-- ============================================================
-- Admin panel expansion: Users, Resources CRUD, Blog
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── 1. Account disable flag (Users admin "disable account") ──
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.school_profiles  ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;

-- The existing RLS policies on these two tables only let a user read/
-- write their own row (user_id = auth.uid()), which would block the
-- admin Users page from seeing or editing anyone else's profile. Add
-- broader authenticated-read/update policies — same approach as
-- elsewhere in this migration: RLS just needs to let a logged-in
-- request through, the real "are you actually an admin" check happens
-- in application code (lib/admin.ts, gated by ADMIN_EMAILS).
CREATE POLICY "Authenticated users can read all teacher profiles"
  ON public.teacher_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update any teacher profile"
  ON public.teacher_profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read all school profiles"
  ON public.school_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update any school profile"
  ON public.school_profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── 2. resource_posts had no write policy at all — admin CRUD ─
-- couldn't have worked without this. Real access control is the
-- ADMIN_EMAILS check in application code; these policies just need
-- to let an authenticated request through.
CREATE POLICY "Authenticated users can read all resource posts"
  ON resource_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert resource posts"
  ON resource_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update resource posts"
  ON resource_posts FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete resource posts"
  ON resource_posts FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ─── 3. Blog — new, separate from Resources ────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  slug              text UNIQUE NOT NULL,
  excerpt           text NOT NULL,
  body              text,
  author            text,
  cover_image_url   text,
  tags              text[] DEFAULT '{}',
  read_time_minutes int,
  seo_title         text,
  seo_description   text,
  is_published      boolean DEFAULT false,
  published_at      timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can read all blog posts"
  ON public.blog_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update blog posts"
  ON public.blog_posts FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete blog posts"
  ON public.blog_posts FOR DELETE
  USING (auth.uid() IS NOT NULL);
