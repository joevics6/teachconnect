-- ============================================================
-- add_quiz_subject_levels.sql
--
-- Lets a job's quiz span multiple grade levels (e.g. JSS + SSS) with a
-- specific level per subject, instead of one shared quiz_difficulty
-- applied to every quiz_subject. Kept alongside the old quiz_subjects/
-- quiz_difficulty columns for backward compatibility — older jobs
-- (created before this existed) have this empty, and
-- app/api/quiz/[jobid]/route.ts falls back to the old single-level
-- behavior when it's empty.
--
-- Applied directly via the Supabase MCP connector on 2026-08-13.
-- ============================================================

alter table jobs add column if not exists quiz_subject_levels jsonb;
