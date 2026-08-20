-- ============================================================
-- external_job_application.sql
--
-- Lets a school skip the built-in quiz/apply flow entirely and
-- instead point applicants straight to an email, phone number
-- (routed to WhatsApp), or an external website. The single text
-- value's type (email / phone / url) is guessed at render time in
-- lib/external-apply.ts rather than stored separately, so one column
-- is enough.
-- ============================================================

alter table jobs
  add column if not exists external_apply_enabled boolean not null default false,
  add column if not exists external_apply_value text;
