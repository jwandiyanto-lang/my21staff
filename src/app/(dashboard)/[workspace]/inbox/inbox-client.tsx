'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { ConversationList } from './conversation-list'
import { MessageThread } from './message-thread'
import { MessageInput } from './message-input'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import type { Workspace, ConversationWithContact, Message } from '@/types/database'

interface InboxClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  conversations: ConversationWithContact[]
}

export function InboxClient({ workspace, conversations }: InboxClientProps) {
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithContact | null>(
    conversations[0] || null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Load messages when conversation changes
  useEffect(() => {
    async function loadMessages(conversationId: string) {
      setIsLoadingMessages(true)

      if (isDevMode()) {
        // Dev mode: filter mock messages
        const filtered = MOCK_MESSAGES.filter((m) => m.conversation_id === conversationId)
        // Sort by created_at ascending
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setMessages(filtered)
      } else {
        // Production: query Supabase
        const supabase = createClient()
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(100)
        setMessages(data || [])
      }

      setIsLoadingMessages(false)
    }

    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    } else {
      setMessages([])
    }
  }, [selectedConversation])

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

      {/* Right area - Message thread */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {selectedConversation ? (
          <>
            <MessageThread
              messages={messages}
              conversationContact={selectedConversation.contact}
              isLoading={isLoadingMessages}
            />
            <MessageInput />
          </>
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
