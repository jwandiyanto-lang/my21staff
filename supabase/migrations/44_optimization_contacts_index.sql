-- Migration: 44_optimization_contacts_index.sql
-- Index for contacts table workspace queries
-- Part of Phase 02: Supabase Optimization

-- ============================================================================
-- INDEX: contacts workspace_id
-- ============================================================================
-- Supports: /api/contacts WHERE workspace_id = ? (for Lead Management list)
-- Reduces full table scan to filtered by workspace
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_list
ON contacts(workspace_id);

-- ============================================================================
-- INDEX COMMENT
-- ============================================================================
COMMENT ON INDEX idx_contacts_workspace_list IS 'Optimization index for contacts list queries';

-- ============================================================================
-- EXISTING INDEXES (from previous migrations)
-- ============================================================================
-- idx_contacts_workspace_phone - already exists (created in migration 43)
-- These indexes work together for different query patterns:
-- - idx_contacts_workspace_phone: workspace_id + phone (exact match)
-- - idx_contacts_workspace_list: workspace_id (list filtering)
