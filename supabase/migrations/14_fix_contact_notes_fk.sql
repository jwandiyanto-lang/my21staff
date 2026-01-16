-- Fix contact_notes foreign key to reference profiles instead of auth.users
-- This allows PostgREST to do proper joins with the profiles table

-- First, drop the existing FK constraint
ALTER TABLE contact_notes
DROP CONSTRAINT IF EXISTS contact_notes_author_id_fkey;

-- Add new FK to profiles table
ALTER TABLE contact_notes
ADD CONSTRAINT contact_notes_author_id_fkey
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
