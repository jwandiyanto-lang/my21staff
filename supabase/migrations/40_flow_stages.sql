-- ARI_FLOW_STAGES - Custom conversation stages for flexible flow configuration
-- Phase 06-02: Admin Interface - Flow Tab

-- Create the flow stages table
CREATE TABLE ari_flow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Stage definition
  name VARCHAR(100) NOT NULL,
  goal TEXT NOT NULL,
  sample_script TEXT,
  exit_criteria TEXT,

  -- Ordering and status
  stage_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each workspace has unique stage orders
  UNIQUE(workspace_id, stage_order)
);

-- Enable RLS
ALTER TABLE ari_flow_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as ari_config)
CREATE POLICY "Users can view flow stages in their workspaces" ON ari_flow_stages
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert flow stages in their workspaces" ON ari_flow_stages
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update flow stages in their workspaces" ON ari_flow_stages
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete flow stages in their workspaces" ON ari_flow_stages
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- Indexes
CREATE INDEX idx_ari_flow_stages_workspace ON ari_flow_stages(workspace_id);
CREATE INDEX idx_ari_flow_stages_order ON ari_flow_stages(workspace_id, stage_order);
CREATE INDEX idx_ari_flow_stages_active ON ari_flow_stages(workspace_id, is_active) WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER update_ari_flow_stages_updated_at
  BEFORE UPDATE ON ari_flow_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
