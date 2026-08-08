-- ============================================================
-- quiz_starts.sql
--
-- Records the moment a teacher actually started a quiz, server-side,
-- so elapsed time isn't just whatever the client claims when
-- submitting. Shared by both quiz systems (job-application quizzes
-- and the profile specialization quiz) via context_type.
--
-- Refreshing the quiz page does NOT reset the timer — the GET route
-- reuses the existing started_at for that (teacher, quiz) pair
-- instead of creating a new one, closing the "refresh for a fresh
-- timer" loophole along with the "self-reported time_taken" one.
-- ============================================================

create table if not exists public.quiz_starts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  context_type text not null check (context_type in ('job', 'specialization')),
  context_key text not null, -- job_id for 'job'; "<subject>|<level>" for 'specialization'
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (teacher_id, context_type, context_key)
);

create index if not exists quiz_starts_teacher_idx on public.quiz_starts(teacher_id);

alter table public.quiz_starts enable row level security;

create policy "Teachers manage their own quiz starts"
  on public.quiz_starts for all
  using (
    teacher_id in (select id from public.teacher_profiles where user_id = auth.uid())
  );
