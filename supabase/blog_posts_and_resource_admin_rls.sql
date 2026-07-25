-- ============================================================
-- Already applied directly via Supabase MCP on 2026-07-25.
-- Kept here for history / local dev parity.
-- ============================================================
-- 1. blog_posts did not exist at all even though the public /blog
--    page and the entire admin/blog CRUD already queried it —
--    every hit was a hard 500.
-- 2. resource_posts had a public-SELECT-published policy but no
--    admin write policy, so the admin Resources CRUD silently
--    failed under RLS when used through the actual app UI.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL,
  body text DEFAULT '',
  author text,
  cover_image_url text,
  tags text[] DEFAULT '{}',
  read_time_minutes integer DEFAULT 5,
  seo_title text,
  seo_description text,
  is_published boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins manage blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage resource posts"
  ON public.resource_posts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
