-- ================================================
-- Migration: 42_scoring_config.sql
-- Purpose: ARI scoring configuration table
-- Allows workspace owners to customize scoring thresholds and category weights
-- ================================================

-- ===========================================
-- Table: ari_scoring_config
-- ===========================================

CREATE TABLE ari_scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Thresholds (0-100)
  -- hot >= hot_threshold, warm >= warm_threshold, cold < warm_threshold
  hot_threshold INTEGER NOT NULL DEFAULT 70,
  warm_threshold INTEGER NOT NULL DEFAULT 40,

  -- Category weights (must sum to 100)
  weight_basic INTEGER NOT NULL DEFAULT 25,
  weight_qualification INTEGER NOT NULL DEFAULT 35,
  weight_document INTEGER NOT NULL DEFAULT 30,
  weight_engagement INTEGER NOT NULL DEFAULT 10,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One config per workspace
  UNIQUE(workspace_id),

  -- Validation constraints
  CONSTRAINT valid_hot_threshold CHECK (hot_threshold <= 100 AND hot_threshold >= 1),
  CONSTRAINT valid_warm_threshold CHECK (warm_threshold >= 0 AND warm_threshold < 100),
  CONSTRAINT hot_above_warm CHECK (hot_threshold > warm_threshold),
  CONSTRAINT weights_sum_to_100 CHECK (weight_basic + weight_qualification + weight_document + weight_engagement = 100)
);

-- ===========================================
-- RLS Policies
-- ===========================================

ALTER TABLE ari_scoring_config ENABLE ROW LEVEL SECURITY;

-- Workspace members can view their workspace's scoring config
CREATE POLICY "Workspace members can view scoring config"
  ON ari_scoring_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ari_scoring_config.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

-- Workspace owners/admins can insert scoring config
CREATE POLICY "Workspace admins can insert scoring config"
  ON ari_scoring_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ari_scoring_config.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- Workspace owners/admins can update scoring config
CREATE POLICY "Workspace admins can update scoring config"
  ON ari_scoring_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ari_scoring_config.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ari_scoring_config.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- Workspace owners can delete scoring config
CREATE POLICY "Workspace owners can delete scoring config"
  ON ari_scoring_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ari_scoring_config.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role = 'owner'
    )
  );

-- ===========================================
-- Trigger: updated_at
-- ===========================================

CREATE TRIGGER update_ari_scoring_config_updated_at
  BEFORE UPDATE ON ari_scoring_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- Index for workspace lookup
-- ===========================================

CREATE INDEX idx_ari_scoring_config_workspace ON ari_scoring_config(workspace_id);
