-- ============================================================
-- Step 1 of multi-country support (UAE next, gradual rollout).
-- Already applied directly in Supabase (see chat) — this file is the
-- durable record of that change.
--
-- Adds `country` to jobs and school_profiles, defaulted to 'Nigeria'
-- so every existing row is correctly backfilled automatically AND
-- every existing INSERT in the app (which doesn't send a country
-- value yet) keeps working exactly as before — additive only, no
-- application code needed to change for this migration to be safe.
-- Plain text, no CHECK constraint — free to add 'UAE' (or anything
-- else) later without another migration for value validation.
--
-- Also added job_country/school_country to the jobs_with_school view
-- (the source almost every job read in the app actually goes
-- through, not the raw jobs table) — same silent-gap bug class as a
-- past incident this session where external_apply_enabled/value were
-- missing from this same view. Caught and fixed proactively this
-- time instead of waiting for it to break something.
-- ============================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'Nigeria';

ALTER TABLE public.school_profiles
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'Nigeria';

CREATE OR REPLACE VIEW public.jobs_with_school AS
 SELECT j.id,
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
    sp.state AS school_state,
    sp.lga AS school_lga,
    sp.logo_url AS school_logo_url,
    sp.is_verified AS school_is_verified,
    j.external_apply_enabled,
    j.external_apply_value,
    j.quiz_mode,
    j.quiz_duration,
    j.quiz_question_count,
    j.quiz_subjects,
    j.quiz_subject_levels,
    sp.town AS school_town,
    j.country AS job_country,
    sp.country AS school_country
   FROM jobs j
     JOIN school_profiles sp ON j.school_id = sp.id;
