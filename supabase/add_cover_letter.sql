-- Add cover_letter column to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS cover_letter text;
