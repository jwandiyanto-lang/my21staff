# Phase 2: Inbox (WhatsApp) - Research

**Researched:** 2026-01-24
**Domain:** WhatsApp messaging UI with Convex real-time subscriptions and Kapso API
**Confidence:** HIGH

## Summary

Phase 2 implements a WhatsApp-style inbox for viewing conversations, reading message threads, and sending messages via the Kapso API. The project already has substantial infrastructure in place: Convex schema with conversations/messages tables, Kapso webhook processing for inbound messages, a working Kapso client library for sending messages, and query hooks for real-time subscriptions.

The research confirms the stack is sound. Convex's `useQuery` hook provides automatic real-time subscriptions - no manual WebSocket management needed. The existing `conversations:listWithFilters` and `messages:listByConversationAsc` queries already support the filtering and message retrieval patterns required. The Kapso client (`src/lib/kapso/client.ts`) is ready for sending text and media messages.

Key UI patterns needed: WhatsApp-style conversation list with avatar/name/preview/timestamp, message bubbles with brand colors, date separators between message groups, auto-scroll to bottom on new messages, and an auto-expanding textarea for composition. The existing inbox skeleton (`InboxSkeleton`) provides the layout target.

**Primary recommendation:** Build custom UI components following WhatsApp conventions, use existing Convex queries/mutations for data, call Kapso API via existing client for sends.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | latest | Real-time database & subscriptions | Project standard, already configured |
| @clerk/nextjs | latest | Auth (Clerk user IDs in messages) | Project standard |
| shadcn/ui | latest | UI components (Button, Badge, Sheet, etc.) | Project standard |
| tailwindcss | 4.x | Styling | Project standard |

### Supporting (Need to Add)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-textarea-autosize | 8.5.x | Auto-expanding compose input | For message composition |
| date-fns | 3.x | Timestamp formatting | Already in project |
| react-dropzone | 14.x | File upload for attachments | For media attachments |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-textarea-autosize | Custom resize | Library handles edge cases (max rows, initial height) |
| react-dropzone | native drag/drop | Library handles browser quirks, file validation |
| date-fns | dayjs | date-fns already in project, no need to add another |

**Installation:**
```bash
npm install react-textarea-autosize react-dropzone
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(dashboard)/[workspace]/
│   └── inbox/
│       ├── page.tsx              # Server component, workspace validation
│       └── inbox-client.tsx      # Client component, main inbox UI
├── components/
│   └── inbox/
│       ├── conversation-list.tsx # Left panel - conversation list
│       ├── conversation-item.tsx # Single conversation row
│       ├── message-thread.tsx    # Right panel - messages
│       ├── message-bubble.tsx    # Single message bubble
│       ├── date-separator.tsx    # "Today", "Yesterday", etc.
│       ├── compose-input.tsx     # Message composition
│       ├── media-preview.tsx     # Image/document preview
│       ├── filter-chips.tsx      # Status/tag filter chips
│       └── empty-state.tsx       # No conversation selected
└── lib/
    └── queries/
        ├── use-conversations.ts  # Already exists
        └── use-messages.ts       # Already exists
```

### Pattern 1: Convex Real-Time Subscriptions
**What:** Use `useQuery` for automatic real-time updates without manual subscription management
**When to use:** All data fetching in inbox components
**Example:**
```typescript
// Source: Existing pattern in use-conversations.ts
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

function useConversations(workspaceId: string, filters: Filters) {
  // useQuery automatically subscribes to changes
  // When Kapso webhook creates new message, this updates instantly
  return useQuery(api.conversations.listWithFilters, {
    workspace_id: workspaceId,
    ...filters,
  })
}
```

### Pattern 2: Message Send Flow
**What:** Optimistic UI update -> Convex mutation -> Kapso API call -> Real message from subscription
**When to use:** Sending outbound messages
**Example:**
```typescript
// 1. Create optimistic message in UI
// 2. Call Convex mutation to store message
// 3. Kapso API send in API route (not client)
// 4. Real-time subscription updates with confirmed message

// Client-side mutation
const sendMessage = useMutation(api.mutations.createOutboundMessage)

async function handleSend(content: string) {
  // Mutation stores in Convex AND triggers Kapso send
  await sendMessage({
    workspace_id: workspaceId,
    conversation_id: conversationId,
    sender_id: userId,
    content,
  })
}
```

