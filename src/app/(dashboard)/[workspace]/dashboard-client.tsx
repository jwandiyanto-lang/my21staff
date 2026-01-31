'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useEnsureUser } from '@/hooks/use-ensure-user'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { LeadStats } from '@/components/dashboard/lead-stats'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import { BotAnalyticsDashboard } from '@/components/analytics/bot-analytics-dashboard'
import type { Id } from 'convex/_generated/dataModel'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock stats for offline dev mode - matches /api/contacts MOCK_CONTACTS (50 contacts)
const MOCK_STATS = {
  totalContacts: 50,
  totalConversations: 5,
  activeConversations: 3,
  statusBreakdown: {
    new: 7,
    hot: 17,
    warm: 17,
    cold: 9,
    client: 0,
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

  // Ensure current user exists before running queries
  const userInitialized = useEnsureUser()

  // Skip Convex query in dev mode - use mock data
  // Also skip until user is initialized to prevent race conditions
  const convexStats = useQuery(
    api.dashboard.getStats,
    isDevMode || !userInitialized ? 'skip' : { workspace_id: workspaceId as any, time_filter: timeFilter }
  )

  // Check if AI is enabled
  const ariConfig = useQuery(
    api.ari.getAriConfig,
    isDevMode || !userInitialized ? 'skip' : { workspace_id: workspaceId as any }
  )

  const stats = isDevMode ? MOCK_STATS : convexStats
  const aiEnabled = isDevMode ? true : (ariConfig?.enabled !== false)

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

      {/* Lead Stats - Hero position */}
      <LeadStats workspaceId={workspaceId} />

      {/* ARI Analytics (Collapsible) */}
      {aiEnabled && (
        <BotAnalyticsDashboard
          workspaceId={workspaceId as string}
          timeFilter={timeFilter}
        />
      )}

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
