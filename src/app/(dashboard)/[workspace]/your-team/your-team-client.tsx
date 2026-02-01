'use client'

import { Bot } from 'lucide-react'
import { TabErrorBoundary } from '@/components/error-boundaries/tab-error-boundary'
import { SimplifiedInternSettings } from '@/components/your-team/simplified-intern-settings'

interface YourTeamClientProps {
  workspace: {
    id: string
    name: string
    slug: string
  }
}

export function YourTeamClient({ workspace }: YourTeamClientProps) {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your AI team members and their configurations
        </p>
      </div>

      {/* Intern Section - Sarah Chat Bot configuration */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Intern
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI assistant for lead qualification
          </p>
        </div>

        {/* Simplified Settings */}
        <TabErrorBoundary tabName="Intern Settings">
          <SimplifiedInternSettings
            workspaceId={workspace.id}
            workspaceSlug={workspace.slug}
          />
        </TabErrorBoundary>
      </div>
    </div>
  )
}
