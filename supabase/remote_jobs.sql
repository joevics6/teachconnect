-- ============================================================
-- remote_jobs.sql
--
-- Remote jobs: a job can be flagged remote and then needs no country,
-- state or LGA.
--
--  * jobs.is_remote           the flag (default false)
--  * school_profiles.state / lga / country
--                             become nullable so a school (or the
--                             "Confidential School" stub) that only hires
--                             remotely can exist without a location.
--                             Dropping NOT NULL is a no-op if the column
--                             is already nullable.
--  * jobs_with_school         exposes is_remote (appended last; the rest is
--                             the live definition from job_slugs.sql).
--
-- Run this BEFORE deploying the code that reads/writes is_remote.
-- ============================================================

alter table jobs add column if not exists is_remote boolean not null default false;

alter table school_profiles alter column state drop not null;
alter table school_profiles alter column lga drop not null;
alter table school_profiles alter column country drop not null;

create or replace view public.jobs_with_school as
 select j.id,
    j.school_id,
    j.title,
    j.subject,
    j.teaching_levels,
    j.employment_type,
    j.positions,
    j.salary_min,
    j.salary_max,
    j.accommodation_offered,
    j.accommodation_type,
    j.benefits,
    j.is_private,
    j.is_featured,
    j.quiz_enabled,
    j.quiz_subject,
    j.quiz_difficulty,
    j.quiz_pass_mark,
    j.custom_questions,
    j.description,
    j.required_qualifications,
    j.preferred_qualifications,
    j.deadline,
    j.status,
    j.views,
    j.created_at,
    j.updated_at,
    sp.school_name,
    sp.school_type,
    sp.state as school_state,
    sp.lga as school_lga,
    sp.logo_url as school_logo_url,
    sp.is_verified as school_is_verified,
    j.external_apply_enabled,
    j.external_apply_value,
    j.quiz_mode,
    j.quiz_duration,
    j.quiz_question_count,
    j.quiz_subjects,
    j.quiz_subject_levels,
    sp.town as school_town,
    j.country as job_country,
    sp.country as school_country,
    sp.slug as school_slug,
    sp.long_description as school_long_description,
    sp.about as school_about,
    sp.website as school_website,
    j.slug,
    j.is_remote
   from jobs j
     join school_profiles sp on j.school_id = sp.id;
