-- ============================================================
-- seo_landing_pages.sql
-- Editable content for the location landing pages
-- (/jobs/in/[state], e.g. /jobs/in/lagos). The page itself only exists
-- once a state has more than 5 live jobs (see lib/landing.ts); this
-- table holds the SEO copy an admin writes for it. Writes go through
-- /api/admin/seo-pages (service role); the public can only read.
-- ============================================================

create table if not exists public.seo_landing_pages (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null default 'state',
  key              text not null,          -- the state name, e.g. 'Lagos'
  title            text,                   -- <title>, without the brand suffix
  meta_description text,
  intro            text,                   -- Markdown, shown above the job list
  body             text,                   -- Markdown, shown below the job list
  updated_at       timestamptz not null default now(),
  unique (kind, key)
);

alter table public.seo_landing_pages enable row level security;

drop policy if exists "Anyone can read landing page content" on public.seo_landing_pages;
create policy "Anyone can read landing page content"
  on public.seo_landing_pages for select
  using (true);
