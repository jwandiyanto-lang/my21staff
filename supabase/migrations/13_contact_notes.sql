-- Contact Notes for Activity Timeline
-- Run this in Supabase SQL Editor

-- ============================================
-- CONTACT NOTES
-- ============================================
CREATE TABLE contact_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'note', -- 'note', 'status_change', 'score_change', 'form_submission', 'merge'
  metadata JSONB DEFAULT '{}', -- For storing additional data like old/new values
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_notes_contact ON contact_notes(contact_id);
CREATE INDEX idx_contact_notes_workspace ON contact_notes(workspace_id);
CREATE INDEX idx_contact_notes_created ON contact_notes(created_at DESC);
CREATE INDEX idx_contact_notes_type ON contact_notes(note_type);

-- Enable RLS
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view notes in their workspaces" ON contact_notes
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes in their workspaces" ON contact_notes
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notes" ON contact_notes
  FOR UPDATE USING (
    author_id = auth.uid() AND
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own notes" ON contact_notes
  FOR DELETE USING (
    author_id = auth.uid() AND
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_contact_notes_updated_at
  BEFORE UPDATE ON contact_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
