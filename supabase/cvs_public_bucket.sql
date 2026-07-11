-- ============================================================
-- Make the 'cvs' storage bucket public
-- Run this in Supabase SQL Editor
-- ============================================================
-- Previously CVs were stored with a 1-year signed URL saved permanently
-- in teacher_profiles.cv_url. Nothing renews that URL, so every CV was
-- silently going to become inaccessible exactly one year after upload.
-- Switching to a public bucket (same pattern already used for 'avatars')
-- gives CVs a permanent URL with no expiry.
--
-- Note: this makes CV files reachable by anyone who has (or guesses) the
-- exact file URL. URLs are namespaced by user id + fixed filename
-- (e.g. <user_id>/cv.pdf), so they aren't listable or guessable without
-- already knowing a specific user's id — the same tradeoff already
-- accepted for profile photos in the 'avatars' bucket.

UPDATE storage.buckets SET public = true WHERE id = 'cvs';
