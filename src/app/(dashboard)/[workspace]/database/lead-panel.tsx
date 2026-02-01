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
  _id: Id<'contacts'>
  workspace_id: Id<'workspaces'>
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
  // Sarah fields
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
  const updateContact = useMutation(api.mutations.updateContact)

  const handleFieldSave = async (field: string, value: string) => {
    try {
      await updateContact({
        contact_id: contact._id,
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
      {/* Contact Vitals */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <User className="h-3.5 w-3.5" />
          Contact Vitals
        </h3>
        <div className="space-y-2">
          <InlineEditField
            label="Name"
            value={contact.name}
            placeholder="No name"
            onSave={(value) => handleFieldSave('name', value)}
          />
          <div className="flex items-center gap-2 px-3 py-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{contact.phone}</span>
            {contact.phone_normalized && contact.phone_normalized !== contact.phone && (
              <span className="text-xs text-muted-foreground">({contact.phone_normalized})</span>
            )}
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
      </section>

      <Separator />

      {/* Source Intelligence */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" />
          Source Intelligence
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-muted-foreground">Source</span>
            <Badge variant="secondary" className="text-xs">
              {contact.source || 'Unknown'}
            </Badge>
          </div>
          {trafficSource && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-muted-foreground">Traffic</span>
              <span>{trafficSource}</span>
            </div>
          )}
          {campaignId && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-muted-foreground">Campaign</span>
              <span className="text-xs font-mono">{campaignId}</span>
            </div>
          )}
          {deviceType && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-muted-foreground">Device</span>
              <div className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                <span>{deviceType}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-muted-foreground">Added</span>
            <span>{formatWIB(contact.created_at, DATE_FORMATS.DATE_SHORT)}</span>
          </div>
        </div>
      </section>

      <Separator />

      {/* Engagement Signals */}
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" />
          Engagement Signals
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-muted-foreground">Lead Status</span>
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
          {contact.leadTemperature && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-muted-foreground">Temperature</span>
              <Badge
                className={cn(
                  'text-xs',
                  contact.leadTemperature === 'hot' && 'bg-red-100 text-red-700',
                  contact.leadTemperature === 'warm' && 'bg-orange-100 text-orange-700',
                  contact.leadTemperature === 'lukewarm' && 'bg-yellow-100 text-yellow-700',
                  contact.leadTemperature === 'cold' && 'bg-blue-100 text-blue-700',
                )}
              >
                {contact.leadTemperature.toUpperCase()}
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-muted-foreground">Lead Score</span>
            <span className="font-semibold">{contact.lead_score}/100</span>
          </div>
          {messageCount !== undefined && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Messages
              </span>
              <span>{messageCount}</span>
            </div>
          )}
          {contact.lastActivityAt && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Last Activity
              </span>
              <span title={formatWIB(contact.lastActivityAt, DATE_FORMATS.DATETIME_LONG)}>
                {formatDistanceWIB(contact.lastActivityAt, { addSuffix: true })}
              </span>
            </div>
          )}
          {contact.lastContactAt && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Last Contact
              </span>
              <span title={formatWIB(contact.lastContactAt, DATE_FORMATS.DATETIME_LONG)}>
                {formatDistanceWIB(contact.lastContactAt, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </section>

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
