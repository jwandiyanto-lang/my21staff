-- Migration: 33_invitation_name_column.sql
-- Add name column to workspace_invitations to preserve invitee name

ALTER TABLE workspace_invitations
ADD COLUMN name VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN workspace_invitations.name IS 'Full name of the invited user, provided during invitation';
