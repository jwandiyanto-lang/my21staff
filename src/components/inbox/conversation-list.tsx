'use client';

import { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { format, isValid, isToday, isYesterday } from 'date-fns';
import { RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MOCK_CONVERSATIONS } from '@/lib/mock-data';
import type { Id } from 'convex/_generated/dataModel';

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

type Conversation = {
  id: string;
  phoneNumber: string;
  status: string;
  lastActiveAt: string;
  phoneNumberId: string;
  metadata?: Record<string, unknown>;
  contactName?: string;
  messagesCount?: number;
  lastMessage?: {
    content: string;
    direction: string;
    type?: string;
  };
};

function formatConversationDate(timestamp: string | number): string {
  try {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    if (!isValid(date)) return '';

    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  } catch {
    return '';
  }
}

function getAvatarInitials(contactName?: string, phoneNumber?: string): string {
  if (contactName) {
    const words = contactName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return contactName.slice(0, 2).toUpperCase();
  }

  if (phoneNumber) {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.slice(-2);
  }

  return '??';
}

type Props = {
  workspaceId: Id<'workspaces'>;
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  isHidden?: boolean;
};

export type ConversationListRef = {
  refresh: () => Promise<Conversation[]>;
  selectByPhoneNumber: (phoneNumber: string) => void;
};

export const ConversationList = forwardRef<ConversationListRef, Props>(
  ({ workspaceId, onSelectConversation, selectedConversationId, isHidden = false }, ref) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Use Convex query for conversations
  const convexConversations = useQuery(
    api.conversations.listByWorkspace,
    !isDevMode
      ? { workspace_id: workspaceId }
      : 'skip'
  );

  // Transform Convex data to match UI format
  const conversations = useMemo<Conversation[]>(() => {
    // Dev mode: use mock data
    if (isDevMode) {
      return MOCK_CONVERSATIONS.map(conv => ({
        id: conv.id,
        phoneNumber: conv.contact.phone,
        contactName: conv.contact.name,
        status: conv.status,
        lastActiveAt: conv.last_message_at,
        phoneNumberId: 'mock-phone-id',
        metadata: {},
        messagesCount: 5,
        lastMessage: {
          content: conv.last_message_preview,
          direction: 'inbound' as const,
          type: 'text' as const,
        },
      }));
    }

    // Production: transform Convex data
    if (!convexConversations) return [];

    return convexConversations.map(conv => ({
      id: conv._id,
      phoneNumber: conv.contact?.phone || 'Unknown',
      contactName: conv.contact?.name || conv.contact?.kapso_name || undefined,
      status: conv.status,
      lastActiveAt: conv.last_message_at ? String(conv.last_message_at) : conv.updated_at ? String(conv.updated_at) : '',
      phoneNumberId: '',
      metadata: {},
      messagesCount: 0,
      lastMessage: conv.last_message_preview ? {
        content: conv.last_message_preview,
        direction: 'inbound' as const,
        type: 'text' as const,
      } : undefined,
    }));
  }, [convexConversations]);

  const loading = !isDevMode && convexConversations === undefined;

  const selectByPhoneNumber = (phoneNumber: string) => {
    const conversation = conversations.find(conv => conv.phoneNumber === phoneNumber);
    if (conversation) {
      onSelectConversation(conversation);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      // Convex handles reactivity - no manual refresh needed
      return conversations;
    },
    selectByPhoneNumber
  }));

  const filteredConversations = conversations.filter((conv) => {
    const query = searchQuery.toLowerCase();
    return (
      conv.phoneNumber.toLowerCase().includes(query) ||
      conv.contactName?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className={cn(
        "w-full md:w-96 border-r border-[#d1d7db] bg-white flex flex-col",
        isHidden && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-[#d1d7db] bg-[#f0f2f5]">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="flex-1 p-3 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full md:w-96 border-r border-[#d1d7db] bg-white flex flex-col",
      isHidden && "hidden md:flex"
    )}>
      <div className="p-4 border-b border-[#d1d7db] bg-[#f0f2f5]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#111b21]">Chats</h1>
            {/* Green indicator for real-time Convex connection */}
            <div
              className="h-2 w-2 rounded-full bg-green-500"
              title="Real-time sync"
            />
          </div>
          <Button
            onClick={() => {}} // No-op - Convex handles reactivity
            variant="ghost"
            size="icon"
            className="text-[#667781] hover:bg-[#d1d7db]/30"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667781]" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="pl-9 bg-white border-[#d1d7db] focus-visible:ring-[#00a884] rounded-lg"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 h-0 overflow-hidden">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-[#667781]">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="w-full overflow-hidden">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={cn(
                'w-full p-3 pr-4 border-b border-[#e9edef] hover:bg-[#f0f2f5] text-left transition-colors relative overflow-hidden',
                selectedConversationId === conversation.id && 'bg-[#f0f2f5]'
              )}
            >
              <div className="flex gap-3 items-start overflow-hidden">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className="bg-[#d1d7db] text-[#111b21] text-sm font-medium">
                    {getAvatarInitials(conversation.contactName, conversation.phoneNumber)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 flex justify-between items-start gap-4 overflow-hidden">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium text-[#111b21] truncate">
                      {conversation.contactName || conversation.phoneNumber}
                    </p>
                    {conversation.lastMessage && (
                      <p className="text-sm text-[#667781] truncate mt-0.5">
                        {conversation.lastMessage.direction === 'outbound' && (
                          <span className="text-[#53bdeb]">✓ </span>
                        )}
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-[#667781] flex-shrink-0 mt-0.5 ml-4">
                    {formatConversationDate(conversation.lastActiveAt)}
                  </span>
                </div>
              </div>
            </button>
          ))
          }
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

ConversationList.displayName = 'ConversationList';
