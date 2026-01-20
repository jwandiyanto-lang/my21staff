-- ARI (AI Receptionist Indonesia) Tables Migration
-- Creates tables for bot configuration, knowledge base, conversation tracking, payments, and appointments

-- ============================================
-- ARI_CONFIG (DB-01) - Bot persona settings per workspace
-- ============================================
CREATE TABLE ari_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  bot_name VARCHAR(100) DEFAULT 'ARI',
  greeting_style VARCHAR(50) DEFAULT 'professional', -- casual, formal, professional
  language VARCHAR(10) DEFAULT 'id',
  tone JSONB DEFAULT '{"supportive": true, "clear": true, "encouraging": true}',
  community_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id) -- One config per workspace
);

-- ============================================
-- ARI_DESTINATIONS (DB-02) - University/destination knowledge base
-- ============================================
CREATE TABLE ari_destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  university_name VARCHAR(255) NOT NULL,
  requirements JSONB DEFAULT '{}', -- ielts_min, gpa_min, budget_min, budget_max, deadline
  programs TEXT[] DEFAULT '{}',
  is_promoted BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, country, city, university_name)
);

-- ============================================
-- ARI_CONVERSATIONS (DB-03) - ARI conversation state tracking
-- ============================================
CREATE TABLE ari_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL, -- Link to inbox conversation (nullable)

  -- State machine
  state VARCHAR(50) DEFAULT 'greeting', -- greeting, qualifying, scoring, booking, payment, scheduling, handoff, completed
  lead_score INTEGER DEFAULT 0,
  lead_temperature VARCHAR(20), -- hot, warm, cold

  -- Context
  context JSONB DEFAULT '{}', -- Collected info: name, form_data, document_status, etc.
  ai_model VARCHAR(50), -- grok, sea-lion
  last_ai_message_at TIMESTAMPTZ,
  handoff_at TIMESTAMPTZ,
  handoff_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, contact_id) -- One ARI conversation per contact per workspace
);

-- ============================================
-- ARI_MESSAGES (DB-04) - ARI message log with AI model info
-- ============================================
CREATE TABLE ari_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ari_conversation_id UUID NOT NULL REFERENCES ari_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  role VARCHAR(20) NOT NULL, -- assistant, user, system
  content TEXT NOT NULL,

  -- AI tracking
  ai_model VARCHAR(50), -- Which model generated this (null for user messages)
  tokens_used INTEGER,
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ARI_PAYMENTS (DB-05) - Payment records with Midtrans integration
-- ============================================
CREATE TABLE ari_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ari_conversation_id UUID NOT NULL REFERENCES ari_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Amount
  amount INTEGER NOT NULL, -- In smallest currency unit (e.g., cents for IDR would be just IDR integer)
  currency VARCHAR(3) DEFAULT 'IDR',

  -- Payment method
  payment_method VARCHAR(50), -- qris, gopay, ovo, bank_transfer, card
  gateway VARCHAR(50) DEFAULT 'midtrans',
  gateway_transaction_id VARCHAR(255),
  gateway_response JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed, expired, refunded
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ARI_APPOINTMENTS (DB-06) - Consultation scheduling
-- ============================================
CREATE TABLE ari_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ari_conversation_id UUID NOT NULL REFERENCES ari_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES ari_payments(id) ON DELETE SET NULL, -- Optional: link to payment
  consultant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Assigned consultant

  -- Schedule
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  reminder_sent_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ARI_AI_COMPARISON (DB-07) - A/B testing metrics for AI models
-- ============================================
CREATE TABLE ari_ai_comparison (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  ai_model VARCHAR(50) NOT NULL, -- grok, sea-lion
  conversation_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  total_tokens_used INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0, -- Leads that converted to paid
  satisfaction_score DECIMAL(3,2), -- 0.00-5.00

  -- Period tracking
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, ai_model, period_start)
);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE ari_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ari_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ari_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ari_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ari_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ari_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ari_ai_comparison ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (using optimized SELECT wrapper pattern)
-- ============================================

