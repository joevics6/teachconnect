-- ============================================================
-- blog_queue.sql
-- Pasted articles waiting to be parsed into DRAFT blog posts.
-- The hourly cron (/api/cron/process-blog-queue) takes the oldest
-- 'not_processed' row, runs the same parser the admin "Auto-fill with AI"
-- button uses, and saves the result to blog_posts as a draft.
--
--   status          not_processed | processed
--   blog_post_id    the draft that was created (set when processed)
--   attempts/error  last failure, so a bad item is retried at most 3 times
--                   and can be seen in the admin list
--   last_attempt_at lets the cron enforce "at most one item per ~50 min"
--
-- Service role only: RLS is on and there are no public policies.
-- ============================================================
create table if not exists blog_queue (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  status text not null default 'not_processed' check (status in ('not_processed', 'processed')),
  blog_post_id uuid references blog_posts(id) on delete set null,
  attempts int not null default 0,
  error text,
  last_attempt_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists blog_queue_pending on blog_queue (created_at) where status = 'not_processed';
alter table blog_queue enable row level security;
