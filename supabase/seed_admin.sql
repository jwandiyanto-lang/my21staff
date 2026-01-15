-- Seed: Set Jonathan as owner of all workspaces
-- Run this after creating workspaces to ensure proper admin setup
-- User ID: d7012f0e-54a7-4013-9dfa-f63057040c08 (jwandiyanto@gmail.com)

-- Add Jonathan to workspace_members as owner of all workspaces
INSERT INTO workspace_members (workspace_id, user_id, role, must_change_password)
SELECT
  w.id,
  'd7012f0e-54a7-4013-9dfa-f63057040c08'::uuid,
  'owner',
  false
FROM workspaces w
ON CONFLICT (workspace_id, user_id) DO UPDATE SET
  role = 'owner',
  must_change_password = false;

-- Update profile to mark as admin
UPDATE profiles
SET is_admin = true
WHERE id = 'd7012f0e-54a7-4013-9dfa-f63057040c08';
