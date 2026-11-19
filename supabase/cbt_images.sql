-- ============================================================
-- cbt_images.sql
--
-- Diagram / picture support for CBT questions.
--
--   cbt_questions.image_url    a small image shown above the question.
--                              Either a full Supabase Storage URL
--                              (uploaded from /admin/cbt) or a site path
--                              such as /cbt/jamb-bio-2015-q35.jpg for an
--                              image committed to /public/cbt.
--   cbt_questions.needs_image  set by the importer when a question cannot
--                              be answered without its diagram. Such a
--                              question cannot be published until an
--                              image is attached.
--
-- Storage: public 'cbt-images' bucket, 200 KB per file, jpeg/png/webp.
-- Uploads go through the admin API (service role), so no insert policy.
-- ============================================================

alter table cbt_questions add column if not exists image_url text;
alter table cbt_questions add column if not exists needs_image boolean not null default false;

create index if not exists cbt_questions_needs_image on cbt_questions (needs_image) where needs_image;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cbt-images', 'cbt-images', true, 204800, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 204800,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "cbt_images_public_read" on storage.objects;
create policy "cbt_images_public_read" on storage.objects
  for select using (bucket_id = 'cbt-images');
