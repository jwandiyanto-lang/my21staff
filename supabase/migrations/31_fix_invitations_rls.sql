-- Migration: 31_fix_invitations_rls.sql
-- Fix workspace_invitations RLS policy to use SECURITY DEFINER function
-- This resolves issues where the RLS subquery on workspace_members was being affected by RLS recursion

-- ============================================================================
-- STEP 1: Drop existing policies
-- ============================================================================
DROP POLICY IF EXISTS "Members can view invitations" ON workspace_invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON workspace_invitations;

-- ============================================================================
-- STEP 2: Create new policies using the SECURITY DEFINER function
-- This function (private.get_user_role_in_workspace) was created in migration 25
-- and handles RLS recursion correctly
-- ============================================================================

-- Policy: Members can view invitations for workspaces they belong to
CREATE POLICY "Members can view invitations" ON workspace_invitations
  FOR SELECT USING (
    (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
  );

-- Policy: Owners can manage (insert/update/delete) invitations
CREATE POLICY "Owners can manage invitations" ON workspace_invitations
  FOR ALL USING (
    (SELECT private.get_user_role_in_workspace(workspace_id)) = 'owner'
  );

-- ============================================================================
-- STEP 3: Verify the function exists
-- ============================================================================
DO $$
BEGIN
  -- Verify the function exists
  PERFORM private.get_user_role_in_workspace('00000000-0000-0000-0000-000000000000'::UUID);
  RAISE NOTICE 'private.get_user_role_in_workspace function verified';
END $$;
