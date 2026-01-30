'use client'

import { useState, useEffect } from 'react'
import { Search, MessageSquare, Clock, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/ui/avatar'
import { isDevMode, MOCK_WHATSAPP_CONVERSATIONS } from '@/lib/mock-whatsapp-data'
import type { Id } from 'convex/_generated/dataModel'

interface Conversation {
  id: string
  phoneNumber: string
  contactName?: string
  status: string
  lastActiveAt: string
  messagesCount: number
  lastMessage: {
    content: string
    direction: 'inbound' | 'outbound'
    type: string
  }
}

interface ConversationListProps {
  workspaceId: Id<'workspaces'>
  selectedConversationId?: string
  onSelectConversation: (conversationId: string) => void
}

export function ConversationList({ workspaceId, selectedConversationId, onSelectConversation }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    try {
      setError(null)

      // Dev mode: use mock data
      if (isDevMode()) {
        setConversations(MOCK_WHATSAPP_CONVERSATIONS)
        setLoading(false)
        return
      }

      // Production: fetch from API
      const response = await fetch(`/api/whatsapp/conversations?workspace=${workspaceId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fall back to mock data on error
      setConversations(MOCK_WHATSAPP_CONVERSATIONS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()

    // Auto-poll every 10 seconds in production
    if (!isDevMode()) {
      const interval = setInterval(fetchConversations, 10000)
      return () => clearInterval(interval)
    }
  }, [workspaceId])

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      conv.phoneNumber.toLowerCase().includes(searchLower) ||
      (conv.contactName?.toLowerCase().includes(searchLower) ?? false) ||
      conv.lastMessage.content.toLowerCase().includes(searchLower)
    )
  })

  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    return `${diffDays}d`
  }

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Header with search */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Dev mode indicator */}
      {isDevMode() && (
        <div className="px-4 py-2 bg-accent/10 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono">Offline Mode</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-destructive/10 border-b border-border">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No conversations found</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Start a conversation to see it here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-4 flex items-start gap-3 transition-colors hover:bg-muted/50 ${
                  selectedConversationId === conv.id ? 'bg-muted' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  {conv.contactName ? (
                    <Avatar className="h-12 w-12 bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {conv.contactName.charAt(0).toUpperCase()}
                    </Avatar>
                  ) : (
                    <Avatar className="h-12 w-12 bg-muted text-muted-foreground flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </Avatar>
                  )}
                  {conv.status === 'active' && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-accent border-2 border-card" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {conv.contactName || conv.phoneNumber}
                    </h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {formatTime(conv.lastActiveAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage.direction === 'inbound' && (
                      <span className="mr-1">You:</span>
                    )}
                    {conv.lastMessage.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {conv.phoneNumber}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
