'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Brain, Users } from 'lucide-react'
import { SlotManager } from '@/components/knowledge-base/slot-manager'
import { PersonaTab } from '@/components/knowledge-base/persona-tab'
import { FlowTab } from '@/components/knowledge-base/flow-tab'
import { DatabaseTab } from '@/components/knowledge-base/database-tab'
import { TabErrorBoundary } from '@/components/error-boundaries/tab-error-boundary'
import { AIToggle } from '@/components/knowledge-base/ai-toggle'

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
  const [aiEnabled, setAiEnabled] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Fetch initial AI enabled state
  useEffect(() => {
    async function fetchAiStatus() {
      try {
        const res = await fetch(`/api/workspaces/${workspace.slug}/ari-config`)
        if (!res.ok) return
        const data = await res.json()
        setAiEnabled(data.config?.enabled ?? true)
      } catch (error) {
        console.error('Failed to fetch AI status:', error)
      }
    }
    fetchAiStatus()
  }, [workspace.slug])

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

        {/* Intern Tab - Contains existing knowledge-base content */}
        <TabsContent value="intern" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Intern
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your AI assistant for handling conversations and answering questions
              </p>
            </div>

            {/* AI Toggle for Intern */}
            <AIToggle workspaceId={workspace.slug} initialEnabled={aiEnabled} />

            {/* Sub-tabs for Intern configuration */}
            <div className="pt-4">
              <InternTabs workspace={workspace} teamMembers={teamMembers} />
            </div>
          </div>
        </TabsContent>

        {/* Brain Tab - Grok Manager Bot placeholder */}
        <TabsContent value="brain" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Brain
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Grok Manager Bot - Lead analysis and business insights
              </p>
            </div>

            {/* Placeholder for Grok Manager Bot configuration */}
            <div className="border border-dashed border-white/20 rounded-xl p-12 text-center space-y-4">
              <Brain className="w-12 h-12 mx-auto text-white/30" />
              <div>
                <h3 className="text-lg font-medium text-foreground">Grok Manager Bot</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Coming Soon
                </p>
              </div>
              <div className="text-sm text-muted-foreground max-w-md mx-auto space-y-2">
                <p>Configure your AI manager for:</p>
                <ul className="text-left space-y-1 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F7931A]" />
                    Summary generation settings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F7931A]" />
                    Lead scoring configuration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F7931A]" />
                    Analysis triggers
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sub-component for Intern tabs (reuses existing knowledge-base structure)
function InternTabs({ workspace, teamMembers }: {
  workspace: { id: string; name: string; slug: string }
  teamMembers: TeamMember[]
}) {
  const [activeSubTab, setActiveSubTab] = useState('persona')

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 max-w-2xl h-auto">
        <TabsTrigger value="persona" className="flex items-center gap-2 py-2">
          <Bot className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Persona</span>
        </TabsTrigger>
        <TabsTrigger value="flow" className="flex items-center gap-2 py-2">
          <Bot className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Flow</span>
        </TabsTrigger>
        <TabsTrigger value="database" className="flex items-center gap-2 py-2">
          <Users className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Database</span>
        </TabsTrigger>
        <TabsTrigger value="slots" className="flex items-center gap-2 py-2">
          <Bot className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Slots</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="persona" className="space-y-6">
        <TabErrorBoundary tabName="Persona">
          <PersonaTab workspaceId={workspace.slug} />
        </TabErrorBoundary>
      </TabsContent>

      <TabsContent value="flow" className="space-y-6">
        <TabErrorBoundary tabName="Flow">
          <FlowTab workspaceId={workspace.slug} />
        </TabErrorBoundary>
      </TabsContent>

      <TabsContent value="database" className="space-y-6">
        <TabErrorBoundary tabName="Database">
          <DatabaseTab workspaceId={workspace.slug} />
        </TabErrorBoundary>
      </TabsContent>

      <TabsContent value="slots" className="space-y-6">
        <TabErrorBoundary tabName="Slots">
          <SlotManager workspaceId={workspace.slug} teamMembers={teamMembers} />
        </TabErrorBoundary>
      </TabsContent>
    </Tabs>
  )
}
