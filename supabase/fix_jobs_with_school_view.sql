-- ============================================================
-- Fix: jobs_with_school view was missing external_apply_enabled
-- and external_apply_value entirely.
--
-- Root cause of the "external apply still shows Apply Now" bug:
-- every public job read (api/jobs/[id], job search, related jobs)
-- goes through this view via lib/cache/jobs.ts, not the raw jobs
-- table. The view was created before the external-apply feature
-- existed and was never updated, so external_apply_enabled and
-- external_apply_value came through as undefined for every job,
-- regardless of what was actually saved on the jobs table.
--
-- Already applied directly in Supabase (see chat) — this file is
-- the durable record of that change, matching the pattern of the
-- other one-off SQL files in this folder.
-- ============================================================

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
    j.external_apply_value
   FROM jobs j
     JOIN school_profiles sp ON j.school_id = sp.id;
