'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import type { Id } from 'convex/_generated/dataModel'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock stats for offline dev mode - matches /api/contacts MOCK_CONTACTS
const MOCK_STATS = {
  totalContacts: 5,
  totalConversations: 2,
  activeConversations: 2,
  statusBreakdown: {
    new: 1,
    hot: 2,
    warm: 1,
    cold: 1,
    won: 0,
    lost: 0,
  },
  hasContacts: true,
  hasConversations: true,
  hasKapsoConnected: true,
}

interface DashboardClientProps {
  workspaceId: Id<'workspaces'>
  workspaceSlug: string
}

export function DashboardClient({ workspaceId, workspaceSlug }: DashboardClientProps) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('all')

  // Skip Convex query in dev mode - use mock data
  const convexStats = useQuery(
    api.dashboard.getStats,
    isDevMode ? 'skip' : { workspace_id: workspaceId as any, time_filter: timeFilter }
  )

  const stats = isDevMode ? MOCK_STATS : convexStats

  if (stats === undefined) {
    return <DashboardSkeleton />
  }

  // Check if workspace is onboarded
  const isOnboarded = stats.hasContacts && stats.hasConversations && stats.hasKapsoConnected

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <StatsCards
        stats={stats}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
      />

      {/* Quick Actions - disabled for now */}
      {/* <QuickActions workspaceSlug={workspaceSlug} /> */}

      {/* Onboarding Checklist (for new workspaces) */}
      {!isOnboarded && (
        <OnboardingChecklist workspaceSlug={workspaceSlug} stats={stats} />
      )}

      {/* Activity Feed (for active workspaces) */}
      {isOnboarded && (
        <ActivityFeed workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
      )}
    </div>
  )
}
