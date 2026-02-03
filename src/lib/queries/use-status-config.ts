import { DEFAULT_LEAD_STATUSES, type LeadStatusConfig } from '@/lib/lead-status'

/**
 * Hook to get workspace status configuration.
 *
 * Now returns fixed 4-status configuration (no customization).
 * Simplified from previous version that supported workspace-specific configs.
 */
export function useStatusConfig(_workspaceId: string | undefined) {
  // Always return fixed 4 statuses
  const statuses = DEFAULT_LEAD_STATUSES

  return {
    statuses,
    statusMap: Object.fromEntries(
      statuses.map((s) => [s.key, s])
    ),
    statusKeys: statuses.map((s) => s.key),
    isLoading: false,
  }
}
