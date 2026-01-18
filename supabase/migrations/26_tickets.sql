-- Migration: 26_tickets.sql
-- Support ticketing system with 4-stage workflow
-- Part of Phase 04: Support Ticketing Core

-- ============================================================================
-- TABLE: tickets
-- ============================================================================
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),

  -- Core fields
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,

  -- Stage tracking (Report -> Discuss -> Outcome -> Implementation -> Closed)
  stage VARCHAR(50) NOT NULL DEFAULT 'report',

  -- Approval flow (for stage skipping)
  pending_approval BOOLEAN DEFAULT FALSE,
  pending_stage VARCHAR(50),
  approval_requested_at TIMESTAMPTZ,

  -- Reopen tracking
  reopen_token VARCHAR(255),
  closed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT tickets_category_check CHECK (category IN ('bug', 'feature', 'question')),
  CONSTRAINT tickets_priority_check CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT tickets_stage_check CHECK (stage IN ('report', 'discuss', 'outcome', 'implementation', 'closed')),
  CONSTRAINT tickets_pending_stage_check CHECK (pending_stage IS NULL OR pending_stage IN ('report', 'discuss', 'outcome', 'implementation', 'closed'))
);

-- ============================================================================
-- TABLE: ticket_comments
-- Flat timeline comments for ticket discussions
-- ============================================================================
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_stage_change BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: ticket_status_history
-- Audit trail for stage transitions
-- ============================================================================
CREATE TABLE ticket_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Uses private.get_user_role_in_workspace() from migration 25
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TICKETS POLICIES
-- ============================================================================

-- SELECT: Any workspace member can view tickets
CREATE POLICY "Members can view tickets" ON tickets
  FOR SELECT USING (
    (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
  );

-- INSERT: Any member can create tickets (requester_id must match auth.uid())
CREATE POLICY "Members can create tickets" ON tickets
  FOR INSERT WITH CHECK (
    (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
    AND requester_id = auth.uid()
  );

-- UPDATE: Owner/admin, assigned_to, or requester can update
CREATE POLICY "Authorized users can update tickets" ON tickets
  FOR UPDATE USING (
    (SELECT private.get_user_role_in_workspace(workspace_id)) IN ('owner', 'admin')
    OR assigned_to = auth.uid()
    OR requester_id = auth.uid()
  );

-- ============================================================================
-- TICKET_COMMENTS POLICIES
-- ============================================================================

-- SELECT: Members can view comments if ticket is in their workspace
CREATE POLICY "Members can view comments" ON ticket_comments
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
    )
  );

-- INSERT: Members can add comments (author_id must match auth.uid())
CREATE POLICY "Members can add comments" ON ticket_comments
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
    )
    AND author_id = auth.uid()
  );

-- ============================================================================
-- TICKET_STATUS_HISTORY POLICIES
-- ============================================================================

-- SELECT: Members can view status history if ticket is in their workspace
CREATE POLICY "Members can view status history" ON ticket_status_history
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
    )
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tickets indexes
CREATE INDEX idx_tickets_workspace ON tickets(workspace_id);
CREATE INDEX idx_tickets_requester ON tickets(requester_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_stage ON tickets(stage);
CREATE INDEX idx_tickets_workspace_stage ON tickets(workspace_id, stage);

-- Comments indexes
CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_ticket_created ON ticket_comments(ticket_id, created_at);

-- Status history indexes
CREATE INDEX idx_ticket_status_history_ticket ON ticket_status_history(ticket_id);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

-- Create function if not exists (may already exist from other migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
