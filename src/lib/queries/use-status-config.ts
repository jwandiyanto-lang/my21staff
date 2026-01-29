import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { DEFAULT_LEAD_STATUSES, type LeadStatusConfig } from '@/lib/lead-status'
import { getMockWorkspaceSettings } from '@/lib/mock-data'
import { useState, useEffect } from 'react'

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
  // Dev mode: read from mock workspace settings
  const isDevMode = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  // Listen for mock settings changes in dev mode
  const [mockSettings, setMockSettings] = useState(() =>
    isDevMode ? getMockWorkspaceSettings() : null
  )

  useEffect(() => {
    if (!isDevMode) return

    const handleUpdate = (e: CustomEvent) => {
      setMockSettings(e.detail)
    }

    window.addEventListener('mockWorkspaceSettingsUpdated', handleUpdate as EventListener)
    return () => {
      window.removeEventListener('mockWorkspaceSettingsUpdated', handleUpdate as EventListener)
    }
  }, [isDevMode])

  const statusConfig = useQuery(
    api.workspaces.getStatusConfig,
    workspaceId && !isDevMode ? { workspaceId: workspaceId as Id<'workspaces'> } : 'skip'
  )

  // In dev mode, use mock settings
  if (isDevMode) {
    const statuses = mockSettings?.lead_statuses || DEFAULT_LEAD_STATUSES
    return {
      statuses,
      statusMap: Object.fromEntries(
        statuses.map((s) => [s.key, s])
      ),
      statusKeys: statuses.map((s) => s.key),
      isLoading: false,
    }
  }

  // Return defaults if data not loaded yet
  if (!statusConfig) {
    return {
      statuses: DEFAULT_LEAD_STATUSES,
      statusMap: Object.fromEntries(
        DEFAULT_LEAD_STATUSES.map((s) => [s.key, s])
      ),
      statusKeys: DEFAULT_LEAD_STATUSES.map((s) => s.key),
      isLoading: workspaceId !== undefined,
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
