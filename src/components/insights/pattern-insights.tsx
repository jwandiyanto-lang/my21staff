'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertCircle, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react'

interface Insight {
  _id: string | any
  insight_type: string
  pattern: string
  frequency: number
  confidence: 'high' | 'medium' | 'low'
  examples?: string[]
  suggested_faqs?: Array<{ question: string; suggested_answer: string }>
  [key: string]: any // Allow additional properties from Convex
}

const typeConfig = {
  trending_topic: { icon: TrendingUp, label: 'Trending Topic', color: 'text-blue-600' },
  objection_pattern: { icon: AlertCircle, label: 'Common Objection', color: 'text-orange-600' },
  interest_signal: { icon: Lightbulb, label: 'Interest Signal', color: 'text-green-600' },
  rejection_analysis: { icon: AlertCircle, label: 'Rejection Reason', color: 'text-red-600' },
}

export function PatternInsights({ insights }: { insights: Insight[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pattern Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No patterns detected yet. Patterns emerge as more conversations accumulate.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pattern Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => {
            const config = typeConfig[insight.insight_type as keyof typeof typeConfig] || typeConfig.trending_topic
            const TypeIcon = config.icon
            const isExpanded = expanded === insight._id

            return (
              <div key={insight._id} className="border rounded-lg">
                <button
                  onClick={() => setExpanded(isExpanded ? null : insight._id)}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <TypeIcon className={`h-4 w-4 ${config.color}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium">{insight.pattern}</p>
                      <p className="text-xs text-muted-foreground">
                        {config.label} - {insight.frequency} mentions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={insight.confidence === 'high' ? 'default' : 'secondary'}>
                      {insight.confidence}
                    </Badge>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t">
                    {insight.examples && insight.examples.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Examples:</p>
                        <ul className="space-y-1">
                          {insight.examples.slice(0, 3).map((ex, i) => (
                            <li key={i} className="text-sm text-muted-foreground italic">&quot;{ex}&quot;</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insight.suggested_faqs && insight.suggested_faqs.length > 0 && (
                      <div className="mt-3 p-2 bg-green-50 rounded-md">
                        <p className="text-xs font-medium text-green-700 mb-1">Suggested FAQ:</p>
                        <p className="text-sm font-medium">{insight.suggested_faqs[0].question}</p>
                        <p className="text-sm text-muted-foreground mt-1">{insight.suggested_faqs[0].suggested_answer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
