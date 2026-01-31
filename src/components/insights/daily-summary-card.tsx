'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, TrendingUp, Users, Target } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Summary {
  summary_text: string
  created_at: number
  metrics: {
    newLeadsCount: number
    hotLeadsCount: number
    warmLeadsCount: number
    coldLeadsCount: number
    avgScore?: number
  }
}

export function DailySummaryCard({ summary }: { summary: Summary | null }) {
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Daily Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No summary available yet. Summaries are generated daily at 09:00 WIB.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Daily Summary
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(summary.created_at, { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversational summary */}
        <p className="text-sm leading-relaxed">
          {summary.summary_text}
        </p>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{summary.metrics.newLeadsCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">New Today</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{summary.metrics.hotLeadsCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Hot Leads</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Target className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{summary.metrics.avgScore || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
