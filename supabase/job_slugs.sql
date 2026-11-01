-- ============================================================
-- job_slugs.sql
--
-- Gives every job a stable, human-readable URL slug so job pages are
-- /jobs/mathematics-teacher-greenfield-college instead of /jobs/<uuid>.
--
-- Slug = job title + the first two words of the school name (a leading
-- "The" is dropped). Confidential schools use the LGA/state instead, so
-- the school's identity never leaks into the URL. Clashes get -2, -3...
--
-- The slug is created by a BEFORE INSERT trigger, so it is set for every
-- way a job can be created (single parse, multi-job parse, admin form,
-- school post-job, duplicate) without touching each insert route. It is
-- deliberately NOT regenerated when the title is edited: a URL that keeps
-- changing loses whatever ranking it has earned.
--
-- Run this BEFORE deploying the code that reads slugs. The app falls
-- back to the id URL for any job that has no slug yet.
-- ============================================================

alter table jobs add column if not exists slug text;

create or replace function public.slugify_text(t text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'))
$$;

-- SECURITY DEFINER: the uniqueness check must see every job and the school
-- lookup must work for whoever is inserting; RLS would hide other schools'
-- jobs from a school user and let a duplicate slip through.
create or replace function public.generate_job_slug(p_id uuid, p_title text, p_school_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_state text;
  v_lga text;
  v_part text;
  v_base text;
  v_candidate text;
  v_n int := 1;
begin
  select school_name, state, lga
    into v_name, v_state, v_lga
    from school_profiles
   where id = p_school_id;

  if v_name is null or v_name ~* 'confidential' then
    v_part := coalesce(nullif(trim(v_lga), ''), nullif(trim(v_state), ''), '');
  else
    v_part := array_to_string(
      (regexp_split_to_array(trim(regexp_replace(v_name, '^the\s+', '', 'i')), '\s+'))[1:2],
      ' ');
  end if;

  v_base := public.slugify_text(coalesce(p_title, '') || ' ' || v_part);
  v_base := trim(both '-' from left(v_base, 90));
  if v_base = '' then
    v_base := 'job';
  end if;

  v_candidate := v_base;
  while exists (select 1 from jobs where slug = v_candidate and id is distinct from p_id) loop
    v_n := v_n + 1;
    v_candidate := v_base || '-' || v_n;
  end loop;

  return v_candidate;
end;
$$;

create or replace function public.jobs_set_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.generate_job_slug(new.id, new.title, new.school_id);
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_set_slug on jobs;
create trigger jobs_set_slug
  before insert on jobs
  for each row execute function public.jobs_set_slug();

-- Backfill existing jobs, oldest first, one row at a time so each new slug
-- sees the ones already assigned (a single set-based UPDATE would not).
do $$
declare
  r record;
begin
  for r in
    select id, title, school_id from jobs
     where slug is null or slug = ''
     order by created_at
  loop
    update jobs set slug = public.generate_job_slug(r.id, r.title, r.school_id) where id = r.id;
  end loop;
end;
$$;

create unique index if not exists jobs_slug_key on jobs (slug);

-- Expose slug through the view the public job list / related jobs read.
-- CREATE OR REPLACE VIEW can only append columns, so slug goes last. This is
-- the live definition (including the later quiz_*, school_* columns) plus
-- j.slug; Postgres refuses, and changes nothing, if the view has drifted.
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
    j.slug
   from jobs j
     join school_profiles sp on j.school_id = sp.id;
