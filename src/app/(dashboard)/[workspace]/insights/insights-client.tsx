'use client'

import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { DailySummaryCard } from '@/components/insights/daily-summary-card'
import { ActionItemsList } from '@/components/insights/action-items-list'
import { PatternInsights } from '@/components/insights/pattern-insights'
import { LeadQualityOverview } from '@/components/insights/lead-quality-overview'
import {
  MOCK_BRAIN_SUMMARY,
  MOCK_BRAIN_ACTIONS,
  MOCK_BRAIN_INSIGHTS,
  MOCK_LEAD_STATS,
} from '@/lib/mock-data'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

interface InsightsContentProps {
  workspaceSlug: string
}

export function InsightsContent({ workspaceSlug }: InsightsContentProps) {
  // In production, resolve workspace ID from slug
  // For now, use mock workspace ID
  const workspaceId = 'demo' as Id<'workspaces'>

  const summary = useQuery(
    api.brainSummaries.getLatestSummary,
    isDevMode ? 'skip' : { workspaceId }
  )
  const actions = useQuery(
    api.brainActions.getActionsByWorkspace,
    isDevMode ? 'skip' : { workspaceId, status: 'pending', limit: 10 }
  )
  const insights = useQuery(
    api.brainInsights.getInsightsByWorkspace,
    isDevMode ? 'skip' : { workspaceId, limit: 10 }
  )
  const leadStats = useQuery(
    api.leads.getLeadStats,
    isDevMode ? 'skip' : { workspaceId }
  )

  const summaryData = (isDevMode ? MOCK_BRAIN_SUMMARY : summary) as any
  const actionsData = (isDevMode ? MOCK_BRAIN_ACTIONS : (actions ?? [])) as any[]
  const insightsData = (isDevMode ? MOCK_BRAIN_INSIGHTS : (insights ?? [])) as any[]
  const statsData = (isDevMode ? MOCK_LEAD_STATS : leadStats) as any

  const isLoading = !isDevMode && (summary === undefined || actions === undefined)

  if (isLoading) {
    return <InsightsSkeleton />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Insights</h1>
        {summaryData && (
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(summaryData.created_at).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <DailySummaryCard summary={summaryData} />
          <ActionItemsList actions={actionsData} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <LeadQualityOverview stats={statsData} />
          <PatternInsights insights={insightsData} />
        </div>
      </div>
    </div>
  )
}

function InsightsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  )
}
