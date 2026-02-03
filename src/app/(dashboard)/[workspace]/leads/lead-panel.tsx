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
    <div className="space-y-6">
      {/* Compact Overview - Contact + Source + Engagement */}
      <section className="border rounded-lg p-4 bg-muted/30">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Lead Overview
        </h3>

        {/* Contact Info - Compact Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 text-sm">
          <InlineEditField
            label="Name"
            value={contact.name}
            placeholder="No name"
            onSave={(value) => handleFieldSave('name', value)}
            compact
          />
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-sm truncate">{contact.phone}</span>
          </div>
          <InlineEditField
            label="Email"
            value={contact.email}
            placeholder="No email"
            onSave={(value) => handleFieldSave('email', value)}
            compact
          />
          <InlineEditField
            label="Location"
            value={contact.domisili}
            placeholder="No location"
            onSave={(value) => handleFieldSave('domisili', value)}
            compact
          />
        </div>

        <Separator className="my-3" />

        {/* Source & Engagement - Single Line Grid */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          {/* Source */}
          <div className="space-y-1">
            <div className="text-muted-foreground font-medium">Source</div>
            <Badge variant="secondary" className="text-xs">
              {contact.source || 'Unknown'}
            </Badge>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <div className="text-muted-foreground font-medium">Status</div>
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

          {/* Score */}
          <div className="space-y-1">
            <div className="text-muted-foreground font-medium">Score</div>
            <div className="font-semibold">{contact.lead_score}/100</div>
          </div>

          {/* Temperature (if available) */}
          {contact.leadTemperature && (
            <div className="space-y-1">
              <div className="text-muted-foreground font-medium">Temp</div>
              <Badge
                className={cn(
                  'text-xs',
                  contact.leadTemperature === 'hot' && 'bg-red-100 text-red-700',
                  contact.leadTemperature === 'warm' && 'bg-orange-100 text-orange-700',
                  contact.leadTemperature === 'lukewarm' && 'bg-yellow-100 text-yellow-700',
                  contact.leadTemperature === 'cold' && 'bg-blue-100 text-blue-700',
                )}
              >
                {contact.leadTemperature}
              </Badge>
            </div>
          )}

          {/* Last Activity */}
          {contact.lastActivityAt && (
            <div className="space-y-1">
              <div className="text-muted-foreground font-medium flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Activity
              </div>
              <div className="truncate" title={formatWIB(contact.lastActivityAt, DATE_FORMATS.DATETIME_LONG)}>
                {formatDistanceWIB(contact.lastActivityAt, { addSuffix: true })}
              </div>
            </div>
          )}

          {/* Messages */}
          {messageCount !== undefined && (
            <div className="space-y-1">
              <div className="text-muted-foreground font-medium flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Messages
              </div>
              <div>{messageCount}</div>
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Last Contact (if different from last activity) */}
      {contact.lastContactAt && (
        <div className="flex items-center justify-between px-3 py-1.5 text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Last Contact
          </span>
          <span title={formatWIB(contact.lastContactAt, DATE_FORMATS.DATETIME_LONG)}>
            {formatDistanceWIB(contact.lastContactAt, { addSuffix: true })}
          </span>
        </div>
      )}

      <Separator />

      {/* Lead Profile */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="h-3.5 w-3.5" />
          Lead Profile
        </h3>
        <div className="space-y-3">
          {contact.story && (
            <div className="px-3">
              <span className="text-xs text-muted-foreground">Story</span>
              <p className="text-sm mt-1">{contact.story}</p>
            </div>
          )}
          {summary && (
            <div className="px-3">
              <span className="text-xs text-muted-foreground">Summary</span>
              <p className="text-sm mt-1">{summary}</p>
            </div>
          )}
          {contact.painPoints && contact.painPoints.length > 0 && (
            <div className="px-3">
              <span className="text-xs text-muted-foreground">Pain Points</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {contact.painPoints.map((pain, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {pain}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {contact.urgencyLevel && (
            <div className="flex items-center justify-between px-3 py-1.5 text-sm">
              <span className="text-muted-foreground">Urgency</span>
              <Badge variant="secondary" className="text-xs">{contact.urgencyLevel}</Badge>
            </div>
          )}
          {mainPainPoint && (
            <div className="px-3">
              <span className="text-xs text-muted-foreground">Main Pain Point</span>
              <p className="text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-orange-500" />
                {mainPainPoint}
              </p>
            </div>
          )}
          {urgencyTimeline && (
            <div className="flex items-center justify-between px-3 py-1.5 text-sm">
              <span className="text-muted-foreground">Timeline</span>
              <span>{urgencyTimeline}</span>
            </div>
          )}
        </div>
      </section>

      {/* Niche Data - SaaS/CRM */}
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
