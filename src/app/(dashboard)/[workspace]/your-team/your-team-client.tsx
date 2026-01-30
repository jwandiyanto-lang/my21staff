'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Brain, Users } from 'lucide-react'
import { TabErrorBoundary } from '@/components/error-boundaries/tab-error-boundary'
import { InternSettings } from '@/components/your-team/intern-settings'
import { BrainSettings } from '@/components/your-team/brain-settings'

interface TeamMember {
  id: string
  email: string
  full_name: string
}

interface YourTeamClientProps {
  workspace: {
    id: string
    name: string
    slug: string
  }
  teamMembers: TeamMember[]
  activeTab: string
}

export function YourTeamClient({ workspace, teamMembers, activeTab: initialTab }: YourTeamClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your AI team members and their configurations
        </p>
      </div>

      {/* Main Tabs - Intern vs Brain */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-auto">
          <TabsTrigger value="intern" className="flex items-center gap-2 py-3">
            <Bot className="w-4 h-4 shrink-0" />
            <span>Intern</span>
          </TabsTrigger>
          <TabsTrigger value="brain" className="flex items-center gap-2 py-3">
            <Brain className="w-4 h-4 shrink-0" />
            <span>Brain</span>
          </TabsTrigger>
        </TabsList>

        {/* Intern Tab - Sarah Chat Bot configuration */}
        <TabsContent value="intern" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Intern
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sarah Chat Bot - Conversational AI for lead qualification
              </p>
            </div>

            {/* Intern Settings Component */}
            <TabErrorBoundary tabName="Intern Settings">
              <InternSettings workspaceId={workspace.id} workspaceSlug={workspace.slug} />
            </TabErrorBoundary>
          </div>
        </TabsContent>

        {/* Brain Tab - Grok Manager Bot configuration */}
        <TabsContent value="brain" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Brain
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Grok Manager Bot - Lead analysis and business insights
              </p>
            </div>

            {/* Brain Settings Component */}
            <TabErrorBoundary tabName="Brain Settings">
              <BrainSettings workspaceId={workspace.id} workspaceSlug={workspace.slug} />
            </TabErrorBoundary>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

