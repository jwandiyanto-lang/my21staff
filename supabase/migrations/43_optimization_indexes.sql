-- Migration: 43_optimization_indexes.sql
-- Composite indexes for hot path query optimization
-- Part of Phase 02: Supabase Optimization

-- ============================================================================
-- COMPOSITE INDEX: contacts table
-- Supports: /api/contacts/by-phone WHERE workspace_id = ? AND phone = ?
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_phone
ON contacts(workspace_id, phone);

-- ============================================================================
-- COMPOSITE INDEX: conversations table
-- Supports: /api/conversations WHERE workspace_id = ? ORDER BY last_message_at DESC
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_time
ON conversations(workspace_id, last_message_at DESC);

-- ============================================================================
-- COMPOSITE INDEX: messages table
-- Supports: Message pagination WHERE conversation_id = ? ORDER BY created_at DESC
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
ON messages(conversation_id, created_at DESC);

-- ============================================================================
-- INDEX COMMENT (documentation for future reference)
-- ============================================================================
COMMENT ON INDEX idx_contacts_workspace_phone IS 'Optimization index for contact lookup by workspace and phone';
COMMENT ON INDEX idx_conversations_workspace_time IS 'Optimization index for conversations list ordered by time';
COMMENT ON INDEX idx_messages_conversation_time IS 'Optimization index for message pagination';
