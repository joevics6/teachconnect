-- ============================================================
-- Notification preferences + account deletion support
-- Run this in Supabase SQL Editor
-- ============================================================

-- Real, persisted notification preferences (replaces the old
-- localStorage-only toggles on the Settings page).
ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT
    '{"application_updates": true, "new_jobs": true, "invites": true, "newsletter": false}'::jsonb;
