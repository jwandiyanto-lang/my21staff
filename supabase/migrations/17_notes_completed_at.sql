-- Add completed_at column to contact_notes
ALTER TABLE contact_notes ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for filtering uncompleted tasks
CREATE INDEX IF NOT EXISTS idx_contact_notes_uncompleted
ON contact_notes (workspace_id, due_date)
WHERE completed_at IS NULL;
