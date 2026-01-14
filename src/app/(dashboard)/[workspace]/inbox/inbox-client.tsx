'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { ConversationList } from './conversation-list'
import type { Workspace, ConversationWithContact } from '@/types/database'

interface InboxClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  conversations: ConversationWithContact[]
}

export function InboxClient({ workspace, conversations }: InboxClientProps) {
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithContact | null>(
    conversations[0] || null
  )
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left sidebar - Conversation list */}
      <div className="w-80 border-r bg-background flex flex-col">
        {/* Search header */}
        <div className="p-4 border-b">
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Conversation list */}
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={setSelectedConversation}
          searchQuery={searchQuery}
        />
      </div>

      {/* Right area - Message thread placeholder */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">
                {selectedConversation.contact.name || selectedConversation.contact.phone}
              </p>
              <p className="text-sm mt-2">
                Message thread will appear here (Phase 03-02)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm mt-2">
                Choose a conversation from the sidebar to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
