-- ============================================================
-- fix_subscriptions_plan_type_check.sql
--
-- subscriptions_plan_type_check only allowed 'free', 'standard',
-- 'term' — missing 'monthly' entirely, even though Monthly has always
-- been a real, sellable plan (lib/pricing.ts PLANS.monthly). Every
-- attempt to subscribe to the Monthly plan failed deterministically
-- with "new row ... violates check constraint" from both the Paystack
-- webhook and the client-side /verify fallback — same failure every
-- retry, since it wasn't transient.
--
-- Also had a real, concrete side effect: activateSubscriptionFromPayment
-- (lib/paystack.ts) deactivated the school's old subscription BEFORE
-- inserting the new one, so a failed Monthly attempt could turn off an
-- already-paid, currently-active Standard/Term subscription and then
-- fail to replace it — leaving the school on Free despite having paid.
-- That code path was reordered (insert first, deactivate old only on
-- success) in the same change as this migration.
--
-- Applied directly via the Supabase MCP connector on 2026-08-16.
-- ============================================================

alter table subscriptions drop constraint subscriptions_plan_type_check;
alter table subscriptions add constraint subscriptions_plan_type_check
  check (plan_type = any (array['free', 'standard', 'monthly', 'term']));
