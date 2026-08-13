-- ============================================================
-- create_admin_emails_table.sql
--
-- Moves admin access from being purely an ADMIN_EMAILS env var to a
-- proper Supabase-backed list (lib/admin.ts checks both — a match on
-- either grants access). Deliberately a separate table rather than
-- users.role: several of the seeded emails below are already
-- registered teacher accounts, and admin access shouldn't touch or
-- collide with their normal role-based access at all.
--
-- RLS is enabled with zero policies (default deny for every role),
-- so this table is only ever reachable via the service-role client —
-- never exposed to a normal user's session, same as auth.users.
--
-- Applied directly via the Supabase MCP connector on 2026-08-13.
-- ============================================================

create table if not exists admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table admin_emails enable row level security;

insert into admin_emails (email) values
  ('joevicsworld@gmail.com'),
  ('joevicstown@gmail.com'),
  ('joevicspro@gmail.com'),
  ('joevicspay@gmail.com'),
  ('joevicspay1@gmail.com'),
  ('joevicsland@gmail.com'),
  ('joevicslove@gmail.com')
on conflict (email) do nothing;
