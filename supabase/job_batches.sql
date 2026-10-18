-- ============================================================
-- job_batches.sql
-- One row per "Parse Jobs" run on /admin/parse-jobs. Tracks how many
-- jobs a pasted text produced, how many were saved, skipped as
-- duplicates, or failed (and why). Read by /admin/parse-jobs/batches.
-- Server-only: RLS is on with no policies, the app uses the service role.
-- ============================================================

create table if not exists job_batches (
  id                       uuid primary key default gen_random_uuid(),
  source_type              text not null default 'text_parse',
  source_data              jsonb,
  status                   text not null default 'pending',  -- pending | processing | completed | partial | failed
  total_jobs               integer not null default 0,
  processed_jobs           integer not null default 0,
  failed_jobs              integer not null default 0,
  skipped_jobs             integer not null default 0,
  job_ids                  jsonb not null default '[]'::jsonb,
  errors                   jsonb not null default '[]'::jsonb,
  processing_started_at    timestamptz,
  processing_completed_at  timestamptz,
  processing_duration_ms   integer,
  created_at               timestamptz not null default now()
);

create index if not exists job_batches_created_at_idx on job_batches (created_at desc);

alter table job_batches enable row level security;
