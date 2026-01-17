-- Migration: Add due_date column to contact_notes for task management
-- Phase 20: Dashboard Stats & Notes Due Dates

-- Add due_date column to contact_notes
ALTER TABLE contact_notes
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient querying of upcoming tasks
CREATE INDEX IF NOT EXISTS idx_contact_notes_due_date ON contact_notes (due_date)
WHERE due_date IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN contact_notes.due_date IS 'Optional due date for task-like notes, displayed in dashboard';
