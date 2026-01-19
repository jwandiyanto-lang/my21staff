-- Migration: 28_central_support_hub.sql
-- Cross-workspace ticketing support for central support hub
-- Part of Phase 05: Central Support Hub

-- ============================================================================
-- ADD admin_workspace_id TO tickets
-- Allows tickets from client workspaces to be routed to admin workspace
-- ============================================================================

ALTER TABLE tickets ADD COLUMN admin_workspace_id UUID REFERENCES workspaces(id);

CREATE INDEX idx_tickets_admin_workspace ON tickets(admin_workspace_id);

-- ============================================================================
-- ADD is_internal TO ticket_comments
-- Allows admins to add internal notes not visible to clients
-- ============================================================================

ALTER TABLE ticket_comments ADD COLUMN is_internal BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- RLS POLICIES: Admin workspace access to routed tickets
-- These ADD access for admin workspace members to view/manage client tickets
-- Existing policies still apply for workspace members
-- ============================================================================

-- SELECT: Admin workspace members can view tickets routed to them
CREATE POLICY "Admin workspace can view routed tickets" ON tickets
  FOR SELECT USING (
    admin_workspace_id IS NOT NULL AND
    (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
  );

-- UPDATE: Admin workspace members can update tickets routed to them
CREATE POLICY "Admin workspace can update routed tickets" ON tickets
  FOR UPDATE USING (
    admin_workspace_id IS NOT NULL AND
    (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
  );

-- ============================================================================
-- RLS POLICIES: Admin workspace access to comments on routed tickets
-- ============================================================================

-- SELECT: Admin workspace can view comments on routed tickets
-- For client workspace members, hide internal comments
CREATE POLICY "Admin workspace can view comments on routed tickets" ON ticket_comments
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE admin_workspace_id IS NOT NULL AND
      (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
    )
  );

-- INSERT: Admin workspace can add comments on routed tickets
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
-- RLS POLICIES: Admin workspace access to status history on routed tickets
-- ============================================================================

-- SELECT: Admin workspace can view history on routed tickets
CREATE POLICY "Admin workspace can view history on routed tickets" ON ticket_status_history
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE admin_workspace_id IS NOT NULL AND
      (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
    )
  );

-- INSERT: Admin workspace can add history on routed tickets
CREATE POLICY "Admin workspace can add history on routed tickets" ON ticket_status_history
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE admin_workspace_id IS NOT NULL AND
      (SELECT private.get_user_role_in_workspace(admin_workspace_id)) IN ('owner', 'admin')
    )
    AND changed_by = auth.uid()
  );