-- ari_config policies
CREATE POLICY "Users can view ari_config in their workspaces" ON ari_config
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert ari_config in their workspaces" ON ari_config
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update ari_config in their workspaces" ON ari_config
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- ari_destinations policies
CREATE POLICY "Users can view ari_destinations in their workspaces" ON ari_destinations
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert ari_destinations in their workspaces" ON ari_destinations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update ari_destinations in their workspaces" ON ari_destinations
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete ari_destinations in their workspaces" ON ari_destinations
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- ari_conversations policies
CREATE POLICY "Users can view ari_conversations in their workspaces" ON ari_conversations
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert ari_conversations in their workspaces" ON ari_conversations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update ari_conversations in their workspaces" ON ari_conversations
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- ari_messages policies
CREATE POLICY "Users can view ari_messages in their workspaces" ON ari_messages
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert ari_messages in their workspaces" ON ari_messages
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- ari_payments policies
CREATE POLICY "Users can view ari_payments in their workspaces" ON ari_payments
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert ari_payments in their workspaces" ON ari_payments
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update ari_payments in their workspaces" ON ari_payments
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- ari_appointments policies
CREATE POLICY "Users can view ari_appointments in their workspaces" ON ari_appointments
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert ari_appointments in their workspaces" ON ari_appointments
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update ari_appointments in their workspaces" ON ari_appointments
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- ari_ai_comparison policies
CREATE POLICY "Users can view ari_ai_comparison in their workspaces" ON ari_ai_comparison
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert ari_ai_comparison in their workspaces" ON ari_ai_comparison
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update ari_ai_comparison in their workspaces" ON ari_ai_comparison
  FOR UPDATE USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- UPDATED_AT TRIGGERS (for tables that need it)
-- ============================================

CREATE TRIGGER update_ari_config_updated_at
  BEFORE UPDATE ON ari_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ari_destinations_updated_at
  BEFORE UPDATE ON ari_destinations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ari_conversations_updated_at
  BEFORE UPDATE ON ari_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ari_payments_updated_at
  BEFORE UPDATE ON ari_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ari_appointments_updated_at
  BEFORE UPDATE ON ari_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ari_ai_comparison_updated_at
  BEFORE UPDATE ON ari_ai_comparison
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- ari_config: lookup by workspace
CREATE INDEX idx_ari_config_workspace ON ari_config(workspace_id);

-- ari_destinations: search by country, promoted items
CREATE INDEX idx_ari_destinations_workspace ON ari_destinations(workspace_id);
CREATE INDEX idx_ari_destinations_country ON ari_destinations(workspace_id, country);
CREATE INDEX idx_ari_destinations_promoted ON ari_destinations(workspace_id, is_promoted) WHERE is_promoted = true;

-- ari_conversations: active conversations, by contact
CREATE INDEX idx_ari_conversations_workspace ON ari_conversations(workspace_id);
CREATE INDEX idx_ari_conversations_contact ON ari_conversations(contact_id);
CREATE INDEX idx_ari_conversations_state ON ari_conversations(workspace_id, state);

-- ari_messages: by conversation, chronological
CREATE INDEX idx_ari_messages_conversation ON ari_messages(ari_conversation_id);
CREATE INDEX idx_ari_messages_workspace ON ari_messages(workspace_id);
CREATE INDEX idx_ari_messages_created ON ari_messages(created_at DESC);

-- ari_payments: by status, pending payments
CREATE INDEX idx_ari_payments_conversation ON ari_payments(ari_conversation_id);
CREATE INDEX idx_ari_payments_workspace ON ari_payments(workspace_id);
CREATE INDEX idx_ari_payments_status ON ari_payments(workspace_id, status);
CREATE INDEX idx_ari_payments_pending ON ari_payments(workspace_id, status, expires_at) WHERE status = 'pending';

-- ari_appointments: upcoming appointments
CREATE INDEX idx_ari_appointments_conversation ON ari_appointments(ari_conversation_id);
CREATE INDEX idx_ari_appointments_workspace ON ari_appointments(workspace_id);
CREATE INDEX idx_ari_appointments_scheduled ON ari_appointments(workspace_id, scheduled_at);
CREATE INDEX idx_ari_appointments_consultant ON ari_appointments(consultant_id) WHERE consultant_id IS NOT NULL;

-- ari_ai_comparison: by model and period
CREATE INDEX idx_ari_ai_comparison_workspace ON ari_ai_comparison(workspace_id);
CREATE INDEX idx_ari_ai_comparison_model ON ari_ai_comparison(workspace_id, ai_model);
