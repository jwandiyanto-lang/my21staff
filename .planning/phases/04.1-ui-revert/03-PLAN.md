# Plan 03: Inbox Message Thread

## Objective
Restore full message thread display and compose functionality in inbox right panel.

## Reference
- Original v2.0: `git show c975065:src/app/(dashboard)/[workspace]/inbox/message-thread.tsx`
- Convex messages query: `convex/messages.ts`

---

## Task 1: Create message-thread.tsx component

**File:** `src/components/inbox/message-thread.tsx` (new file)

Basic structure:
```tsx
'use client'

import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'

interface MessageThreadProps {
  conversationId: Id<'conversations'>
  workspaceId: Id<'workspaces'>
}

export function MessageThread({ conversationId, workspaceId }: MessageThreadProps) {
  const messages = useQuery(api.messages.listByConversation, {
    conversation_id: conversationId,
  })

  if (!messages) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex-1 flex flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg._id} message={msg} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
```

**Commit:** `feat(04.1-03): create MessageThread component shell`

---

## Task 2: Add MessageBubble component

**File:** `src/components/inbox/message-thread.tsx`

Add bubble styling:
```tsx
function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div className={cn(
      "flex",
      isOutbound ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] rounded-lg px-3 py-2",
        isOutbound
          ? "bg-primary text-primary-foreground"
          : "bg-muted"
      )}>
        <p className="text-sm">{message.content}</p>
        <p className={cn(
          "text-xs mt-1",
          isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {format(new Date(message.created_at), 'HH:mm')}
        </p>
      </div>
    </div>
  )
}
```

**Commit:** `feat(04.1-03): add MessageBubble with direction styling`

---

## Task 3: Add compose input

**File:** `src/components/inbox/message-thread.tsx`

Add compose bar at bottom:
```tsx
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

// In MessageThread component:
const [message, setMessage] = useState('')
const [isSending, setIsSending] = useState(false)

const handleSend = async () => {
  if (!message.trim() || isSending) return
  setIsSending(true)
  try {
    await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        content: message.trim(),
      }),
    })
    setMessage('')
  } finally {
    setIsSending(false)
  }
}

// JSX:
<div className="border-t p-3 flex gap-2">
  <Input
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    placeholder="Type a message..."
    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
  />
  <Button onClick={handleSend} disabled={isSending || !message.trim()}>
    <Send className="h-4 w-4" />
  </Button>
</div>
```

**Commit:** `feat(04.1-03): add compose input with send`

---

## Task 4: Wire MessageThread into inbox-client

**File:** `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`

Replace placeholder with MessageThread:
```tsx
import { MessageThread } from '@/components/inbox/message-thread'

// In the right panel:
<div className="flex-1 flex flex-col">
  {selectedConversationId ? (
    <MessageThread
      conversationId={selectedConversationId}
      workspaceId={workspaceId}
    />
  ) : (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      Select a conversation to view messages
    </div>
  )}
</div>
```

**Commit:** `feat(04.1-03): wire MessageThread into inbox`

---

## Verification
```bash
npm run build
npm run dev
```
- Select conversation in inbox
- Messages display with correct direction (left/right)
- Compose input visible at bottom
- Send message works via Kapso

---

## Files Created
- `src/components/inbox/message-thread.tsx`

## Files Modified
- `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`

## Estimated Duration
~10 min
