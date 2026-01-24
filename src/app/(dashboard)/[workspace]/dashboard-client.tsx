'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { QuickActions } from '@/components/dashboard/quick-actions'
import type { Id } from 'convex/_generated/dataModel'

interface DashboardClientProps {
  workspaceId: Id<'workspaces'>
  workspaceSlug: string
}

export function DashboardClient({ workspaceId, workspaceSlug }: DashboardClientProps) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('all')

  const stats = useQuery(api.dashboard.getStats, {
    workspace_id: workspaceId as any,
    time_filter: timeFilter,
  })

  if (stats === undefined) {
    return <DashboardSkeleton />
  }

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

      {/* Quick Actions */}
      <QuickActions workspaceSlug={workspaceSlug} />

      {/* Activity Feed - Placeholder for Plan 03 */}
      <div className="border border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-muted-foreground">
        <p>Activity feed akan ditambahkan di Plan 03</p>
      </div>
    </div>
  )
}
