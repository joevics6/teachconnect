-- ============================================================
-- teacher_level_subjects.sql
--
-- Pairs each teacher's subjects to the specific level they teach
-- them at (e.g. Mathematics @ SSS, English Language @ JSS), instead
-- of two independent flat lists (teaching_levels, subjects) with no
-- link between them.
--
-- `level_subjects` becomes the source of truth going forward.
-- `teaching_levels` and `subjects` are KEPT — the app now derives
-- and writes them automatically from `level_subjects` on every save,
-- so existing queries/filters that rely on those two flat columns
-- keep working unchanged.
-- ============================================================

alter table public.teacher_profiles
  add column if not exists level_subjects jsonb not null default '[]'::jsonb;

-- Backfill: best-effort — pair every existing subject with every
-- existing teaching level, since the old data never recorded which
-- subject belonged to which level. Teachers can refine this later
-- from their profile.
update public.teacher_profiles
set level_subjects = (
  select coalesce(
    jsonb_agg(jsonb_build_object('level', lvl, 'subjects', to_jsonb(subjects))),
    '[]'::jsonb
  )
  from unnest(teaching_levels) as lvl
)
where level_subjects = '[]'::jsonb
  and teaching_levels is not null
  and array_length(teaching_levels, 1) > 0;
