-- ============================================================
-- tool_usage.sql
-- Rate-limit log for the free AI tools (/tools/*). One row per generation,
-- keyed by a salted hash of the caller's IP (never the IP itself). Read and
-- written only by the server with the service role (RLS on, no policies),
-- see lib/tools/rate-limit.ts.
-- ============================================================
create table if not exists public.tool_usage (
  id bigint generated always as identity primary key,
  tool text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists tool_usage_ip_created_idx on public.tool_usage (ip_hash, created_at desc);

alter table public.tool_usage enable row level security;
