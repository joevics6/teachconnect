-- ============================================================
-- cvs_private_bucket.sql
--
-- Reverts the 'cvs' bucket back to private. CVs are now served via
-- short-lived signed URLs generated on demand (see lib/cv-storage.ts
-- and app/api/teacher/cv-signed-url/route.ts) instead of a permanent
-- public link — closes the "reachable by anyone with the exact URL"
-- gap from cvs_public_bucket.sql, without reintroducing the original
-- "1-year signed URL that silently expires" problem that migration
-- was fixing, since signed URLs are now generated fresh every time
-- someone actually clicks "download", not stored once and forgotten.
-- ============================================================

UPDATE storage.buckets SET public = false WHERE id = 'cvs';
