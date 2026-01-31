'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendIndicator } from './trend-indicator'
import { Users, UserPlus, CalendarDays, Flame, Calendar } from 'lucide-react'

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
  newLastMonth: 62,
}

interface LeadStatsProps {
  workspaceId: Id<'workspaces'>
}

export function LeadStats({ workspaceId }: LeadStatsProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')

  const stats = useQuery(
    api.leads.getLeadStats,
    isDevMode ? 'skip' : { workspaceId }
  )

  const data = isDevMode ? MOCK_STATS : stats
  const previous = MOCK_PREVIOUS // In production, this would be a separate query

  if (!data) {
    return <LeadStatsSkeleton />
  }

  // Calculate trends based on selected period
  const todayTrend = previous.newYesterday > 0
    ? Math.round(((data.newToday - previous.newYesterday) / previous.newYesterday) * 100)
    : 0
  const weekTrend = previous.newLastWeek > 0
    ? Math.round(((data.newThisWeek - previous.newLastWeek) / previous.newLastWeek) * 100)
    : 0
  const monthTrend = previous.newLastMonth > 0
    ? Math.round(((data.newThisMonth - previous.newLastMonth) / previous.newLastMonth) * 100)
    : 0

  // Get primary stats based on period
  const getPrimaryStats = () => {
    switch (period) {
      case 'today':
        return {
          title: 'New Today',
          value: data.newToday,
          trend: todayTrend,
          trendPeriod: 'vs yesterday',
          icon: <UserPlus className="h-4 w-4 text-blue-500" />,
        }
      case 'week':
        return {
          title: 'New This Week',
          value: data.newThisWeek,
          trend: weekTrend,
          trendPeriod: 'vs last week',
          icon: <CalendarDays className="h-4 w-4 text-green-500" />,
        }
      case 'month':
        return {
          title: 'New This Month',
          value: data.newThisMonth,
          trend: monthTrend,
          trendPeriod: 'vs last month',
          icon: <Calendar className="h-4 w-4 text-purple-500" />,
        }
    }
  }

  const primaryStat = getPrimaryStats()

  // Generate conversational highlight based on period
  const highlight = generateHighlight(data, period, todayTrend, weekTrend, monthTrend)

  return (
    <div className="space-y-4">
      {/* Header with time period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-medium">Lead Overview</h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats grid - responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={data.total}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title={primaryStat.title}
          value={primaryStat.value}
          icon={primaryStat.icon}
          trend={primaryStat.trend}
          trendPeriod={primaryStat.trendPeriod}
        />
        <StatCard
          title="Hot Leads"
          value={data.byTemperature?.hot || 0}
          icon={<Flame className="h-4 w-4 text-red-500" />}
          valueClassName="text-red-600"
        />
        <StatCard
          title="Avg Score"
          value={data.avgScore}
          icon={<Users className="h-4 w-4 text-blue-500" />}
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

function generateHighlight(
  data: typeof MOCK_STATS,
  period: 'today' | 'week' | 'month',
  todayTrend: number,
  weekTrend: number,
  monthTrend: number
): string {
  const parts: string[] = []

  // Period-specific messages
  switch (period) {
    case 'today':
      if (data.newToday > 0) {
        parts.push(`${data.newToday} new lead${data.newToday > 1 ? 's' : ''} today`)
        if (todayTrend > 0) {
          parts.push(`up ${todayTrend}% from yesterday`)
        } else if (todayTrend < 0) {
          parts.push(`down ${Math.abs(todayTrend)}% from yesterday`)
        }
      } else {
        parts.push('No new leads today yet')
      }
      break

    case 'week':
      if (data.newThisWeek > 0) {
        parts.push(`${data.newThisWeek} new lead${data.newThisWeek > 1 ? 's' : ''} this week`)
        if (weekTrend > 0) {
          parts.push(`up ${weekTrend}% from last week`)
        } else if (weekTrend < 0) {
          parts.push(`down ${Math.abs(weekTrend)}% from last week`)
        }
      } else {
        parts.push('No new leads this week yet')
      }
      break

    case 'month':
      if (data.newThisMonth > 0) {
        parts.push(`${data.newThisMonth} new lead${data.newThisMonth > 1 ? 's' : ''} this month`)
        if (monthTrend > 0) {
          parts.push(`up ${monthTrend}% from last month`)
        } else if (monthTrend < 0) {
          parts.push(`down ${Math.abs(monthTrend)}% from last month`)
        }
      } else {
        parts.push('No new leads this month yet')
      }
      break
  }

  // Always include hot leads count if any
  if (data.byTemperature?.hot > 0) {
    parts.push(`${data.byTemperature.hot} hot lead${data.byTemperature.hot > 1 ? 's' : ''} ready for follow-up`)
  }

  if (parts.length === 0) {
    return "No new activity. Check back later!"
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
