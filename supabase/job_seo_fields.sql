-- ============================================================
-- job_seo_fields.sql
--
-- Extra, search-oriented content for the public job page. Generated
-- per job by lib/job-seo.ts (at approval time, or on demand from
-- /admin/jobs/[id]/edit) and rendered on app/(public)/jobs/[id] —
-- the three prose sections show in accordions and push the page
-- past ~500 words of unique text, which is what ranks.
--
-- Deliberately NOT added to the jobs_with_school view: lib/cache/jobs.ts
-- reads these columns straight from the jobs table instead, so this
-- migration can't clash with whatever the live view currently looks like.
-- ============================================================

alter table jobs
  add column if not exists role_category    text,
  add column if not exists experience_level text,
  add column if not exists responsibilities text[] default '{}',
  add column if not exists skills_required  text[] default '{}',
  add column if not exists about_role       text,
  add column if not exists who_apply        text,
  add column if not exists standout         text,
  add column if not exists meta_description text,
  add column if not exists seo_generated_at timestamptz;
