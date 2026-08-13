-- ============================================================
-- jobs_admin_approval_and_visibility_fixes.sql
--
-- Three related fixes, applied directly via the Supabase MCP
-- connector on 2026-08-13 (see chat/PR history for the debugging
-- that found each of these):
--
-- 1. JOB-LEVEL ADMIN APPROVAL
--    jobs.status already existed (text, default 'active') but every
--    new job went live immediately with no review step. Widened the
--    jobs_status_check constraint to allow 'pending_approval' and
--    'rejected'. app/api/school/jobs/route.ts now inserts new jobs
--    as 'pending_approval' instead of 'active'; an admin flips them
--    via the new /admin/jobs page. No other change was needed to
--    actually gate visibility — the existing "status = 'active'"
--    SELECT policies already exclude anything not yet approved.
--
-- 2. BLANK JOB CARDS FOR EXPIRED/CLOSED JOBS
--    Every jobs SELECT policy required status='active' AND
--    deadline >= today, with no carve-out for a teacher's own
--    existing application or invite — so the moment a job expired
--    or closed, it vanished from that teacher's own applications
--    and invites pages entirely (blank card: no title, no salary,
--    "?" avatar). Added a policy + SECURITY DEFINER helper function
--    (teacher_has_relation_to_job) granting read access to a job a
--    teacher has actually applied to or been invited to, regardless
--    of its current status/deadline. The helper function is
--    necessary to avoid RLS recursion: applications/school_invites'
--    own policies subquery jobs, so a plain policy subquerying them
--    back would infinitely recurse.
--
-- 3. JOB INVISIBLE FOR UNVERIFIED SCHOOLS
--    jobs_with_school (and the same nested-embed pattern used in
--    several API routes) INNER JOINs jobs to school_profiles. The
--    old "Public can read verified school profiles" policy required
--    is_verified = true for any non-owner read, so a job from an
--    unverified school vanished from every listing — including a
--    teacher's own already-established applications/invites — with
--    no error or explanation. Since job-level admin approval (#1)
--    is now the actual gate on what's publicly visible, school
--    verification shouldn't ALSO silently block visibility on top
--    of that. Replaced the policy with an unconditional public read;
--    is_verified remains as a data flag (e.g. a "Verified" badge)
--    but no longer restricts access.
-- ============================================================

alter table jobs drop constraint jobs_status_check;
alter table jobs add constraint jobs_status_check
  check (status = any (array['active', 'closed', 'draft', 'pending_approval', 'rejected']));

create or replace function public.teacher_has_relation_to_job(p_job_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from applications
    where job_id = p_job_id
      and teacher_id in (select id from teacher_profiles where user_id = auth.uid())
  )
  or exists (
    select 1 from school_invites
    where job_id = p_job_id
      and teacher_id in (select id from teacher_profiles where user_id = auth.uid())
  );
$$;

create policy "Teachers can read jobs from their own applications or invites"
  on jobs for select
  to authenticated
  using (public.teacher_has_relation_to_job(id));

drop policy if exists "Public can read verified school profiles" on school_profiles;
create policy "Public can read school profiles"
  on school_profiles for select
  to anon, authenticated
  using (true);
