-- ============================================================
-- teacher_contact_preferences.sql
--
-- Lets a teacher opt in — separately — to being reachable by phone
-- call and/or WhatsApp. Both default to false (opt-in, not opt-out):
-- a teacher who never touches these checkboxes stays unreachable by
-- either channel, even to schools who'd otherwise have access.
--
-- Surfaced as Call / WhatsApp buttons on the teacher's public profile,
-- visible only to schools on the Monthly or Term plan (see
-- lib/school-plan.ts hasTalentAccess) — replaces the "Direct
-- messaging" feature that was on the pricing page but never built.
-- ============================================================

alter table public.teacher_profiles
  add column if not exists phone_calls_enabled boolean not null default false,
  add column if not exists whatsapp_enabled boolean not null default false;
