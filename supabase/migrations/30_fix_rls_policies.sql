-- Migration: 30_fix_rls_policies.sql
-- Ensures all RLS infrastructure exists (private schema, role function, policies)
-- This migration is idempotent - safe to run even if components already exist

-- ============================================================================
-- STEP 1: Create private schema if not exists
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS private;

-- ============================================================================
-- STEP 2: Create or replace the role lookup function
-- This function is critical for all cross-workspace RLS policies
-- ============================================================================
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

-- ============================================================================
-- STEP 3: Ensure tickets RLS is enabled
-- ============================================================================
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Re-create admin workspace policies for tickets
-- Drop first to avoid conflicts, then create
-- ============================================================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admin workspace can view routed tickets" ON tickets;
DROP POLICY IF EXISTS "Admin workspace can update routed tickets" ON tickets;

-- Create policies for admin workspace to view client tickets
CREATE POLICY "Admin workspace can view routed tickets" ON tickets
  FOR SELECT USING (
    admin_workspace_id IS NOT NULL AND
    (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
  );

CREATE POLICY "Admin workspace can update routed tickets" ON tickets
  FOR UPDATE USING (
    admin_workspace_id IS NOT NULL AND
    (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
  );

-- ============================================================================
-- STEP 5: Re-create admin workspace policies for ticket_comments
-- ============================================================================
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin workspace can view comments on routed tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Admin workspace can add comments on routed tickets" ON ticket_comments;

CREATE POLICY "Admin workspace can view comments on routed tickets" ON ticket_comments
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE admin_workspace_id IS NOT NULL AND
      (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admin workspace can add comments on routed tickets" ON ticket_comments
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE admin_workspace_id IS NOT NULL AND
      (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
    )
    AND author_id = auth.uid()
  );

-- ============================================================================
-- STEP 6: Re-create admin workspace policies for ticket_status_history
-- ============================================================================
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin workspace can view history on routed tickets" ON ticket_status_history;
DROP POLICY IF EXISTS "Admin workspace can add history on routed tickets" ON ticket_status_history;

CREATE POLICY "Admin workspace can view history on routed tickets" ON ticket_status_history
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE admin_workspace_id IS NOT NULL AND
      (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admin workspace can add history on routed tickets" ON ticket_status_history
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE admin_workspace_id IS NOT NULL AND
      (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
    )
    AND changed_by = auth.uid()
  );

-- ============================================================================
-- STEP 7: Verify the function works (will raise error if it doesn't)
-- ============================================================================
DO $$
BEGIN
  -- Just verify the function exists and is callable
  PERFORM private.get_user_role_in_workspace('00000000-0000-0000-0000-000000000000'::UUID);
  RAISE NOTICE 'private.get_user_role_in_workspace function verified';
END $$;
