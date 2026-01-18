import { type TicketStage } from './types'
import { VALID_TRANSITIONS, STAGES_ORDER, STAGE_CONFIG } from './constants'

/**
 * Check if a stage transition is valid
 * @param fromStage - Current stage
 * @param toStage - Target stage
 * @param isAdminSkip - Whether this is an admin skipping stages (requires approval)
 */
export function canTransition(
  fromStage: TicketStage,
  toStage: TicketStage,
  isAdminSkip: boolean = false
): boolean {
  // Same stage - no transition needed
  if (fromStage === toStage) return false

  // Reopen from closed
  if (fromStage === 'closed' && toStage === 'report') return true

  // Normal transition to next stage
  if (VALID_TRANSITIONS[fromStage].includes(toStage)) return true

  // Admin skip (any forward progression except from closed)
  if (isAdminSkip && fromStage !== 'closed') {
    const fromIndex = STAGES_ORDER.indexOf(fromStage)
    const toIndex = STAGES_ORDER.indexOf(toStage)
    return toIndex > fromIndex // Can only skip forward
  }

  return false
}

/**
 * Get the next stage in normal progression
 */
export function getNextStage(currentStage: TicketStage): TicketStage | null {
  return STAGE_CONFIG[currentStage].next
}

/**
 * Check if this transition is a skip (not the immediate next stage)
 */
export function isSkipTransition(fromStage: TicketStage, toStage: TicketStage): boolean {
  return !VALID_TRANSITIONS[fromStage].includes(toStage) && fromStage !== 'closed'
}

/**
 * Get all valid target stages for a given stage (for UI dropdown)
 */
export function getValidTargetStages(
  currentStage: TicketStage,
  isAdminOrOwner: boolean
): TicketStage[] {
  if (currentStage === 'closed') {
    return ['report'] // Can only reopen
  }

  const targets: TicketStage[] = []
  const currentIndex = STAGES_ORDER.indexOf(currentStage)

  // Always include next stage
  const next = getNextStage(currentStage)
  if (next) targets.push(next)

  // Admin can skip to any later stage
  if (isAdminOrOwner) {
    for (let i = currentIndex + 2; i < STAGES_ORDER.length; i++) {
      targets.push(STAGES_ORDER[i])
    }
  }

  return targets
}
