-- ============================================================
-- add_missing_subscriptions_update_policy.sql
--
-- subscriptions had INSERT and SELECT policies but no UPDATE policy
-- at all. activateSubscriptionFromPayment (lib/paystack.ts) deactivates
-- a school's old subscription before inserting the new one — with no
-- UPDATE policy, that step silently affected 0 rows for every caller,
-- session or not, so old subscriptions never actually got marked
-- inactive.
--
-- The real fix is that activateSubscriptionFromPayment now uses the
-- service-role client (bypasses RLS entirely — see the much larger
-- fix in the same batch, covering the Paystack webhook and every
-- other admin route). This policy is defense-in-depth / correctness
-- hygiene for any other caller, matching the INSERT policy's ownership
-- check.
--
-- Applied directly via the Supabase MCP connector on 2026-08-13.
-- ============================================================

create policy "Schools can update own subscriptions"
  on subscriptions for update
  to authenticated
  using (school_id in (select id from school_profiles where user_id = auth.uid()))
  with check (school_id in (select id from school_profiles where user_id = auth.uid()));
