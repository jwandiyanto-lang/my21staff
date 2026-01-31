'use client'

import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { DailySummaryCard } from '@/components/insights/daily-summary-card'
import { ActionItemsList } from '@/components/insights/action-items-list'
import { PatternInsights } from '@/components/insights/pattern-insights'
import { LeadQualityOverview } from '@/components/insights/lead-quality-overview'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock data for dev mode
const MOCK_SUMMARY = {
  _id: 'summary-001' as Id<'brainSummaries'>,
  workspace_id: 'demo' as Id<'workspaces'>,
  summary_text: "Great day! You received 5 new leads, 2 are showing hot signals. Budi Santoso and Dewi Lestari both mentioned urgent timeline needs. Consider prioritizing follow-up calls today. Response rate was 85% - keep up the momentum!",
  summary_type: 'daily',
  trigger: 'cron',
  created_at: Date.now() - 8 * 60 * 60 * 1000, // 8 hours ago (morning summary)
  metrics: {
    newLeadsCount: 5,
    hotLeadsCount: 2,
    warmLeadsCount: 8,
    coldLeadsCount: 12,
    avgScore: 45,
  }
}

const MOCK_ACTIONS = [
  {
    _id: 'action-001' as Id<'brainActions'>,
    workspace_id: 'demo' as Id<'workspaces'>,
    contact_id: 'contact-001' as Id<'contacts'>,
    action_type: 'follow_up',
    priority: 92,
    urgency: 'immediate' as const,
    reason: 'Hot lead with budget confirmed',
    status: 'pending',
    created_at: Date.now(),
    expires_at: Date.now() + 24 * 60 * 60 * 1000,
    suggested_message: 'Halo Budi! Terima kasih sudah berbagi detail bisnis Anda. Saya ingin membahas solusi yang cocok untuk kebutuhan tim Anda. Kapan waktu yang nyaman untuk ngobrol?'
  },
  {
    _id: 'action-002' as Id<'brainActions'>,
    workspace_id: 'demo' as Id<'workspaces'>,
    contact_id: 'contact-002' as Id<'contacts'>,
    action_type: 'follow_up',
    priority: 78,
    urgency: 'today' as const,
    reason: 'Warm lead, no response for 3 days',
    status: 'pending',
    created_at: Date.now(),
    expires_at: Date.now() + 24 * 60 * 60 * 1000,
  },
  {
    _id: 'action-003' as Id<'brainActions'>,
    workspace_id: 'demo' as Id<'workspaces'>,
    contact_id: 'contact-003' as Id<'contacts'>,
    action_type: 'opportunity_alert',
    priority: 65,
    urgency: 'this_week' as const,
    reason: 'Mentioned expanding team',
    status: 'pending',
    created_at: Date.now(),
    expires_at: Date.now() + 24 * 60 * 60 * 1000,
  },
]

const MOCK_INSIGHTS = [
  {
    _id: 'insight-001' as Id<'brainInsights'>,
    workspace_id: 'demo' as Id<'workspaces'>,
    insight_type: 'trending_topic',
    pattern: 'Employee scheduling',
    frequency: 8,
    confidence: 'high' as const,
    examples: ['Susah atur jadwal karyawan', 'Shift management ribet'],
    suggested_faqs: [{
      question: 'Bagaimana cara atur jadwal shift?',
      suggested_answer: 'Dengan my21staff, Anda bisa atur jadwal shift dengan drag-and-drop...'
    }],
    time_range: '7d',
    created_at: Date.now(),
  },
  {
    _id: 'insight-002' as Id<'brainInsights'>,
    workspace_id: 'demo' as Id<'workspaces'>,
    insight_type: 'objection_pattern',
    pattern: 'Harga terlalu mahal',
    frequency: 5,
    confidence: 'medium' as const,
    examples: ['Budget terbatas', 'Masih mikir-mikir harganya'],
    time_range: '7d',
    created_at: Date.now(),
  },
]

const MOCK_LEAD_STATS = {
  byTemperature: { hot: 2, warm: 8, lukewarm: 5, cold: 12 },
  total: 27,
  avgScore: 45,
}

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

  const summaryData = (isDevMode ? MOCK_SUMMARY : summary) as any
  const actionsData = (isDevMode ? MOCK_ACTIONS : (actions ?? [])) as any[]
  const insightsData = (isDevMode ? MOCK_INSIGHTS : (insights ?? [])) as any[]
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
