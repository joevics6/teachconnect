-- ============================================================
-- fix_specialization_quiz_results_rls.sql
--
-- BUG: after completing a subject-mastery (specialization) quiz, the
-- teacher was stuck on "Calculating your rank..." indefinitely.
--
-- ROOT CAUSE: the RLS policy on specialization_quiz_results compared
-- auth.uid() directly to teacher_id — but teacher_id here stores
-- teacher_profiles.id, a separate generated UUID, not the Supabase
-- Auth user id (that's teacher_profiles.user_id). auth.uid() would
-- essentially never equal teacher_id, so every INSERT (submitting a
-- result) was silently rejected by RLS. Every other table storing a
-- teacher_id (applications, quiz_attempts) already uses the correct
-- pattern: teacher_id IN (SELECT id FROM teacher_profiles WHERE
-- user_id = auth.uid()) — this table just never got the same pattern.
--
-- FIX: replace the single broken "ALL" policy with a correct INSERT
-- policy, plus a broad authenticated SELECT policy — percentile
-- ranking needs to count OTHER teachers' scores for the same
-- subject/level, and a bare score/subject/level row isn't identifying
-- on its own (same tradeoff quiz_attempts makes for schools reading
-- applicant scores).
--
-- Applied directly via the Supabase MCP connector on 2026-08-12.
-- ============================================================

drop policy if exists "Teachers manage own quiz results" on specialization_quiz_results;

create policy "Teachers can insert own specialization results"
  on specialization_quiz_results for insert
  with check (teacher_id in (select id from teacher_profiles where user_id = auth.uid()));

create policy "Authenticated users can read specialization results"
  on specialization_quiz_results for select
  to authenticated
  using (true);