### Pattern 3: Auto-Scroll with User Intent Detection
**What:** Scroll to bottom on new messages, but respect user scroll position
**When to use:** Message thread component
**Example:**
```typescript
// Source: Community pattern from react chat apps
const messagesEndRef = useRef<HTMLDivElement>(null)
const containerRef = useRef<HTMLDivElement>(null)
const [isAtBottom, setIsAtBottom] = useState(true)

// Track if user is at bottom
const handleScroll = () => {
  if (!containerRef.current) return
  const { scrollTop, scrollHeight, clientHeight } = containerRef.current
  const threshold = 100 // pixels from bottom
  setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold)
}

// Auto-scroll only if user was already at bottom
useEffect(() => {
  if (isAtBottom) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
}, [messages, isAtBottom])
```

### Pattern 4: Date Separators in Message List
**What:** Group messages by date with visual dividers ("Today", "Yesterday", "Jan 15")
**When to use:** Rendering message thread
**Example:**
```typescript
// Source: WhatsApp convention
function groupMessagesByDate(messages: Message[]) {
  const groups: Map<string, Message[]> = new Map()

  messages.forEach(msg => {
    const date = format(new Date(msg.created_at), 'yyyy-MM-dd')
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date)!.push(msg)
  })

  return groups
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Hari Ini'
  if (isYesterday(date)) return 'Kemarin'
  return format(date, 'd MMMM yyyy', { locale: id })
}
```

### Anti-Patterns to Avoid
- **Polling for updates:** Convex subscriptions are real-time, never use setInterval
- **Client-side Kapso calls:** Always route through API/mutation to protect credentials
- **Manual WebSocket management:** Convex handles this automatically
- **Fetching all messages at once:** Use pagination for history, recent messages for display

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auto-expanding textarea | Manual resize with scrollHeight | react-textarea-autosize | Handles max rows, min rows, resize on paste |
| File drag/drop | Native HTML5 drag events | react-dropzone | Browser quirks, file validation, preview URLs |
| Phone number formatting | Regex-based formatter | Existing `normalizePhone()` in codebase | Already handles all cases |
| Timestamp formatting | Manual date math | date-fns with locale | i18n, relative times, edge cases |
| Real-time subscriptions | WebSocket code | Convex useQuery | Automatic reconnection, optimistic updates |

**Key insight:** The Convex + Kapso infrastructure already handles the hard parts. Focus on UI components.

## Common Pitfalls

### Pitfall 1: Convex ID Type Mismatch
**What goes wrong:** Passing string IDs to Convex queries that expect `Id<"tableName">`
**Why it happens:** Schema types differ from runtime types
**How to avoid:** Use `as any` casts (already done in codebase) or ensure proper typing
**Warning signs:** TypeScript errors about Id types

### Pitfall 2: Message Order Inconsistency
**What goes wrong:** Messages appear in wrong order after optimistic update
**Why it happens:** Optimistic message has different timestamp than server message
**How to avoid:** Always sort by `created_at`, let Convex subscription replace optimistic message
**Warning signs:** Messages "jumping" after send completes

### Pitfall 3: Kapso Credentials Exposure
**What goes wrong:** API key exposed in client bundle
**Why it happens:** Calling Kapso API directly from React component
**How to avoid:** Always use API routes or Convex actions for Kapso calls
**Warning signs:** `meta_access_token` in client code

### Pitfall 4: Scroll Position Lost on Re-render
**What goes wrong:** User scrolled up to read old messages, new message forces scroll to bottom
**Why it happens:** Naive auto-scroll implementation
**How to avoid:** Track user scroll intent, only auto-scroll if user was already at bottom
**Warning signs:** User complaints about "jumping" chat

### Pitfall 5: WhatsApp 24-Hour Window
**What goes wrong:** Message send fails silently
**Why it happens:** WhatsApp requires template messages after 24h without customer reply
**How to avoid:** Track last customer message time, show warning in UI, use templates
**Warning signs:** Kapso API returns 400 errors for sends

## Code Examples

Verified patterns from official sources:

