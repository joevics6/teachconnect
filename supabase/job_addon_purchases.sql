-- ============================================================
-- Job add-on purchases: Featured Listing, Extended Posting
-- Run this in Supabase SQL Editor
-- ============================================================
-- These are advertised on the pricing page (Featured Listing N10,000,
-- Extended Posting N5,000) but had no backend support at all before
-- this migration — no purchase flow, no way to actually buy either.

CREATE TABLE IF NOT EXISTS public.job_addon_purchases (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  school_id           uuid        NOT NULL REFERENCES public.school_profiles(id) ON DELETE CASCADE,
  addon_type          text        NOT NULL CHECK (addon_type IN ('featured', 'extended')),
  amount_kobo         integer     NOT NULL,
  paystack_reference  text        NOT NULL UNIQUE,
  status              text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_job_addon_purchases_job    ON public.job_addon_purchases(job_id);
CREATE INDEX IF NOT EXISTS idx_job_addon_purchases_school ON public.job_addon_purchases(school_id);

ALTER TABLE public.job_addon_purchases ENABLE ROW LEVEL SECURITY;

-- Same pattern as elsewhere: RLS just needs to let a logged-in request
-- through; the real "is this your own school/job" check happens in the
-- API route itself (it always filters by the caller's own school_id).
CREATE POLICY "Authenticated users can read job addon purchases"
  ON public.job_addon_purchases FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert job addon purchases"
  ON public.job_addon_purchases FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update job addon purchases"
  ON public.job_addon_purchases FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
