'use client'

import { useState } from 'react'
import { ConversationList } from '@/components/inbox/conversation-list'
import { MessageView } from '@/components/inbox/message-view'
import type { Id } from 'convex/_generated/dataModel'

interface InboxContentProps {
  workspaceId: Id<'workspaces'>
}

export function InboxContent({ workspaceId }: InboxContentProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()

  return (
    <>
      <ConversationList
        workspaceId={workspaceId}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />
      <MessageView workspaceId={workspaceId} conversationId={selectedConversationId} />
    </>
  )
}
