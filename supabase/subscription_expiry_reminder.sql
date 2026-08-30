-- ============================================================
-- Subscription expiry reminder tracking
-- Run this in Supabase SQL Editor
-- ============================================================

-- Tracks the last time we emailed a school that this specific
-- subscription row is about to expire, so the daily cron job
-- (app/api/cron/subscription-expiry) can send exactly one reminder
-- per subscription instead of re-sending every day it happens to
-- still fall inside the reminder window.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS expiry_reminder_sent_at timestamptz;
