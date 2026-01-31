'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { LeadInfoCard } from './lead-info-card'
import { LeadNotesTimeline } from './lead-notes-timeline'
import { LeadAISummary } from './lead-ai-summary'
import { StageBadge } from './stage-badge'

interface Lead {
  _id: string
  phone: string
  name: string
  leadStatus?: string
  leadScore?: number
  leadTemperature?: 'hot' | 'warm' | 'lukewarm' | 'cold' | 'new' | 'converted'
  businessType?: string
  painPoints?: string[]
  notes?: Array<{ content: string; addedBy: string; addedAt: number }>
  lastActivityAt?: number
  created_at: number
}

interface LeadDetailSheetProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
  if (!lead) return null

  // Default values for optional fields
  const temperature = lead.leadTemperature || 'new'
  const score = lead.leadScore || 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{lead.name}</SheetTitle>
            <StageBadge temperature={temperature} />
          </div>
          <SheetDescription className="font-mono text-sm">
            {lead.phone}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <LeadInfoCard lead={lead} />
          <LeadAISummary lead={lead} />
          <LeadNotesTimeline notes={lead.notes || []} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
