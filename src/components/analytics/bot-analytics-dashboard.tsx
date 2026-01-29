'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Users, TrendingUp, Calendar, FileText, Loader2 } from 'lucide-react'

interface BotAnalyticsDashboardProps {
  workspaceId: string
}

export function BotAnalyticsDashboard({ workspaceId }: BotAnalyticsDashboardProps) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const [dateRange, setDateRange] = useState<number>(30) // Default to last 30 days

  // Fetch analytics data from Convex
  const analytics = useQuery(
    api.ari.getBotAnalytics,
    isDevMode ? 'skip' : {
      workspace_id: workspaceId,
      date_range_days: dateRange,
    }
  )

  // Mock data for dev mode
  const mockAnalytics = {
    totalConversations: 47,
    qualifiedHandoffs: 12,
    notQualityHandoffs: 8,
    conversionRate: 26, // 12/47 * 100
    averageAge: 24,
    documentDistribution: {
      passport: 35,
      cv: 28,
      transcript: 22,
      english_cert: 18,
    },
    dateRangeDays: dateRange,
  }

  const data = isDevMode ? mockAnalytics : analytics

  const isLoading = !isDevMode && analytics === undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No analytics data available</p>
        <p className="text-sm mt-1">Start conversations to see metrics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Show data for:</span>
        <div className="flex gap-2">
          <Button
            variant={dateRange === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(7)}
          >
            Last 7 days
          </Button>
          <Button
            variant={dateRange === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(30)}
          >
            Last 30 days
          </Button>
          <Button
            variant={dateRange === 90 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(90)}
          >
            Last 90 days
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversations */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Conversations</CardDescription>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {data.totalConversations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bot-handled conversations
            </p>
          </CardContent>
        </Card>

        {/* Qualified Handoffs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Qualified Leads</CardDescription>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-green-600">
              {data.qualifiedHandoffs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Interested in consultation
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Conversion Rate</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {data.conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Qualified / Total
            </p>
          </CardContent>
        </Card>

        {/* Average Age */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Average Age</CardDescription>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {data.averageAge || '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Qualified leads average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Collection Rate</CardTitle>
          <CardDescription>
            How many leads provided each document type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Passport */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Passport</span>
                </div>
                <span className="font-medium tabular-nums">
                  {data.documentDistribution.passport} / {data.totalConversations}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width: `${(data.documentDistribution.passport / Math.max(data.totalConversations, 1)) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* CV */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>CV / Resume</span>
                </div>
                <span className="font-medium tabular-nums">
                  {data.documentDistribution.cv} / {data.totalConversations}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{
                    width: `${(data.documentDistribution.cv / Math.max(data.totalConversations, 1)) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Transcript */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Transcript / Ijazah</span>
                </div>
                <span className="font-medium tabular-nums">
                  {data.documentDistribution.transcript} / {data.totalConversations}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all"
                  style={{
                    width: `${(data.documentDistribution.transcript / Math.max(data.totalConversations, 1)) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* English Certificate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>English Certificate (IELTS/TOEFL)</span>
                </div>
                <span className="font-medium tabular-nums">
                  {data.documentDistribution.english_cert} / {data.totalConversations}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all"
                  style={{
                    width: `${(data.documentDistribution.english_cert / Math.max(data.totalConversations, 1)) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Quality Breakdown */}
      {data.notQualityHandoffs > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Quality Breakdown</CardTitle>
            <CardDescription>
              Distribution of qualified vs not quality leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  Qualified
                </Badge>
                <span className="text-2xl font-bold tabular-nums">
                  {data.qualifiedHandoffs}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Not Quality
                </Badge>
                <span className="text-2xl font-bold tabular-nums text-muted-foreground">
                  {data.notQualityHandoffs}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
