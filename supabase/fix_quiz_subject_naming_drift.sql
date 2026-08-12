-- ============================================================
-- fix_quiz_subject_naming_drift.sql
--
-- BUG: quizzes were failing with "no questions available" for
-- Christian/Islamic Religious Studies, Literature in English (SSS),
-- Statistics & Research Methods (Tertiary), and both the Nursery and
-- Primary broad-assessment subjects — even though quiz_questions had
-- plenty of rows for all of them.
--
-- ROOT CAUSE: lib/constants.ts (LEVEL_SUBJECTS) is the single source
-- of truth for subject names used everywhere a job/quiz is created —
-- e.g. "Christian Religious Studies". But a batch of legacy rows in
-- quiz_questions was seeded with different, abbreviated names for the
-- same subjects (e.g. "CRS") before the admin quiz-bank generator
-- added its guard requiring subject ∈ getSubjectsForLevel(level).
-- Every quiz route filters questions with an exact `.eq("subject", …)`
-- match, so a job created with "Christian Religious Studies" (the
-- only name the UI offers) matched zero rows stored as "CRS".
--
-- FIX: rename the legacy rows to the canonical names. Verified no
-- naming collisions before running (see chat/PR history) — this is
-- a plain rename, not a merge, except English (SSS) which folds into
-- the existing (sparse, 16-row) "English Language" (SSS) pool.
--
-- Applied directly via the Supabase MCP connector on 2026-08-12.
-- This file exists for the historical record, matching this repo's
-- convention of tracking schema/data changes as flat SQL files.
-- ============================================================

update quiz_questions set subject = 'Christian Religious Studies' where subject = 'CRS';
update quiz_questions set subject = 'Islamic Religious Studies' where subject = 'IRS';
update quiz_questions set subject = 'Literature in English' where subject = 'Literature' and difficulty_level = 'sss';
update quiz_questions set subject = 'English Language' where subject = 'English' and difficulty_level = 'sss';
update quiz_questions set subject = 'Statistics & Research Methods' where subject = 'Statistics' and difficulty_level = 'tertiary';
update quiz_questions set subject = 'Early Childhood Care & Education' where subject = 'General Early-Years Teaching';
update quiz_questions set subject = 'Primary Education' where subject = 'General Primary Teaching';
