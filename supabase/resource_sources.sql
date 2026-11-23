-- Adds multi-source support to resources. Run BEFORE seed_resources_batch2.sql
ALTER TABLE resource_posts ADD COLUMN IF NOT EXISTS sources jsonb DEFAULT '[]'::jsonb;
