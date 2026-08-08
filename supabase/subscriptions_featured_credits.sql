-- ============================================================
-- subscriptions_featured_credits.sql
--
-- Adds the bundled Featured Listing credit columns to subscriptions.
-- Referenced throughout the app (subscription activation, job
-- creation's featured-listing check, post-job page) but no migration
-- for it existed in the repo — this closes that gap.
--
-- NOT NULL with a default of 0 so existing rows and any insert that
-- doesn't explicitly set these (e.g. the free-plan subscription
-- created at school registration) still succeeds.
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS featured_listings_included integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured_listings_used      integer NOT NULL DEFAULT 0;
