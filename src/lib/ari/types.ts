/**
 * ARI (AI Receptionist Indonesia) Type Definitions
 *
 * Matches database schema from 34_ari_tables.sql
 */

// ===========================================
// AI Model Types
// ===========================================

/** Supported AI models for ARI conversations */
export type AIModelType = 'grok' | 'sealion';

/** Response from AI model */
export interface AIResponse {
  content: string;
  tokens: number | null;
  responseTimeMs: number;
  model: AIModelType;
}

// ===========================================
// State Machine
// ===========================================

/**
 * ARI conversation states following the lead journey:
 *
 * greeting    - Initial welcome, establish rapport
 * qualifying  - Gather lead information (destination, budget, timeline)
 * scoring     - Calculate lead score based on collected data
 * booking     - Offer consultation booking
 * payment     - Process payment via Midtrans
 * scheduling  - Confirm appointment time
 * handoff     - Transfer to human consultant
 * completed   - Conversation finished
 */
export type ARIState =
  | 'greeting'
  | 'qualifying'
  | 'scoring'
  | 'booking'
  | 'payment'
  | 'scheduling'
  | 'handoff'
  | 'completed';

/** Lead temperature based on score and engagement */
export type LeadTemperature = 'hot' | 'warm' | 'cold';

/** Valid state transitions map */
export const STATE_TRANSITIONS: Record<ARIState, ARIState[]> = {
  greeting: ['qualifying', 'handoff'],
  qualifying: ['scoring', 'handoff'],
  scoring: ['booking', 'handoff'],
  booking: ['payment', 'handoff'],
  payment: ['scheduling', 'handoff'],
  scheduling: ['handoff', 'completed'],
  handoff: ['completed'],
  completed: [],
};

// ===========================================
// Context Types (JSONB fields)
// ===========================================

/** Collected lead data during qualifying phase */
export interface LeadData {
  name?: string;
  email?: string;
  destination_country?: string;
  destination_city?: string;
  target_program?: string;
  budget_range?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  timeline?: string;
  ielts_score?: number;
  gpa?: number;
  has_documents?: boolean;
  notes?: string;
}

/** Score breakdown from scoring phase */
export interface ScoreBreakdown {
  budget_score: number;
  readiness_score: number;
  engagement_score: number;
  qualification_score: number;
  total: number;
}

/** ARI conversation context (stored in JSONB) */
export interface ARIContext {
  /** Collected lead information */
  lead_data?: LeadData;
  /** Score calculation breakdown */
  score_breakdown?: ScoreBreakdown;
  /** Form data from external sources */
  form_data?: Record<string, unknown>;
  /** Documents status */
  document_status?: {
    ielts?: boolean;
    transcript?: boolean;
    passport?: boolean;
  };
  /** Handoff notes for human consultant */
  handoff_notes?: string;
  /** Any additional metadata */
  [key: string]: unknown;
}

/** ARI config tone settings */
export interface ARITone {
  supportive?: boolean;
  clear?: boolean;
  encouraging?: boolean;
  [key: string]: boolean | undefined;
}

// ===========================================
// Database Interfaces
// ===========================================

/** ARI bot configuration per workspace (ari_config table) */
export interface ARIConfig {
  id: string;
  workspace_id: string;
  bot_name: string;
  greeting_style: 'casual' | 'formal' | 'professional';
  language: string;
  tone: ARITone;
  community_link: string | null;
  created_at: string;
  updated_at: string;
}

/** ARI destination/university knowledge base (ari_destinations table) */
export interface ARIDestination {
  id: string;
  workspace_id: string;
  country: string;
  city: string | null;
  university_name: string;
  requirements: {
    ielts_min?: number;
    gpa_min?: number;
    budget_min?: number;
    budget_max?: number;
    deadline?: string;
  };
  programs: string[];
  is_promoted: boolean;
  priority: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** ARI conversation state tracking (ari_conversations table) */
export interface ARIConversation {
  id: string;
  workspace_id: string;
  contact_id: string;
  conversation_id: string | null;
  state: ARIState;
  lead_score: number;
  lead_temperature: LeadTemperature | null;
  context: ARIContext;
  ai_model: AIModelType | null;
  last_ai_message_at: string | null;
  handoff_at: string | null;
  handoff_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** ARI message log (ari_messages table) */
export interface ARIMessage {
  id: string;
  ari_conversation_id: string;
  workspace_id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  ai_model: AIModelType | null;
  tokens_used: number | null;
  response_time_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** ARI payment record (ari_payments table) */
export interface ARIPayment {
  id: string;
  ari_conversation_id: string;
  workspace_id: string;
  amount: number;
  currency: string;
  payment_method: 'qris' | 'gopay' | 'ovo' | 'bank_transfer' | 'card' | null;
  gateway: string;
  gateway_transaction_id: string | null;
  gateway_response: Record<string, unknown> | null;
  status: 'pending' | 'success' | 'failed' | 'expired' | 'refunded';
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/** ARI appointment record (ari_appointments table) */
export interface ARIAppointment {
  id: string;
  ari_conversation_id: string;
  workspace_id: string;
  payment_id: string | null;
  consultant_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reminder_sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** ARI A/B testing metrics (ari_ai_comparison table) */
export interface ARIAIComparison {
  id: string;
  workspace_id: string;
  ai_model: AIModelType;
  conversation_count: number;
  avg_response_time_ms: number | null;
  total_tokens_used: number;
  conversion_count: number;
  satisfaction_score: number | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  updated_at: string;
}

// ===========================================
// Insert/Update Types (for database operations)
// ===========================================

export type ARIConfigInsert = Omit<ARIConfig, 'id' | 'created_at' | 'updated_at'>;
export type ARIConfigUpdate = Partial<Omit<ARIConfig, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>;

export type ARIConversationInsert = Omit<ARIConversation, 'id' | 'created_at' | 'updated_at'>;
export type ARIConversationUpdate = Partial<Omit<ARIConversation, 'id' | 'workspace_id' | 'contact_id' | 'created_at' | 'updated_at'>>;

export type ARIMessageInsert = Omit<ARIMessage, 'id' | 'created_at'>;
