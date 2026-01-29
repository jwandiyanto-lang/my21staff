import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { DEFAULT_LEAD_STATUSES, type LeadStatusConfig } from '@/lib/lead-status'

/**
 * Hook to get workspace status configuration with real-time updates.
 *
 * Returns custom status config if set, otherwise returns defaults.
 * Automatically updates when workspace settings change (Convex real-time).
 *
 * Issue #19 fix: Components using this hook will see status changes
 * immediately without page refresh.
 */
export function useStatusConfig(workspaceId: string | undefined) {
  // Dev mode: always return defaults
  const isDevMode = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  const statusConfig = useQuery(
    api.workspaces.getStatusConfig,
    workspaceId && !isDevMode ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'
  )

  // Return defaults if dev mode or data not loaded yet
  if (isDevMode || !statusConfig) {
    return {
      statuses: DEFAULT_LEAD_STATUSES,
      statusMap: Object.fromEntries(
        DEFAULT_LEAD_STATUSES.map((s) => [s.key, s])
      ),
      statusKeys: DEFAULT_LEAD_STATUSES.map((s) => s.key),
      isLoading: !isDevMode && workspaceId !== undefined,
    }
  }

  // Convert array to map for easy lookup
  const statusMap = Object.fromEntries(
    statusConfig.map((s: LeadStatusConfig) => [s.key, s])
  )

  return {
    statuses: statusConfig as LeadStatusConfig[],
    statusMap,
    statusKeys: statusConfig.map((s: LeadStatusConfig) => s.key),
    isLoading: false,
  }
}
