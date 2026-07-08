-- ═══════════════════════════════════════════════════════════════
-- Migration: school_invites table + notifications metadata column
-- Run in: Supabase Dashboard → SQL Editor
-- Only needed if school_invites table doesn't exist yet
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.school_invites (
  id          uuid        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  school_id   uuid        NOT NULL REFERENCES public.school_profiles(id)  ON DELETE CASCADE,
  teacher_id  uuid        NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  job_id      uuid        NOT NULL REFERENCES public.jobs(id)             ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_invites_pkey   PRIMARY KEY (id),
  CONSTRAINT school_invites_status CHECK (status = ANY (ARRAY['pending','accepted','declined'])),
  CONSTRAINT school_invites_unique UNIQUE (school_id, teacher_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_school_invites_teacher ON public.school_invites(teacher_id);
CREATE INDEX IF NOT EXISTS idx_school_invites_school  ON public.school_invites(school_id);
CREATE INDEX IF NOT EXISTS idx_school_invites_job     ON public.school_invites(job_id);

-- Add metadata column to notifications if it doesn't exist
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata jsonb NULL,
  ADD COLUMN IF NOT EXISTS type     text  NULL;
