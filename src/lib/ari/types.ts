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

// Note: STATE_TRANSITIONS is now defined in state-machine.ts
// with enhanced transition rules (e.g., qualifying can stay in qualifying)

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
  basic_score: number;        // 0-25: Form completeness, email validity, country
  qualification_score: number; // 0-35: English level, budget, timeline, program
  document_score: number;     // 0-30: Passport, CV, english_test, transcript
  engagement_score: number;   // 0-10: Conversation quality
  total: number;              // 0-100: Sum of all scores
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
  /** Scheduling flow sub-state */
  scheduling_step?: 'asking_day' | 'showing_slots' | 'confirming' | 'booked';
  /** Selected day for scheduling */
  selected_day?: number;
  /** Available slots for selected day */
  available_slots?: Array<{
    date: string;
    start_time: string;
    duration_minutes: number;
    slot_id: string;
  }>;
  /** Selected slot index (0-based) */
  selected_slot_index?: number;
  /** Selected slot details for confirmation */
  selected_slot?: {
    date: string;
    start_time: string;
    duration_minutes: number;
    slot_id: string;
  };
  /** Available days summary for display */
  available_days_summary?: string;
  /** Slots summary for display */
  slots_summary?: string;
  /** Booked appointment ID */
  appointment_id?: string;
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

// ===========================================
// Consultant Slot Types (for scheduling)
// ===========================================

/** Weekly availability slot for consultations */
export interface ConsultantSlot {
  id: string;
  workspace_id: string;
  consultant_id: string | null;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string; // HH:MM:SS format
  end_time: string;
  duration_minutes: number;
  booking_window_days: number;
  max_bookings_per_slot: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ConsultantSlotInsert = Omit<ConsultantSlot, 'id' | 'created_at' | 'updated_at'>;
export type ConsultantSlotUpdate = Partial<Omit<ConsultantSlot, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>;

/** Available time slot for a specific date (computed from ConsultantSlot) */
export interface AvailableSlot {
  date: string; // YYYY-MM-DD
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  consultant_id: string | null;
  slot_id: string; // Reference to ConsultantSlot
  booked: boolean;
}

// ===========================================
// Knowledge Base Types (for Database tab)
// ===========================================

/** Knowledge category for organizing entries (ari_knowledge_categories table) */
export interface KnowledgeCategory {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Knowledge entry with title and content (ari_knowledge_entries table) */
export interface KnowledgeEntry {
  id: string;
  workspace_id: string;
  category_id: string | null;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type KnowledgeCategoryInsert = Omit<KnowledgeCategory, 'id' | 'created_at' | 'updated_at'>;
export type KnowledgeCategoryUpdate = Partial<Omit<KnowledgeCategory, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>;

export type KnowledgeEntryInsert = Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>;
export type KnowledgeEntryUpdate = Partial<Omit<KnowledgeEntry, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>;

// ===========================================
// Scoring Config Types
// ===========================================

/** Scoring configuration per workspace (ari_scoring_config table) */
export interface ScoringConfig {
  id: string;
  workspace_id: string;
  hot_threshold: number;   // Score >= this = hot lead (default 70)
  warm_threshold: number;  // Score >= this = warm lead (default 40)
  weight_basic: number;         // Points for basic data (default 25)
  weight_qualification: number; // Points for qualification (default 35)
  weight_document: number;      // Points for documents (default 30)
  weight_engagement: number;    // Points for engagement (default 10)
  created_at: string;
  updated_at: string;
}

export type ScoringConfigInsert = Omit<ScoringConfig, 'id' | 'created_at' | 'updated_at'>;
export type ScoringConfigUpdate = Partial<Omit<ScoringConfig, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>;

/** Default scoring config values (used when no config exists) */
export const DEFAULT_SCORING_CONFIG = {
  hot_threshold: 70,
  warm_threshold: 40,
  weight_basic: 25,
  weight_qualification: 35,
  weight_document: 30,
  weight_engagement: 10,
} as const;

// ===========================================
// Flow Stage Types (for Flow tab)
// ===========================================

/** Custom conversation flow stage (ari_flow_stages table) */
export interface FlowStage {
  id: string;
  workspace_id: string;
  name: string;
  goal: string;
  sample_script: string | null;
  exit_criteria: string | null;
  stage_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FlowStageInsert = Omit<FlowStage, 'id' | 'created_at' | 'updated_at'>;
export type FlowStageUpdate = Partial<Omit<FlowStage, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>;

/** Default flow stages (used when no custom stages exist) */
export const DEFAULT_FLOW_STAGES: Array<Omit<FlowStage, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>> = [
  {
    name: 'Greeting',
    goal: 'Welcome lead, establish rapport',
    sample_script: null,
    exit_criteria: 'Lead responds',
    stage_order: 0,
    is_active: true,
  },
  {
    name: 'Qualifying',
    goal: 'Gather key info: destination, budget, timeline',
    sample_script: null,
    exit_criteria: 'All required fields collected',
    stage_order: 1,
    is_active: true,
  },
  {
    name: 'Scoring',
    goal: 'Assess lead readiness based on collected data',
    sample_script: null,
    exit_criteria: 'Score calculated, routing determined',
    stage_order: 2,
    is_active: true,
  },
  {
    name: 'Booking',
    goal: 'Offer consultation for hot leads',
    sample_script: null,
    exit_criteria: 'Lead accepts or declines',
    stage_order: 3,
    is_active: true,
  },
  {
    name: 'Scheduling',
    goal: 'Book consultation time slot',
    sample_script: null,
    exit_criteria: 'Appointment confirmed',
    stage_order: 4,
    is_active: true,
  },
  {
    name: 'Handoff',
    goal: 'Transfer to human consultant',
    sample_script: null,
    exit_criteria: 'Consultant takes over',
    stage_order: 5,
    is_active: true,
  },
];
