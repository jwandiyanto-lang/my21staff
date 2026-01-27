'use client'

import { useState } from 'react'
import {
  MessageCircle,
  Phone,
  CheckCircle2,
  Settings,
  ExternalLink,
  RefreshCw,
  Webhook,
  Key,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Workspace } from '@/types/database'

interface IntegrationsClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug' | 'kapso_phone_id' | 'settings'>
}

// WhatsApp number info (from Kapso dashboard)
const WHATSAPP_CONFIG = {
  name: 'Jonathan Wandiyanto',
  number: '+62 856 9354 2822', // Displayed number
  phoneId: '647015955153740',
  status: 'active' as const,
  provider: 'Meta Business',
  connectedAt: '2026-01-10',
  messagesThisMonth: 39,
  inbound: 30,
  outbound: 9,
}

export function IntegrationsClient({ workspace }: IntegrationsClientProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const settings = workspace.settings as Record<string, unknown> | null

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your WhatsApp Business API and other integrations
        </p>
      </div>

      {/* WhatsApp Integration Card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-[#25D366]/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">WhatsApp Business API</h2>
                <p className="text-sm text-muted-foreground">Powered by Meta Business</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
                WHATSAPP_CONFIG.status === 'active'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-yellow-500/10 text-yellow-600'
              )}>
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  WHATSAPP_CONFIG.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                )} />
                {WHATSAPP_CONFIG.status === 'active' ? 'Connected' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Connected Number */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-background rounded-xl border border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{WHATSAPP_CONFIG.name}</h3>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-sm font-mono text-muted-foreground mt-0.5">
                {WHATSAPP_CONFIG.number}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Phone ID: {WHATSAPP_CONFIG.phoneId}</span>
                <span>•</span>
                <span>{WHATSAPP_CONFIG.provider}</span>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isRefreshing && 'animate-spin')} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-background rounded-xl border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{WHATSAPP_CONFIG.messagesThisMonth}</p>
              <p className="text-xs text-muted-foreground mt-1">Messages This Month</p>
            </div>
            <div className="p-4 bg-background rounded-xl border border-border text-center">
              <p className="text-2xl font-bold text-green-600">{WHATSAPP_CONFIG.inbound}</p>
              <p className="text-xs text-muted-foreground mt-1">Inbound</p>
            </div>
            <div className="p-4 bg-background rounded-xl border border-border text-center">
              <p className="text-2xl font-bold text-blue-600">{WHATSAPP_CONFIG.outbound}</p>
              <p className="text-xs text-muted-foreground mt-1">Outbound</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href="https://app.kapso.ai/projects/2bdca4dd-e230-4a1a-8639-68f8595defa8"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border hover:bg-muted/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">WhatsApp Settings</p>
                <p className="text-xs text-muted-foreground">Manage integration</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="https://app.kapso.ai/projects/2bdca4dd-e230-4a1a-8639-68f8595defa8/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border hover:bg-muted/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Webhook className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Webhooks</p>
                <p className="text-xs text-muted-foreground">Configure events</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Key className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">API Configuration</h2>
              <p className="text-sm text-muted-foreground">Credentials for CRM integration</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">API Key</p>
              <p className="text-xs text-muted-foreground mt-0.5">My21Staff</p>
            </div>
            <code className="px-3 py-1.5 bg-muted rounded-lg text-xs font-mono text-muted-foreground">
              ••••••••••••••••
            </code>
          </div>
          <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Phone Number ID</p>
              <p className="text-xs text-muted-foreground mt-0.5">Production</p>
            </div>
            <code className="px-3 py-1.5 bg-muted rounded-lg text-xs font-mono">
              {WHATSAPP_CONFIG.phoneId}
            </code>
          </div>
          <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Webhook URL</p>
              <p className="text-xs text-muted-foreground mt-0.5">Not configured</p>
            </div>
            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-md text-xs font-medium">
              Setup Required
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
