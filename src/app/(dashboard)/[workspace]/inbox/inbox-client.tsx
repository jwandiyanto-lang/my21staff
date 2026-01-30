'use client';

import { useState, useRef } from 'react';
import { ConversationList, type ConversationListRef } from '@/components/inbox/conversation-list';
import { MessageView } from '@/components/inbox/message-view';
import type { Id } from 'convex/_generated/dataModel';

type Conversation = {
  id: string;
  phoneNumber: string;
  contactName?: string;
};

interface InboxContentProps {
  workspaceId: Id<'workspaces'>;
}

export function InboxContent({ workspaceId }: InboxContentProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation>();
  const conversationListRef = useRef<ConversationListRef>(null);

  const handleTemplateSent = async (phoneNumber: string) => {
    // Refresh the conversation list and get the updated conversations
    const conversations = await conversationListRef.current?.refresh();

    // Find and select the conversation for the phone number
    if (conversations) {
      const conversation = conversations.find(conv => conv.phoneNumber === phoneNumber);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(undefined);
  };

  return (
    <div className="h-screen flex">
      <ConversationList
        ref={conversationListRef}
        onSelectConversation={setSelectedConversation}
        selectedConversationId={selectedConversation?.id}
        isHidden={!!selectedConversation}
      />
      <MessageView
        conversationId={selectedConversation?.id}
        phoneNumber={selectedConversation?.phoneNumber}
        contactName={selectedConversation?.contactName}
        onTemplateSent={handleTemplateSent}
        onBack={handleBackToList}
        isVisible={!!selectedConversation}
      />
    </div>
  );
}
