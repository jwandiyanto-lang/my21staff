'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Bot, GitBranch, Database, Target } from 'lucide-react'
import { SlotManager } from '@/components/knowledge-base/slot-manager'
import { PersonaTab } from '@/components/knowledge-base/persona-tab'
import { FlowTab } from '@/components/knowledge-base/flow-tab'
import { DatabaseTab } from '@/components/knowledge-base/database-tab'
import { ScoringTab } from '@/components/knowledge-base/scoring-tab'
import { TabErrorBoundary } from '@/components/error-boundaries/tab-error-boundary'

interface TeamMember {
  id: string
  email: string
  full_name: string
}

interface KnowledgeBaseClientProps {
  workspace: {
    id: string
    name: string
    slug: string
  }
  teamMembers: TeamMember[]
}

export function KnowledgeBaseClient({ workspace, teamMembers }: KnowledgeBaseClientProps) {
  const [activeTab, setActiveTab] = useState('persona')

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Intern</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your intern&apos;s persona, conversation flow, knowledge, and scoring
        </p>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl h-auto">
          <TabsTrigger value="persona" className="flex items-center gap-2 py-2">
            <Bot className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Persona</span>
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2 py-2">
            <GitBranch className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Flow</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2 py-2">
            <Database className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Database</span>
          </TabsTrigger>
          <TabsTrigger value="scoring" className="flex items-center gap-2 py-2">
            <Target className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Scoring</span>
          </TabsTrigger>
          <TabsTrigger value="slots" className="flex items-center gap-2 py-2">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Slots</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="space-y-6">
          <TabErrorBoundary tabName="Persona">
            <PersonaTab workspaceId={workspace.id} />
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="flow" className="space-y-6">
          <TabErrorBoundary tabName="Flow">
            <FlowTab workspaceId={workspace.id} />
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <TabErrorBoundary tabName="Database">
            <DatabaseTab workspaceId={workspace.id} />
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <TabErrorBoundary tabName="Scoring">
            <ScoringTab workspaceId={workspace.id} />
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="slots" className="space-y-6">
          <TabErrorBoundary tabName="Slots">
            <SlotManager workspaceId={workspace.id} teamMembers={teamMembers} />
          </TabErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  )
}
