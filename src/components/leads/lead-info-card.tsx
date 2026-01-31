import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Briefcase, Calendar, AlertCircle, Gauge } from 'lucide-react'

interface LeadInfoCardProps {
  lead: {
    leadScore?: number
    businessType?: string
    painPoints?: string[]
    created_at: number
    lastActivityAt?: number
  }
}

export function LeadInfoCard({ lead }: LeadInfoCardProps) {
  const score = lead.leadScore || 0
  const scoreColor = score >= 70 ? 'text-red-600' : score >= 40 ? 'text-orange-500' : 'text-blue-500'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Lead Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Score</span>
          </div>
          <span className={`font-bold ${scoreColor}`}>{score}/100</span>
        </div>

        {/* Business Type */}
        {lead.businessType && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Business</span>
            </div>
            <span className="text-sm">{lead.businessType}</span>
          </div>
        )}

        {/* Pain Points */}
        {lead.painPoints && lead.painPoints.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pain Points</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {lead.painPoints.map((point, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {point}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Created</span>
          <span>{formatDistanceToNow(lead.created_at, { addSuffix: true })}</span>
        </div>
        {lead.lastActivityAt && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last Active</span>
            <span>{formatDistanceToNow(lead.lastActivityAt, { addSuffix: true })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
