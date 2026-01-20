-- Enable real-time for ARI tables
-- These tables will support postgres_changes subscriptions for live updates
-- Migration: 36_ari_realtime.sql
--
-- Note: RLS policies were created in 34_ari_tables.sql
-- This migration only adds ARI tables to the realtime publication

-- Add ARI tables to existing supabase_realtime publication
-- Created in migration 15_enable_realtime.sql
ALTER PUBLICATION supabase_realtime ADD TABLE ari_config;
ALTER PUBLICATION supabase_realtime ADD TABLE ari_destinations;
ALTER PUBLICATION supabase_realtime ADD TABLE ari_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ari_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ari_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE ari_appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE ari_ai_comparison;

-- Note: Real-time subscriptions require:
-- 1. RLS to be enabled (done in 34_ari_tables.sql)
-- 2. User must have SELECT permission on the table (handled by RLS policies in 34_ari_tables.sql)
-- 3. Client subscribes with filter (e.g., workspace_id=eq.xxx)
