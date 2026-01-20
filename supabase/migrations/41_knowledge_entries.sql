-- Knowledge Base Migration
-- Creates tables for generic knowledge storage (categories and entries)
-- Replaces structured ari_destinations with flexible key-value system

-- ============================================
-- ARI_KNOWLEDGE_CATEGORIES - Organize knowledge entries
-- ============================================
CREATE TABLE ari_knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

-- ============================================
-- ARI_KNOWLEDGE_ENTRIES - Individual knowledge items
-- ============================================
CREATE TABLE ari_knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES ari_knowledge_categories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE ari_knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ari_knowledge_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (workspace member pattern)
-- ============================================

-- ari_knowledge_categories policies
CREATE POLICY "Users can view knowledge categories in their workspaces" ON ari_knowledge_categories
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert knowledge categories in their workspaces" ON ari_knowledge_categories
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update knowledge categories in their workspaces" ON ari_knowledge_categories
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete knowledge categories in their workspaces" ON ari_knowledge_categories
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- ari_knowledge_entries policies
CREATE POLICY "Users can view knowledge entries in their workspaces" ON ari_knowledge_entries
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert knowledge entries in their workspaces" ON ari_knowledge_entries
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update knowledge entries in their workspaces" ON ari_knowledge_entries
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete knowledge entries in their workspaces" ON ari_knowledge_entries
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_ari_knowledge_categories_updated_at
  BEFORE UPDATE ON ari_knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ari_knowledge_entries_updated_at
  BEFORE UPDATE ON ari_knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- ari_knowledge_categories indexes
CREATE INDEX idx_ari_knowledge_categories_workspace ON ari_knowledge_categories(workspace_id);
CREATE INDEX idx_ari_knowledge_categories_order ON ari_knowledge_categories(workspace_id, display_order);

-- ari_knowledge_entries indexes
CREATE INDEX idx_ari_knowledge_entries_workspace ON ari_knowledge_entries(workspace_id);
CREATE INDEX idx_ari_knowledge_entries_category ON ari_knowledge_entries(category_id);
CREATE INDEX idx_ari_knowledge_entries_active ON ari_knowledge_entries(workspace_id, is_active) WHERE is_active = true;
