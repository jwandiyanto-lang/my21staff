-- Migration: 29_ticket_attachments_storage.sql
-- Storage bucket for ticket image attachments
-- Part of Phase 05: Central Support Hub

-- Create storage bucket (private - requires auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- RLS: Users can upload to tickets they're involved in
-- Path format: {ticket_id}/{timestamp}-{filename}
CREATE POLICY "Users can upload to their tickets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    auth.role() = 'authenticated' AND
    -- Extract ticket_id from first folder in path
    (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM tickets
      WHERE requester_id = auth.uid()
         OR assigned_to = auth.uid()
         OR (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
    )
  );

-- RLS: Users can view attachments for tickets they can view
CREATE POLICY "Users can view ticket attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ticket-attachments' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM tickets
      WHERE requester_id = auth.uid()
         OR assigned_to = auth.uid()
         OR (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
    )
  );

-- RLS: Users can delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ticket-attachments' AND
    owner_id = auth.uid()
  );
