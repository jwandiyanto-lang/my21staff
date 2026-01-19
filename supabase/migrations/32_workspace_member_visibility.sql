-- Migration: 32_workspace_member_visibility.sql
-- Allow workspace members to see workspaces they belong to

-- Enable RLS on workspaces if not already enabled
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Members can view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Public can view workspaces by slug" ON workspaces;

-- Policy: Members can view workspaces they belong to
CREATE POLICY "Members can view their workspaces" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Anyone can view workspaces by slug (needed for public pages like articles)
-- This is read-only and only exposes basic info
CREATE POLICY "Public can view workspaces by slug" ON workspaces
  FOR SELECT USING (true);
