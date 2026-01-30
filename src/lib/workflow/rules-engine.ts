import { ConvexHttpClient } from 'convex/browser';
import { api } from 'convex/_generated/api';
import type {
  WorkflowConfig,
  RulesResult,
  LeadType,
  TriggerAction,
} from './types';
import { DEFAULT_WORKFLOW_CONFIG } from './types';
import { matchKeywordTrigger, matchFAQTemplate, isCommand } from './keyword-triggers';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Parameters for rules engine processing
 */
export interface ProcessRulesParams {
  workspaceId: string;
  contactId: string;
  contactPhone: string;
  message: string;
}

/**
 * Detect if contact is new or returning based on conversation history
 * Uses thread-based detection with configurable time window
 */
async function detectLeadType(
  workspaceId: string,
  contactId: string,
  detectionWindowHours: number
): Promise<LeadType> {
  try {
    // Check for existing conversation with recent messages
    const conversation = await convex.query(api.conversations.getByContactInternal, {
      workspace_id: workspaceId,
      contact_id: contactId,
    });

    if (!conversation) {
      return 'new';
    }

    // Check if last message was within detection window
    const lastMessageTime = conversation.last_message_at;
    if (!lastMessageTime) {
      return 'new';
    }

    const windowMs = detectionWindowHours * 60 * 60 * 1000;
    const timeSinceLastMessage = Date.now() - lastMessageTime;

    return timeSinceLastMessage < windowMs ? 'returning' : 'new';
  } catch (error) {
    console.error('[RulesEngine] Failed to detect lead type:', error);
    return 'new'; // Default to new on error
  }
}

/**
 * Get workflow configuration for workspace
 * Falls back to defaults if not configured
 */
async function getWorkflowConfig(workspaceId: string): Promise<WorkflowConfig> {
  try {
    // TODO: Query from database once Settings UI (Phase 2.5) stores config
    // For now, return defaults
    // const config = await convex.query(api.workflows.getConfig, { workspace_id: workspaceId });
    // if (config) return config;

    return {
      workspace_id: workspaceId,
      ...DEFAULT_WORKFLOW_CONFIG,
    };
  } catch (error) {
    console.error('[RulesEngine] Failed to get config:', error);
    return {
      workspace_id: workspaceId,
      ...DEFAULT_WORKFLOW_CONFIG,
    };
  }
}

/**
 * Main rules engine processor
 *
 * Processing order:
 * 1. Detect lead type (new vs returning)
 * 2. Check keyword triggers (handoff, manager bot)
 * 3. Check FAQ templates
 * 4. If no match, pass through to AI
 *
 * @returns RulesResult indicating whether rules handled the message
 */
export async function processWithRules(
  params: ProcessRulesParams
): Promise<RulesResult> {
  const { workspaceId, contactId, message } = params;
  const startTime = Date.now();

  console.log(`[RulesEngine] Processing message for contact ${contactId}`);

  // 1. Get workflow configuration
  const config = await getWorkflowConfig(workspaceId);

  // 2. Detect lead type
  const leadType = await detectLeadType(
    workspaceId,
    contactId,
    config.lead_routing.detection_window_hours
  );
  console.log(`[RulesEngine] Lead type: ${leadType}`);

  // 3. Check keyword triggers (highest priority)
  const triggerMatch = matchKeywordTrigger(message, config.keyword_triggers);

  if (triggerMatch.matched) {
    console.log(`[RulesEngine] Keyword trigger matched: ${triggerMatch.rule_id}`);

    const duration = Date.now() - startTime;
    console.log(`[RulesEngine] Completed in ${duration}ms (keyword trigger)`);

    return {
      handled: true,
      action: triggerMatch.action,
      response: triggerMatch.response,
      lead_type: leadType,
      matched_rule: triggerMatch.rule_id || undefined,
      should_handoff: triggerMatch.action === 'handoff',
      should_trigger_manager: triggerMatch.action === 'manager_bot',
    };
  }

  // 4. Check FAQ templates (second priority)
  const faqMatch = matchFAQTemplate(message, config.faq_templates);

  if (faqMatch.matched) {
    console.log(`[RulesEngine] FAQ template matched: ${faqMatch.rule_id}`);

    const duration = Date.now() - startTime;
    console.log(`[RulesEngine] Completed in ${duration}ms (FAQ template)`);

    return {
      handled: true,
      action: 'faq_response',
      response: faqMatch.response,
      lead_type: leadType,
      matched_rule: faqMatch.rule_id || undefined,
    };
  }

  // 5. No match - pass through to AI
  const duration = Date.now() - startTime;
  console.log(`[RulesEngine] No rule match, passing to AI (${duration}ms)`);

  if (!config.ai_fallback_enabled) {
    // AI fallback disabled - return generic response
    return {
      handled: true,
      action: 'pass_through',
      response: 'Pesan Anda telah diterima. Tim kami akan segera merespons.',
      lead_type: leadType,
    };
  }

  return {
    handled: false,
    action: 'pass_through',
    lead_type: leadType,
  };
}

/**
 * Check if rules engine is enabled for a workspace
 */
export async function isRulesEngineEnabled(workspaceId: string): Promise<boolean> {
  // Always enabled for now - could be workspace setting later
  return true;
}

// Re-export types for convenience
export type { RulesResult, LeadType, TriggerAction };
