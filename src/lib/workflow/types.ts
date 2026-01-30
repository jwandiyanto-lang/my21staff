// Lead type detection
export type LeadType = 'new' | 'returning';

// Keyword trigger types
export type TriggerAction = 'handoff' | 'manager_bot' | 'faq_response' | 'pass_through';

export interface KeywordTrigger {
  id: string;
  keywords: string[];           // List of keywords to match
  action: TriggerAction;
  response_template?: string;   // For FAQ responses
  case_sensitive: boolean;
  match_mode: 'exact' | 'contains' | 'starts_with';
  enabled: boolean;
}

// FAQ template
export interface FAQTemplate {
  id: string;
  trigger_keywords: string[];
  response: string;
  enabled: boolean;
}

// Rule match result
export interface RuleMatch {
  matched: boolean;
  rule_id: string | null;
  action: TriggerAction;
  response?: string;
  metadata?: Record<string, unknown>;
}

// Workflow configuration (stored in database, configurable via Settings UI)
export interface WorkflowConfig {
  workspace_id: string;
  keyword_triggers: KeywordTrigger[];
  faq_templates: FAQTemplate[];
  lead_routing: {
    new_lead_greeting: string;
    returning_lead_greeting: string;
    detection_window_hours: number;  // Default: 24
  };
  ai_fallback_enabled: boolean;
}

// Rules processing result
export interface RulesResult {
  handled: boolean;              // true = rules handled it, false = pass to AI
  action: TriggerAction;
  response?: string;             // Response to send (if handled)
  lead_type: LeadType;           // new or returning
  matched_rule?: string;         // Which rule matched
  should_handoff?: boolean;      // Trigger handoff flow
  should_trigger_manager?: boolean; // Trigger Grok manager bot
}

// Default configuration (placeholder values - configured in Phase 2.5)
export const DEFAULT_WORKFLOW_CONFIG: Omit<WorkflowConfig, 'workspace_id'> = {
  keyword_triggers: [
    {
      id: 'handoff-trigger',
      keywords: ['human', 'agent', 'speak to person', 'real person'],
      action: 'handoff',
      case_sensitive: false,
      match_mode: 'contains',
      enabled: true,
    },
    {
      id: 'manager-trigger',
      keywords: ['!summary', '!report', '!analysis'],
      action: 'manager_bot',
      case_sensitive: false,
      match_mode: 'starts_with',
      enabled: true,
    },
  ],
  faq_templates: [
    {
      id: 'pricing-faq',
      trigger_keywords: ['harga', 'price', 'pricing', 'biaya', 'cost', 'berapa'],
      response: '[Placeholder: Pricing info - configure in Settings]',
      enabled: true,
    },
    {
      id: 'services-faq',
      trigger_keywords: ['layanan', 'services', 'service', 'apa saja'],
      response: '[Placeholder: Services info - configure in Settings]',
      enabled: true,
    },
    {
      id: 'hours-faq',
      trigger_keywords: ['jam', 'hours', 'buka', 'open', 'tutup', 'close'],
      response: '[Placeholder: Business hours - configure in Settings]',
      enabled: true,
    },
  ],
  lead_routing: {
    new_lead_greeting: '[Placeholder: New lead greeting - configure in Settings]',
    returning_lead_greeting: '[Placeholder: Welcome back message - configure in Settings]',
    detection_window_hours: 24,
  },
  ai_fallback_enabled: true,
};
