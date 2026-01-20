/**
 * ARI State Machine
 *
 * Manages conversation state transitions for the ARI lead journey.
 * States flow from greeting through to completion or handoff.
 */

import type { ARIState, ARIContext } from './types';

/**
 * Valid state transitions for ARI conversations
 *
 * Each state maps to an array of states it can transition to.
 * Note: Handoff is always allowed as an escape hatch (checked separately).
 */
export const STATE_TRANSITIONS: Record<ARIState, ARIState[]> = {
  greeting: ['qualifying'],
  qualifying: ['scoring', 'qualifying'], // Can stay to collect more info
  scoring: ['booking', 'handoff'],
  booking: ['scheduling', 'handoff'], // Direct to scheduling (payment skipped in v2.2)
  payment: ['scheduling', 'payment', 'handoff'], // Keep for future use
  scheduling: ['handoff', 'scheduling'], // Can reschedule
  handoff: ['completed'],
  completed: [],
};

/**
 * Check if a state transition is valid
 *
 * Always allows transition to 'handoff' as an escape hatch,
 * regardless of current state. This ensures human takeover
 * is always possible.
 *
 * @param from - Current conversation state
 * @param to - Target state to transition to
 * @returns true if transition is valid
 *
 * @example
 * ```ts
 * canTransition('greeting', 'qualifying') // true - normal flow
 * canTransition('greeting', 'payment')    // false - can't skip
 * canTransition('payment', 'handoff')     // true - escape hatch
 * canTransition('completed', 'handoff')   // true - escape always works
 * ```
 */
export function canTransition(from: ARIState, to: ARIState): boolean {
  // Escape hatch: Always allow transition to handoff
  if (to === 'handoff') {
    return true;
  }

  // Check if transition is in allowed list
  return STATE_TRANSITIONS[from].includes(to);
}

/**
 * Minimum lead score to progress from qualifying to scoring
 * Lead needs enough data to calculate a meaningful score
 */
const MIN_SCORE_FOR_SCORING = 40;

/**
 * Minimum lead score to be considered "hot" and offered booking
 * Hot leads are ready and likely to convert
 */
const HOT_LEAD_THRESHOLD = 70;

/**
 * Maximum messages for warm leads in scoring before handoff
 * Prevents warm leads from staying in nurturing forever
 */
const WARM_LEAD_MAX_MESSAGES = 5;

/**
 * Routing actions that can be passed to state machine
 */
export type RoutingActionType =
  | 'handoff_hot'
  | 'handoff_warm'
  | 'send_community_cold'
  | 'continue_qualifying'
  | 'continue_nurturing';

/**
 * Determine the next state based on current context and lead score
 *
 * This function encodes the business logic for state progression:
 * - greeting: Always moves to qualifying
 * - qualifying: Moves to scoring when enough data collected, or when routing says complete
 * - scoring: Hot/cold leads go to handoff, warm leads can stay for nurturing
 * - booking/payment/scheduling: Stay until user action
 * - handoff: Only transitions to completed
 *
 * @param current - Current conversation state
 * @param context - ARI context with collected lead data
 * @param leadScore - Current calculated lead score (0-100)
 * @param routingAction - Optional routing action from determineRouting
 * @returns Recommended next state
 *
 * @example
 * ```ts
 * // New conversation
 * getNextState('greeting', {}, 0) // 'qualifying'
 *
 * // Lead with good data
 * getNextState('qualifying', { lead_data: {...} }, 75) // 'scoring'
 *
 * // Hot lead with routing action
 * getNextState('scoring', {}, 80, 'handoff_hot') // 'handoff'
 *
 * // Cold lead with routing action
 * getNextState('scoring', {}, 30, 'send_community_cold') // 'handoff'
 * ```
 */
export function getNextState(
  current: ARIState,
  context: ARIContext,
  leadScore: number,
  routingAction?: RoutingActionType
): ARIState {
  switch (current) {
    case 'greeting':
      // Always progress to qualifying after greeting
      return 'qualifying';

    case 'qualifying':
      // If routing says we're done qualifying (hot or cold), move to scoring
      if (routingAction === 'handoff_hot' || routingAction === 'send_community_cold') {
        return 'scoring';
      }
      // Need minimum data to move to scoring
      if (leadScore >= MIN_SCORE_FOR_SCORING) {
        return 'scoring';
      }
      // Stay in qualifying to collect more
      return 'qualifying';

    case 'scoring':
      // All paths from scoring lead to handoff or booking
      // Hot leads: handoff to human who will send consultation offer
      // Cold leads: already sent community link, now handoff
      if (routingAction === 'handoff_hot' || routingAction === 'send_community_cold') {
        return 'handoff';
      }
      // Warm leads continue nurturing (stay in scoring for now, will handoff eventually)
      if (routingAction === 'continue_nurturing' && leadScore < HOT_LEAD_THRESHOLD) {
        return 'scoring';  // Can stay to answer more questions
      }
      // Default: hot leads go to booking, others to handoff
      if (leadScore >= HOT_LEAD_THRESHOLD) {
        return 'booking';
      }
      return 'handoff';

    case 'booking':
      // Hot lead accepted booking offer, move to scheduling
      // Note: Payment integration skipped in v2.2, going direct to scheduling
      return 'scheduling';

    case 'payment':
      // Payment state transitions handled by webhook, not AI
      // Stay until payment success/failure
      return 'payment';

    case 'scheduling':
      // Stay until appointment confirmed
      return 'scheduling';

    case 'handoff':
      // Only way out is completion
      return 'completed';

    case 'completed':
      // Terminal state
      return 'completed';

    default:
      // TypeScript exhaustive check
      const _exhaustive: never = current;
      return _exhaustive;
  }
}

/**
 * Maximum messages in a single state before auto-handoff
 * Prevents infinite loops where AI can't progress
 */
const MAX_MESSAGES_PER_STATE = 10;

/**
 * Check if conversation should auto-handoff due to being stuck
 *
 * If a conversation has too many messages in the same state,
 * it likely means the AI is struggling to progress the lead.
 * Human intervention is needed.
 *
 * @param state - Current conversation state
 * @param messageCount - Number of messages in current state
 * @returns true if auto-handoff recommended
 *
 * @example
 * ```ts
 * shouldAutoHandoff('qualifying', 5)  // false - still progressing
 * shouldAutoHandoff('qualifying', 12) // true - stuck too long
 * shouldAutoHandoff('completed', 20)  // false - completed is terminal
 * ```
 */
export function shouldAutoHandoff(state: ARIState, messageCount: number): boolean {
  // Don't auto-handoff from terminal states
  if (state === 'completed' || state === 'handoff') {
    return false;
  }

  // Trigger handoff if stuck too long in same state
  return messageCount > MAX_MESSAGES_PER_STATE;
}

/**
 * Get human-readable state description in Indonesian
 *
 * @param state - ARI state
 * @returns Indonesian description of the state
 */
export function getStateDescription(state: ARIState): string {
  const descriptions: Record<ARIState, string> = {
    greeting: 'Perkenalan awal',
    qualifying: 'Mengumpulkan informasi',
    scoring: 'Menilai kesiapan',
    booking: 'Menawarkan konsultasi',
    payment: 'Proses pembayaran',
    scheduling: 'Mengatur jadwal',
    handoff: 'Dialihkan ke konsultan',
    completed: 'Selesai',
  };
  return descriptions[state];
}
