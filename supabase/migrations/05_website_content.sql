-- Website Manager Content Schema
-- Run this in Supabase SQL Editor after schema.sql
-- Date: 2026-01-14

-- ============================================
-- ARTICLES
-- ============================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published'
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

CREATE INDEX idx_articles_workspace ON articles(workspace_id);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);

-- ============================================
-- WEBINARS
-- ============================================
CREATE TABLE webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  max_registrations INTEGER, -- NULL = unlimited
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'completed', 'cancelled'
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

CREATE INDEX idx_webinars_workspace ON webinars(workspace_id);
CREATE INDEX idx_webinars_slug ON webinars(slug);
CREATE INDEX idx_webinars_status ON webinars(status);
CREATE INDEX idx_webinars_scheduled ON webinars(scheduled_at);

-- ============================================
-- WEBINAR REGISTRATIONS
-- ============================================
CREATE TABLE webinar_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  UNIQUE(webinar_id, contact_id)
);

CREATE INDEX idx_webinar_registrations_webinar ON webinar_registrations(webinar_id);
CREATE INDEX idx_webinar_registrations_contact ON webinar_registrations(contact_id);
CREATE INDEX idx_webinar_registrations_workspace ON webinar_registrations(workspace_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Articles policies: workspace members can view, admins/owners can modify
CREATE POLICY articles_select ON articles
  FOR SELECT USING (
    -- Published articles are public (no auth required)
    status = 'published'
    OR
    -- Workspace members can view drafts
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY articles_insert ON articles
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY articles_update ON articles
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY articles_delete ON articles
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Webinars policies: workspace members can view, admins/owners can modify
CREATE POLICY webinars_select ON webinars
  FOR SELECT USING (
    -- Published webinars are public (for registration pages)
    status = 'published'
    OR
    -- Workspace members can view all
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY webinars_insert ON webinars
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY webinars_update ON webinars
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY webinars_delete ON webinars
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Webinar registrations: public insert (for registration), workspace members can view
CREATE POLICY webinar_registrations_select ON webinar_registrations
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Public insert for registrations (unauthenticated users can register)
CREATE POLICY webinar_registrations_insert ON webinar_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY webinar_registrations_update ON webinar_registrations
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY webinar_registrations_delete ON webinar_registrations
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS: Updated At
-- ============================================

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_webinars_updated_at
  BEFORE UPDATE ON webinars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
