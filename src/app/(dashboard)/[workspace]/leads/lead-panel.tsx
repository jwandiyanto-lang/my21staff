'use client'

import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { Id } from '@/../convex/_generated/dataModel'
import { formatDistanceWIB, DATE_FORMATS, formatWIB } from '@/lib/utils/timezone'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { InlineEditField } from './inline-edit-field'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Smartphone,
  BarChart3,
  MessageCircle,
  Zap,
  Target,
  Building,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Contact {
  _id: string | { toString(): string } // Accept both string and Convex Id
  workspace_id: string | { toString(): string }
  name?: string | null
  phone: string
  phone_normalized?: string | null
  email?: string | null
  lead_score: number
  lead_status: string
  leadStatus?: string | null
  leadTemperature?: string | null
  tags?: string[] | null
  source?: string | null
  metadata?: Record<string, unknown> | null
  lastActivityAt?: number | null
  lastContactAt?: number | null
  created_at: number
  updated_at: number
  // Sarah fields (populated by Sarah AI during conversations)
  businessType?: string | null
  domisili?: string | null
  story?: string | null
  painPoints?: string[] | null
  urgencyLevel?: string | null
}

interface LeadPanelProps {
  contact: Contact
  workspaceId: string
}

export function LeadPanel({ contact, workspaceId }: LeadPanelProps) {
  // Workaround for Convex type instantiation issue
  // The api.mutations.updateContact type is too deep for TypeScript
  // @ts-ignore - Type instantiation is excessively deep
  const updateContact = useMutation(api.mutations.updateContact)

  const handleFieldSave = async (field: string, value: string) => {
    try {
      await updateContact({
        contact_id: String(contact._id), // Ensure string
        workspace_id: workspaceId,
        [field]: value || null,
      })
      toast.success('Saved')
    } catch (error) {
      toast.error('Failed to save')
      throw error // Re-throw to trigger revert in InlineEditField
    }
  }

  // Extract metadata fields
  const meta = contact.metadata || {}
  const trafficSource = meta.traffic_source as string | undefined
  const campaignId = meta.campaign_id as string | undefined
  const landingPageUrl = meta.landing_page_url as string | undefined
  const deviceType = meta.device_type as string | undefined
  const messageCount = meta.message_count as number | undefined
  const responseLatency = meta.response_latency as string | undefined
  const summary = meta.summary as string | undefined
  const temperatureReason = meta.temperature_reason as string | undefined
  const leadVolume = meta.lead_volume as string | undefined
  const currentStack = meta.current_stack as string | undefined
  const mainPainPoint = meta.main_pain_point as string | undefined
  const urgencyTimeline = meta.urgency_timeline as string | undefined

  // Determine if we should show SaaS niche section
  const showSaasSection = contact.businessType === 'SaaS' || contact.businessType === 'CRM' || currentStack

  return (
    <div className="space-y-4">
      {/* Lead Overview - More Readable Layout */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Contact Information
        </h3>

        {/* Contact Details */}
        <div className="space-y-2">
          <InlineEditField
            label="Name"
            value={contact.name}
            placeholder="No name"
            onSave={(value) => handleFieldSave('name', value)}
          />
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">{contact.phone}</span>
          </div>
          <InlineEditField
            label="Email"
            value={contact.email}
            placeholder="No email"
            onSave={(value) => handleFieldSave('email', value)}
          />
          <InlineEditField
            label="Location"
            value={contact.domisili}
            placeholder="No location"
            onSave={(value) => handleFieldSave('domisili', value)}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="px-3 py-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground mb-1">Source</div>
            <Badge variant="secondary" className="text-xs">
              {contact.source || 'Unknown'}
            </Badge>
          </div>
          <div className="px-3 py-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                contact.leadTemperature === 'hot' && 'border-red-500 text-red-600',
                contact.leadTemperature === 'warm' && 'border-orange-500 text-orange-600',
                contact.leadTemperature === 'lukewarm' && 'border-yellow-500 text-yellow-600',
                contact.leadTemperature === 'cold' && 'border-blue-500 text-blue-600',
              )}
            >
              {contact.leadStatus || contact.lead_status || 'new'}
            </Badge>
          </div>
          {contact.lastActivityAt && (
            <div className="px-3 py-2 bg-muted/30 rounded">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Last Activity
              </div>
              <div className="text-sm" title={formatWIB(contact.lastActivityAt, DATE_FORMATS.DATETIME_LONG)}>
                {formatDistanceWIB(contact.lastActivityAt, { addSuffix: true })}
              </div>
            </div>
          )}
          {messageCount !== undefined && (
            <div className="px-3 py-2 bg-muted/30 rounded">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Messages
              </div>
              <div className="text-sm font-medium">{messageCount}</div>
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* AI Lead Score */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" />
          AI Lead Score
        </h3>
        <div className="space-y-3">
          {/* Score Display */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-2xl font-bold">{contact.lead_score}/100</span>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Score Highlights</div>
            {contact.leadTemperature && (
              <div className="flex items-start gap-2 px-3 py-2 bg-muted/20 rounded text-sm">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 shrink-0" />
                <div>
                  <span className="font-medium">Temperature: </span>
                  <span className={cn(
                    contact.leadTemperature === 'hot' && 'text-red-600',
                    contact.leadTemperature === 'warm' && 'text-orange-600',
                    contact.leadTemperature === 'lukewarm' && 'text-yellow-600',
                    contact.leadTemperature === 'cold' && 'text-blue-600',
                  )}>
                    {contact.leadTemperature}
                  </span>
                </div>
              </div>
            )}
            {temperatureReason && (
              <div className="flex items-start gap-2 px-3 py-2 bg-muted/20 rounded text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                <div>
                  <span className="font-medium">Reason: </span>
                  <span className="text-muted-foreground">{temperatureReason}</span>
                </div>
              </div>
            )}
            {responseLatency && (
              <div className="flex items-start gap-2 px-3 py-2 bg-muted/20 rounded text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1 shrink-0" />
                <div>
                  <span className="font-medium">Response Time: </span>
                  <span>{responseLatency}</span>
                </div>
              </div>
            )}
            {contact.urgencyLevel && (
              <div className="flex items-start gap-2 px-3 py-2 bg-muted/20 rounded text-sm">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0" />
                <div>
                  <span className="font-medium">Urgency: </span>
                  <span>{contact.urgencyLevel}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Business Info */}
      {showSaasSection && (
        <>
          <Separator />
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building className="h-3.5 w-3.5" />
              Business Info
            </h3>
            <div className="space-y-2 text-sm">
              {contact.businessType && (
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-muted-foreground">Business Type</span>
                  <Badge variant="secondary">{contact.businessType}</Badge>
                </div>
              )}
              {leadVolume && (
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-muted-foreground">Lead Volume</span>
                  <span>{leadVolume}</span>
                </div>
              )}
              {currentStack && (
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-muted-foreground">Current Stack</span>
                  <span>{currentStack}</span>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
