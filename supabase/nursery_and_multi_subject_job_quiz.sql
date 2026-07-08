-- ============================================================
-- nursery_and_multi_subject_job_quiz.sql
--
-- 1. Allow 'nursery' as a valid difficulty_level for quiz_questions
-- 2. Allow a job to test up to 3 subjects in one quiz (all modes:
--    standard, speed, written)
-- ============================================================

-- ---- 1. Nursery support on quiz_questions ----

alter table public.quiz_questions
  drop constraint if exists quiz_questions_difficulty_level_check;

alter table public.quiz_questions
  add constraint quiz_questions_difficulty_level_check
  check (
    difficulty_level = any (
      array['nursery'::text, 'primary'::text, 'jss'::text, 'sss'::text, 'tertiary'::text]
    )
  );

-- ---- 2. Multi-subject job quiz ----

-- jobs.quiz_subject (single) -> jobs.quiz_subjects (array, max 3)
alter table public.jobs
  add column if not exists quiz_subjects text[] not null default array[]::text[];

-- Backfill from the existing single quiz_subject (or subject if quiz_subject was never set)
update public.jobs
set quiz_subjects = array[coalesce(quiz_subject, subject)]
where quiz_subjects = array[]::text[];

alter table public.jobs
  add constraint jobs_quiz_subjects_max_three
  check (array_length(quiz_subjects, 1) is null or array_length(quiz_subjects, 1) <= 3);

-- quiz_attempts: snapshot which subjects were actually tested in this attempt,
-- since jobs.quiz_subjects can change after an attempt was made
alter table public.quiz_attempts
  add column if not exists subjects text[] not null default array[]::text[];