### Conversation List Item
```typescript
// WhatsApp-style conversation item
interface ConversationItemProps {
  conversation: ConversationWithContact
  isSelected: boolean
  onClick: () => void
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const { contact, last_message_preview, last_message_at, unread_count } = conversation
  const displayName = contact?.name || contact?.kapso_name || contact?.phone || 'Unknown'

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors',
        isSelected && 'bg-muted'
      )}
      onClick={onClick}
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground truncate">
            {last_message_preview}
          </span>
          {unread_count > 0 && (
            <Badge variant="default" className="ml-2 h-5 min-w-5 rounded-full">
              {unread_count}
            </Badge>
          )}
        </div>
        {/* CRM Tags */}
        {contact?.tags && contact.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {contact.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs px-1 h-4">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Message Bubble
```typescript
// Brand colors for message bubbles (not WhatsApp green)
function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div className={cn(
      'flex',
      isOutbound ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[70%] rounded-lg px-4 py-2',
        isOutbound
          ? 'bg-primary text-primary-foreground'  // Brand color
          : 'bg-muted'  // Inbound
      )}>
        {message.message_type === 'image' ? (
          <img
            src={message.media_url}
            alt="Image"
            className="rounded max-w-full"
          />
        ) : message.message_type === 'document' ? (
          <DocumentCard
            filename={message.metadata?.filename}
            url={message.media_url}
          />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        <div className={cn(
          'flex items-center justify-end gap-1 mt-1',
          isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          <span className="text-xs">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {isOutbound && <MessageStatus status={message.metadata?.status} />}
        </div>
      </div>
    </div>
  )
}
```

### Compose Input with Auto-Expand
```typescript
// Source: react-textarea-autosize npm
import TextareaAutosize from 'react-textarea-autosize'

function ComposeInput({ onSend }: { onSend: (content: string) => void }) {
  const [content, setContent] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter sends, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (content.trim()) {
        onSend(content)
        setContent('')
      }
    }
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t">
      <TextareaAutosize
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ketik pesan..."
        minRows={1}
        maxRows={5}
        className="flex-1 resize-none rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
      />
      <Button
        onClick={() => { onSend(content); setContent('') }}
        disabled={!content.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase realtime | Convex subscriptions | v3.2 migration | Simpler code, automatic reconnection |
| TanStack Query for mutations | Convex useMutation | v3.2 migration | Type-safe, no cache invalidation needed |
| Polling conversations | Convex useQuery | v3.2 migration | Real-time without polling |

**Deprecated/outdated:**
- Supabase client: Removed in v3.2, use Convex
- API routes for conversations list: Can use Convex directly from client
- Manual subscription management: Convex handles automatically

## Open Questions

Things that couldn't be fully resolved:

1. **Message Status Updates (Read Receipts)**
   - What we know: Kapso supports `whatsapp.message.read` webhook events
   - What's unclear: Current webhook handler may not process status updates
   - Recommendation: Add status update processing to webhook handler, store in message metadata

2. **24-Hour Message Window Handling**
   - What we know: WhatsApp requires template messages after 24h without customer reply
   - What's unclear: How to show this in UI, template selection flow
   - Recommendation: Track last_customer_message_at, show warning banner when approaching window close

3. **Media Upload to Convex Storage**
   - What we know: `storage.generateUploadUrl()` and `storage.getUrl()` exist
   - What's unclear: Full flow for uploading then sending via Kapso
   - Recommendation: Implement in Phase 2 or defer media attachments

## Sources

### Primary (HIGH confidence)
- Existing codebase: `convex/conversations.ts`, `convex/messages.ts`, `convex/kapso.ts`
- Existing codebase: `src/lib/kapso/client.ts` - Kapso API wrapper
- Existing codebase: `src/lib/queries/use-conversations.ts`, `use-messages.ts`
- Convex docs: Real-time subscriptions via useQuery

### Secondary (MEDIUM confidence)
- [Convex Tutorial](https://docs.convex.dev/tutorial/) - Chat app patterns
- [Convex Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates) - Mutation patterns
- [react-textarea-autosize](https://www.npmjs.com/package/react-textarea-autosize) - v8.5.9
- [WhatsApp Check Marks](https://www.pandasecurity.com/en/mediacenter/whatsapp-check-marks/) - Status semantics

### Tertiary (LOW confidence)
- [Kapso API Webhooks](https://docs.kapso.ai/docs/integrations/api-webhooks) - Status webhook events (URL 404, but Kapso client in codebase works)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project infrastructure
- Architecture: HIGH - Patterns verified in existing codebase
- Pitfalls: MEDIUM - Based on common chat app issues and Kapso specifics
- Code examples: HIGH - Based on existing codebase patterns

**Research date:** 2026-01-24
**Valid until:** 30 days (stable stack, no major updates expected)
