-- Migration: 25_member_lead_visibility.sql
-- Members can only see contacts assigned to them; owners/admins see all
-- Part of Phase 03: Workspace Roles Enhancement

-- Create private schema if not exists (for SECURITY DEFINER functions)
CREATE SCHEMA IF NOT EXISTS private;

-- Create role lookup function (SECURITY DEFINER for performance)
-- Using subquery wrapping pattern recommended by Supabase for 60-80% better performance
CREATE OR REPLACE FUNCTION private.get_user_role_in_workspace(workspace_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM workspace_members
  WHERE workspace_id = workspace_uuid
  AND user_id = auth.uid()
$$;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view contacts in their workspaces" ON contacts;

-- Create new role-aware SELECT policy
-- Owners and admins see all contacts in workspace
-- Members only see contacts assigned to them
CREATE POLICY "Users can view contacts based on role" ON contacts
  FOR SELECT USING (
    -- Owner/admin can see all contacts in their workspaces
    (SELECT private.get_user_role_in_workspace(workspace_id)) IN ('owner', 'admin')
    OR (
      -- Members only see assigned contacts
      (SELECT private.get_user_role_in_workspace(workspace_id)) = 'member'
      AND assigned_to = (SELECT auth.uid())
    )
  );

-- Note: Index idx_contacts_assigned_to already exists from migration 18
