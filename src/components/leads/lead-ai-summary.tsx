'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, MessageSquareText } from 'lucide-react'

interface LeadAISummaryProps {
  lead: {
    _id: string
    leadTemperature?: 'hot' | 'warm' | 'lukewarm' | 'cold' | 'new' | 'converted'
    leadScore?: number
  }
}

export function LeadAISummary({ lead }: LeadAISummaryProps) {
  const temperature = lead.leadTemperature || 'new'
  const score = lead.leadScore || 0

  const getTemperatureInsight = () => {
    switch (temperature) {
      case 'hot':
        return "High engagement detected. This lead shows strong buying signals and should be prioritized for follow-up."
      case 'warm':
        return "Good engagement level. Continue nurturing with relevant content and timely follow-ups."
      case 'lukewarm':
        return "Moderate interest shown. Consider re-engagement strategies or additional qualification."
      case 'cold':
        return "Early stage lead. Focus on building rapport and understanding their needs."
      case 'converted':
        return "Successfully converted! Maintain relationship and explore upsell opportunities."
      default:
        return "New lead detected. Sarah is gathering initial information to understand their needs."
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {getTemperatureInsight()}
        </p>

        {score >= 70 && (
          <div className="mt-3 p-2 bg-red-50 rounded-md border border-red-100">
            <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
              <MessageSquareText className="h-4 w-4" />
              Ready for handoff
            </div>
            <p className="text-xs text-red-600 mt-1">
              Score indicates high conversion potential
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
