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
import { MessageCircle, Users, TrendingUp, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BotAnalyticsDashboardProps {
  workspaceId: string
  timeFilter: 'week' | 'month' | 'all'
}

export function BotAnalyticsDashboard({ workspaceId, timeFilter }: BotAnalyticsDashboardProps) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const [isExpanded, setIsExpanded] = useState(false)

  // Convert timeFilter to days
  const dateRangeDays = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : undefined

  // Fetch analytics data from Convex
  const analytics = useQuery(
    api.ari.getBotAnalytics,
    isDevMode ? 'skip' : {
      workspace_id: workspaceId,
      date_range_days: dateRangeDays,
    }
  )

  // Mock data for dev mode
  const mockAnalytics = {
    totalConversations: 47,
    qualifiedHandoffs: 12,
    notQualityHandoffs: 8,
    conversionRate: 26,
    averageAge: 24,
    documentDistribution: {
      passport: 35,
      cv: 28,
      transcript: 22,
      english_cert: 18,
    },
  }

  const data = isDevMode ? mockAnalytics : analytics
  const isLoading = !isDevMode && analytics === undefined

  if (isLoading) {
    return null
  }

  if (!data || data.totalConversations === 0) {
    return null
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left hover:opacity-70 transition-opacity"
        >
          <div>
            <CardTitle className="text-base">ARI Performance</CardTitle>
            <CardDescription className="text-xs">
              {data.totalConversations} AI conversations • {data.qualifiedHandoffs} handovers
            </CardDescription>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">

          {/* Simple Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 pb-4 border-b">
            <div>
              <div className="text-xs text-muted-foreground">Total AI Conversations</div>
              <div className="text-2xl font-bold tabular-nums">
                {data.totalConversations}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Quality</div>
              <div className="text-2xl font-bold text-green-600 tabular-nums">
                {data.qualifiedHandoffs}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Successful Handover</div>
              <div className="text-2xl font-bold tabular-nums">
                {data.qualifiedHandoffs}
              </div>
            </div>
          </div>

          {/* Document Collection */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Documents Collected</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Passport</span>
                <span className="font-medium tabular-nums">{data.documentDistribution.passport}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">CV</span>
                <span className="font-medium tabular-nums">{data.documentDistribution.cv}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Transcript</span>
                <span className="font-medium tabular-nums">{data.documentDistribution.transcript}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">IELTS/TOEFL</span>
                <span className="font-medium tabular-nums">{data.documentDistribution.english_cert}</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
