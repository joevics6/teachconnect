-- ═══════════════════════════════════════════════════════════════
-- Migration: School profile expansion + teacher demo video +
--            school saved teachers
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. School profile new columns ───────────────────────────────
ALTER TABLE public.school_profiles
  ADD COLUMN IF NOT EXISTS about               text          NULL,
  ADD COLUMN IF NOT EXISTS curriculum          text[]        NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS student_population  int           NULL,
  ADD COLUMN IF NOT EXISTS salary_range_min    int           NULL,
  ADD COLUMN IF NOT EXISTS salary_range_max    int           NULL,
  ADD COLUMN IF NOT EXISTS benefits            text[]        NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS school_category     text          NULL,
  ADD COLUMN IF NOT EXISTS verification_status text          NOT NULL DEFAULT 'unverified';

-- ── 2. Teacher profile: demo video URL ──────────────────────────
ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS demo_video_url      text          NULL;

-- ── 3. School saved teachers (Save Teacher feature) ─────────────
CREATE TABLE IF NOT EXISTS public.school_saved_teachers (
  id          uuid        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  school_id   uuid        NOT NULL REFERENCES public.school_profiles(id)  ON DELETE CASCADE,
  teacher_id  uuid        NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  folder      text        NOT NULL DEFAULT 'excellent',
  notes       text        NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_saved_teachers_pkey   PRIMARY KEY (id),
  CONSTRAINT school_saved_teachers_unique UNIQUE (school_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_school_saved_teachers_school
  ON public.school_saved_teachers(school_id);

CREATE INDEX IF NOT EXISTS idx_school_saved_teachers_teacher
  ON public.school_saved_teachers(teacher_id);
