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
