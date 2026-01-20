/**
 * ARI Routing Module
 *
 * Determines routing actions based on lead score and qualification status.
 * Routes leads to appropriate next steps: continue qualifying, handoff to human,
 * or nurturing flow.
 */

import type { LeadTemperature } from './types';
import type { DocumentStatus } from './qualification';
import { hasAllRequiredFields, allDocumentsAsked } from './qualification';

// ===========================================
// Type Definitions
// ===========================================

export type RoutingAction =
  | 'continue_qualifying'  // Need more info
  | 'handoff_hot'          // Hot lead -> human sends consultation offer
  | 'handoff_warm'         // Warm lead -> ARI continues nurturing
  | 'send_community_cold'  // Cold lead -> send community link, then handoff
  | 'continue_nurturing';  // Warm lead in nurturing mode

export interface RoutingDecision {
  action: RoutingAction;
  temperature: LeadTemperature;
  score: number;
  readyForRouting: boolean;  // All required fields + documents collected
  message?: string;          // Optional message to send
  handoffNotes?: string;     // Notes for human consultant
}

// ===========================================
// Main Routing Function
// ===========================================

/**
 * Determine routing action based on score and qualification status
 *
 * Key rule: Routing only triggers AFTER qualification is complete
 * (all required fields gathered AND all documents asked)
 *
 * @param score - Lead score (0-100)
 * @param temperature - Lead temperature (hot/warm/cold)
 * @param formAnswers - Form answers record
 * @param documents - Document status or undefined
 * @param communityLink - Community WhatsApp link or null
 * @returns Routing decision with action and notes
 *
 * @example
 * ```ts
 * const decision = determineRouting(75, 'hot', { name: 'Budi', ... }, docs, null);
 * // { action: 'handoff_hot', temperature: 'hot', score: 75, readyForRouting: true, ... }
 * ```
 */
export function determineRouting(
  score: number,
  temperature: LeadTemperature,
  formAnswers: Record<string, string>,
  documents: DocumentStatus | undefined,
  communityLink: string | null
): RoutingDecision {
  // Check if qualification is complete
  const hasRequiredFields = hasAllRequiredFields(formAnswers);
  const documentsComplete = documents ? allDocumentsAsked(documents) : false;
  const readyForRouting = hasRequiredFields && documentsComplete;

  // Not ready for routing yet - continue qualifying
  if (!readyForRouting) {
    return {
      action: 'continue_qualifying',
      temperature,
      score,
      readyForRouting: false,
    };
  }

  // Ready for routing - determine action based on temperature
  if (temperature === 'hot') {
    return {
      action: 'handoff_hot',
      temperature,
      score,
      readyForRouting: true,
      handoffNotes: `Hot lead (score: ${score}). Ready for consultation offer.`,
    };
  }

  if (temperature === 'warm') {
    return {
      action: 'continue_nurturing',
      temperature,
      score,
      readyForRouting: true,
      // Warm leads: ARI continues conversation, tries to qualify further
    };
  }

  // Cold lead - send community link then handoff
  const communityMessage = communityLink
    ? `Tetap terhubung dengan kami di grup WhatsApp ini ya kak: ${communityLink}. Nanti kalau ada pertanyaan atau update, bisa langsung diskusi di sana.`
    : null;

  return {
    action: 'send_community_cold',
    temperature,
    score,
    readyForRouting: true,
    message: communityMessage || undefined,
    handoffNotes: `Cold lead (score: ${score}). Community link ${communityLink ? 'sent' : 'not configured'}. Follow up in 30 days.`,
  };
}

// ===========================================
// Temperature to Lead Status Mapping
// ===========================================

/**
 * Map lead temperature to lead_status for CRM
 *
 * @param temperature - Lead temperature (hot/warm/cold)
 * @returns Lead status string for contacts table
 *
 * @example
 * ```ts
 * temperatureToLeadStatus('hot') // 'hot_lead'
 * temperatureToLeadStatus('warm') // 'prospect'
 * temperatureToLeadStatus('cold') // 'cold_lead'
 * ```
 */
export function temperatureToLeadStatus(temperature: LeadTemperature): string {
  switch (temperature) {
    case 'hot': return 'hot_lead';
    case 'warm': return 'prospect';  // Warm stays as prospect until converted
    case 'cold': return 'cold_lead';
  }
}
