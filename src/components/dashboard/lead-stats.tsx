'use client'

import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendIndicator } from './trend-indicator'
import { Users, UserPlus, CalendarDays, Flame } from 'lucide-react'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock stats for dev mode
const MOCK_STATS = {
  total: 127,
  byStatus: { new: 45, qualified: 32, contacted: 28, converted: 15, archived: 7 },
  byTemperature: { hot: 8, warm: 24, lukewarm: 35, cold: 60 },
  newToday: 5,
  newThisWeek: 23,
  newThisMonth: 78,
  avgScore: 42,
}

// Mock previous period for trend calculation (would be separate query in production)
const MOCK_PREVIOUS = {
  newYesterday: 3,
  newLastWeek: 18,
}

interface LeadStatsProps {
  workspaceId: Id<'workspaces'>
}

export function LeadStats({ workspaceId }: LeadStatsProps) {
  const stats = useQuery(
    api.leads.getLeadStats,
    isDevMode ? 'skip' : { workspaceId }
  )

  const data = isDevMode ? MOCK_STATS : stats
  const previous = MOCK_PREVIOUS // In production, this would be a separate query

  if (!data) {
    return <LeadStatsSkeleton />
  }

  // Calculate trends (simplified - in production, compare to previous period data)
  const todayTrend = previous.newYesterday > 0
    ? Math.round(((data.newToday - previous.newYesterday) / previous.newYesterday) * 100)
    : 0
  const weekTrend = previous.newLastWeek > 0
    ? Math.round(((data.newThisWeek - previous.newLastWeek) / previous.newLastWeek) * 100)
    : 0

  // Generate conversational highlight
  const highlight = generateHighlight(data, todayTrend, weekTrend)

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={data.total}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="New Today"
          value={data.newToday}
          icon={<UserPlus className="h-4 w-4 text-blue-500" />}
          trend={todayTrend}
          trendPeriod="vs yesterday"
        />
        <StatCard
          title="New This Week"
          value={data.newThisWeek}
          icon={<CalendarDays className="h-4 w-4 text-green-500" />}
          trend={weekTrend}
          trendPeriod="vs last week"
        />
        <StatCard
          title="Hot Leads"
          value={data.byTemperature?.hot || 0}
          icon={<Flame className="h-4 w-4 text-red-500" />}
          valueClassName="text-red-600"
        />
      </div>

      {/* Conversational highlight */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground">{highlight}</p>
        </CardContent>
      </Card>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  trend?: number
  trendPeriod?: string
  valueClassName?: string
}

function StatCard({ title, value, icon, trend, trendPeriod, valueClassName }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName || ''}`}>
          {value.toLocaleString('id-ID')}
        </div>
        {trend !== undefined && (
          <TrendIndicator value={trend} period={trendPeriod} />
        )}
      </CardContent>
    </Card>
  )
}

function generateHighlight(data: typeof MOCK_STATS, todayTrend: number, weekTrend: number): string {
  const parts: string[] = []

  if (data.newToday > 0) {
    parts.push(`${data.newToday} new lead${data.newToday > 1 ? 's' : ''} today`)
  }

  if (weekTrend > 0) {
    parts.push(`up ${weekTrend}% from last week`)
  } else if (weekTrend < 0) {
    parts.push(`down ${Math.abs(weekTrend)}% from last week`)
  }

  if (data.byTemperature?.hot > 0) {
    parts.push(`${data.byTemperature.hot} hot lead${data.byTemperature.hot > 1 ? 's' : ''} ready for follow-up`)
  }

  if (parts.length === 0) {
    return "No new activity today. Check back later!"
  }

  return parts.join(' - ') + '.'
}

function LeadStatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  )
}
