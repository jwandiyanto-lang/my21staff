-- Migration: 12_multi_tenant_admin.sql
-- Add must_change_password column to workspace_members for first-login flow

-- Add must_change_password column if it doesn't exist
ALTER TABLE workspace_members
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- Update existing RLS policies to allow admin/owner to manage all memberships
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON workspace_members;
DROP POLICY IF EXISTS "Admins can manage memberships" ON workspace_members;

-- Policy: Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON workspace_members FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins/Owners can view all memberships
CREATE POLICY "Admins can view all memberships"
  ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Policy: Admins/Owners can insert memberships
CREATE POLICY "Admins can insert memberships"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Policy: Admins/Owners can update memberships
CREATE POLICY "Admins can update memberships"
  ON workspace_members FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Policy: Admins/Owners can delete memberships
CREATE POLICY "Admins can delete memberships"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Update profiles table to ensure is_admin policy allows admin users to view other profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Insert policy for profiles (for creating new users)
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );
