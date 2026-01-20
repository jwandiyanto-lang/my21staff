-- CONSULTANT_SLOTS - Weekly availability patterns for booking
-- Phase 05-01: Scheduling & Handoff infrastructure

CREATE TABLE consultant_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  consultant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Weekly pattern (0=Sunday, 1=Monday, ..., 6=Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Configuration
  duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),
  booking_window_days INTEGER DEFAULT 14 CHECK (booking_window_days > 0),
  max_bookings_per_slot INTEGER DEFAULT 1,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  UNIQUE(workspace_id, consultant_id, day_of_week, start_time)
);

-- RLS
ALTER TABLE consultant_slots ENABLE ROW LEVEL SECURITY;

-- Policies (same pattern as ari_config)
CREATE POLICY "Users can view slots in their workspaces" ON consultant_slots
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert slots in their workspaces" ON consultant_slots
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update slots in their workspaces" ON consultant_slots
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete slots in their workspaces" ON consultant_slots
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- Indexes
CREATE INDEX idx_consultant_slots_workspace ON consultant_slots(workspace_id);
CREATE INDEX idx_consultant_slots_consultant ON consultant_slots(consultant_id) WHERE consultant_id IS NOT NULL;
CREATE INDEX idx_consultant_slots_active ON consultant_slots(workspace_id, is_active) WHERE is_active = true;
CREATE INDEX idx_consultant_slots_day ON consultant_slots(workspace_id, day_of_week, is_active);

-- Updated_at trigger
CREATE TRIGGER update_consultant_slots_updated_at
  BEFORE UPDATE ON consultant_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
