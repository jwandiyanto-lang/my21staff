'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Bot, GraduationCap } from 'lucide-react'
import { SlotManager } from '@/components/knowledge-base/slot-manager'

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
  const [activeTab, setActiveTab] = useState('scheduling')

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure ARI's knowledge, persona, and scheduling availability
        </p>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Scheduling</span>
          </TabsTrigger>
          <TabsTrigger value="persona" disabled className="flex items-center gap-2 opacity-50">
            <Bot className="w-4 h-4" />
            <span>Persona</span>
          </TabsTrigger>
          <TabsTrigger value="universities" disabled className="flex items-center gap-2 opacity-50">
            <GraduationCap className="w-4 h-4" />
            <span>Universities</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduling" className="space-y-6">
          <SlotManager workspaceId={workspace.id} teamMembers={teamMembers} />
        </TabsContent>

        <TabsContent value="persona">
          <div className="text-center py-12 text-muted-foreground">
            Persona settings coming in Phase 6
          </div>
        </TabsContent>

        <TabsContent value="universities">
          <div className="text-center py-12 text-muted-foreground">
            University management coming in Phase 6
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
