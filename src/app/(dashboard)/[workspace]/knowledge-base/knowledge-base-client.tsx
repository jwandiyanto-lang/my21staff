'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Bot, GitBranch, Database, Target } from 'lucide-react'
import { SlotManager } from '@/components/knowledge-base/slot-manager'
import { PersonaTab } from '@/components/knowledge-base/persona-tab'

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
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="persona" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span>Persona</span>
          </TabsTrigger>
          <TabsTrigger value="flow" disabled className="flex items-center gap-2 opacity-50">
            <GitBranch className="w-4 h-4" />
            <span>Flow</span>
          </TabsTrigger>
          <TabsTrigger value="database" disabled className="flex items-center gap-2 opacity-50">
            <Database className="w-4 h-4" />
            <span>Database</span>
          </TabsTrigger>
          <TabsTrigger value="scoring" disabled className="flex items-center gap-2 opacity-50">
            <Target className="w-4 h-4" />
            <span>Scoring</span>
          </TabsTrigger>
          <TabsTrigger value="slots" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Slots</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="space-y-6">
          <PersonaTab workspaceId={workspace.id} />
        </TabsContent>

        <TabsContent value="flow">
          <div className="text-center py-12 text-muted-foreground">
            Conversation flow configuration coming soon
          </div>
        </TabsContent>

        <TabsContent value="database">
          <div className="text-center py-12 text-muted-foreground">
            Knowledge database coming soon
          </div>
        </TabsContent>

        <TabsContent value="scoring">
          <div className="text-center py-12 text-muted-foreground">
            Scoring configuration coming soon
          </div>
        </TabsContent>

        <TabsContent value="slots" className="space-y-6">
          <SlotManager workspaceId={workspace.id} teamMembers={teamMembers} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
