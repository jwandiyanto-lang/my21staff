# Phase 3: Inbox Core - Research

**Researched:** 2026-01-14
**Domain:** Kapso WhatsApp API + React chat inbox UI
**Confidence:** HIGH

<research_summary>
## Summary

Researched the Kapso API for fetching WhatsApp conversations and messages, and React patterns for building chat inbox UIs. The v1 codebase already has a working webhook handler that saves inbound messages to Supabase, and a partial inbox UI with conversation list but placeholder message area.

Key finding: Kapso provides a complete SDK (`@kapso/whatsapp-cloud-api`) with `client.conversations` and `client.messages` modules for fetching data. However, since v1 already saves messages to Supabase via webhooks, we can query our local database instead of polling Kapso API - this is more efficient and gives us control over data freshness.

**Primary recommendation:** Fetch conversations and messages from Supabase (already populated by webhook). Use React 19's `useOptimistic` for send operations (Phase 4). For MVP, no real-time - just page refresh or manual polling.
</research_summary>

<standard_stack>
## Standard Stack

### Core (Already in v1/v2)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Client | 2.x | Database queries | Already configured, RLS policies ready |
| date-fns | 3.x | Date formatting | Already installed in v2 |
| Shadcn/ui | latest | UI components | ScrollArea, Avatar, Badge already installed |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | optional | Data fetching | If we need auto-refresh, not MVP |
| Supabase Realtime | included | Live updates | Future - not MVP |

### Not Needed
| Instead of | Skip Because |
|------------|--------------|
| Kapso SDK for fetching | Messages already in Supabase via webhook |
| SWR | Overkill for MVP, simple fetch is enough |
| WebSockets | Future enhancement, not MVP |

**Installation:**
Already have everything needed. No new dependencies required.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/app/(dashboard)/[workspace]/inbox/
├── page.tsx              # Server component - fetch initial data
├── inbox-client.tsx      # Client component - list + messages
├── conversation-list.tsx # Left sidebar conversation list
├── message-thread.tsx    # Right side message display
└── message-input.tsx     # Input area (Phase 4)
```

### Pattern 1: Server Component Data Fetching
**What:** Fetch conversations with contacts in server component, pass to client
**When to use:** Initial page load
**Example:**
```typescript
// page.tsx
export default async function InboxPage({ params }) {
  const { workspace } = await params
  const supabase = await createClient()

  // Get conversations with contacts, ordered by last message
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, contact:contacts(*)')
    .eq('workspace_id', workspaceId)
    .order('last_message_at', { ascending: false })

  return <InboxClient conversations={conversations} />
}
```

### Pattern 2: Lazy Load Messages on Selection
**What:** Only fetch messages when conversation is selected
**When to use:** Avoid loading all messages upfront
**Example:**
```typescript
// Inside client component
const [messages, setMessages] = useState<Message[]>([])

const loadMessages = async (conversationId: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  setMessages(data || [])
}

// On conversation select:
useEffect(() => {
  if (selectedConversation) {
    loadMessages(selectedConversation.id)
  }
}, [selectedConversation])
```

### Pattern 3: Message Bubble Styling
**What:** Visual distinction between inbound and outbound messages
**When to use:** All message displays
**Example:**
```typescript
function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div className={cn(
      "max-w-[70%] rounded-lg px-4 py-2",
      isOutbound
        ? "ml-auto bg-primary text-primary-foreground"
        : "bg-muted"
    )}>
      <p>{message.content}</p>
      <span className="text-xs opacity-70">
        {format(new Date(message.created_at), 'HH:mm')}
      </span>
    </div>
  )
}
```

### Pattern 4: Status Filtering
**What:** Filter conversations by lead status
**When to use:** User wants to focus on hot leads, etc.
**Example:**
```typescript
const [statusFilter, setStatusFilter] = useState<string[]>([])

const filteredConversations = conversations.filter(conv =>
  statusFilter.length === 0 ||
  statusFilter.includes(conv.contact.lead_status)
)
```

### Anti-Patterns to Avoid
- **Fetching from Kapso API for display:** Messages already in Supabase, no need to call external API
- **Loading all messages for all conversations:** Lazy load on selection
- **Real-time subscriptions for MVP:** Adds complexity, do manual refresh first
- **Complex state management:** useState is sufficient for MVP inbox
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Message fetching from Kapso | Custom API calls | Supabase queries | Already have data via webhook |
| Conversation list UI | Custom list | Adapt v1's inbox-layout.tsx | Already 80% done |
| Message timestamps | Manual formatting | date-fns format/formatDistanceToNow | Edge cases handled |
| Scroll to bottom | Manual scroll logic | ScrollArea + ref.scrollIntoView | Works reliably |
| Lead status colors | Hardcoded strings | lib/lead-status.ts from Phase 2 | Already built |

**Key insight:** v1 already has the foundation - conversation list UI, message schema, webhook handler. Phase 3 is about connecting the dots, not building from scratch.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: N+1 Query Problem
**What goes wrong:** Fetching messages in a loop for each conversation
**Why it happens:** Loading messages for all conversations upfront
**How to avoid:** Only fetch messages for selected conversation
**Warning signs:** Slow page load, many DB queries in logs

### Pitfall 2: Missing Scroll to Latest
**What goes wrong:** User has to scroll down to see new messages
**Why it happens:** Forgot to scroll to bottom on load/new message
**How to avoid:** useEffect with scrollIntoView on message list change
**Warning signs:** Messages start at top, user complaints

### Pitfall 3: Stale Conversation List
**What goes wrong:** New messages don't appear without refresh
**Why it happens:** No re-fetch mechanism
**How to avoid:** For MVP, add refresh button. Later, Supabase realtime.
**Warning signs:** User reports missing messages

### Pitfall 4: Slow Message List Rendering
**What goes wrong:** UI stutters with many messages
**Why it happens:** Rendering hundreds of message components
**How to avoid:** Virtualization for long threads (react-window), or pagination
**Warning signs:** Lag when opening conversation with 100+ messages
</common_pitfalls>

<code_examples>
## Code Examples

### Supabase Message Query (from v1 schema)
```typescript
// Fetch messages for a conversation
const { data: messages } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true })
  .limit(100) // Prevent loading too many
```

### Scroll to Bottom Pattern
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])

// In JSX:
<div className="flex flex-col gap-2">
  {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
  <div ref={messagesEndRef} />
</div>
```

### Conversation with Unread Badge
```typescript
// Already in v1's inbox-layout.tsx
{conversation.unread_count > 0 && (
  <Badge variant="default" className="h-5 px-1.5">
    {conversation.unread_count}
  </Badge>
)}
```

### Mark Conversation as Read
```typescript
const markAsRead = async (conversationId: string) => {
  await supabase
    .from('conversations')
    .update({ unread_count: 0 })
    .eq('id', conversationId)
}
```
</code_examples>

<kapso_api_reference>
## Kapso API Reference (For Future Use)

While we're using Supabase for data, here's the Kapso API structure for reference:

### Fetch Conversations
```typescript
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api'

const client = new WhatsAppClient({
  baseUrl: 'https://api.kapso.ai/meta/whatsapp',
  kapsoApiKey: process.env.KAPSO_API_KEY
})

// List conversations (Kapso stores these)
const conversations = await client.conversations.list({
  phoneNumberId: PHONE_NUMBER_ID,
  status: 'open', // optional filter
  limit: 50,
  after: cursor // pagination
})
```

### Fetch Messages
```typescript
// By conversation
const messages = await client.messages.listByConversation({
  phoneNumberId: PHONE_NUMBER_ID,
  conversationId: CONVERSATION_ID
})

// Or query with filters
const messages = await client.messages.query({
  phoneNumberId: PHONE_NUMBER_ID,
  direction: 'inbound',
  since: '2025-01-01T00:00:00Z',
  limit: 50
})
```

**Note:** These APIs exist but we don't need them for MVP - webhook already saves to Supabase.
</kapso_api_reference>

<v1_reference>
## V1 Codebase Reference

**Files to copy/adapt:**
- `src/app/(dashboard)/[workspace]/inbox/inbox-layout.tsx` - Conversation list UI (80% done)
- `src/app/(dashboard)/[workspace]/inbox/page.tsx` - Data fetching pattern
- `src/lib/kapso/client.ts` - Kapso client (for Phase 4 sending)
- `src/app/api/webhook/kapso/route.ts` - Webhook handler (already saves messages)

**What v1 is missing (our work):**
1. Message display in conversation thread
2. Loading messages on conversation select
3. Lead status filtering
4. Dev mode bypass (like Phase 2)

**Database tables used:**
- `conversations` - with contact join
- `messages` - direction, content, message_type, created_at
- `contacts` - lead_status, lead_score, name, phone
</v1_reference>

<open_questions>
## Open Questions

1. **Pagination for long conversations**
   - What we know: 100+ messages possible per conversation
   - What's unclear: Do we need virtualization or just limit?
   - Recommendation: Start with limit(100), add "load more" button if needed

2. **Real-time updates**
   - What we know: Supabase Realtime exists, webhook already saves messages
   - What's unclear: Is real-time needed for MVP?
   - Recommendation: Skip for MVP. Manual refresh button. Add Realtime in Phase 4 or later.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- v1 codebase: `~/Desktop/21/my21staff/` - Working webhook, inbox UI, schema
- Kapso lessons: `BRAIN/Kapso Lessons/` - API patterns, SDK usage

### Secondary (MEDIUM confidence)
- [Kapso docs](https://docs.kapso.ai/docs/whatsapp/send-messages/text) - API endpoints
- [Kapso SDK GitHub](https://github.com/gokapso/whatsapp-cloud-api-js) - Client methods

### Tertiary (Patterns only)
- React 19 useOptimistic docs - For Phase 4 optimistic send
- Next.js 15 data fetching patterns - Server/client component split
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Supabase queries, Kapso SDK (reference only)
- Ecosystem: v1 codebase patterns, Shadcn/ui components
- Patterns: Server/client component split, lazy message loading
- Pitfalls: N+1 queries, scroll behavior, stale data

**Confidence breakdown:**
- Standard stack: HIGH - Using existing tools, no new deps
- Architecture: HIGH - Adapting proven v1 patterns
- Pitfalls: HIGH - Common React/chat patterns
- Code examples: HIGH - From v1 codebase and Supabase docs

**Research date:** 2026-01-14
**Valid until:** 2026-02-14 (30 days - stable tech, local codebase)
</metadata>

---

*Phase: 03-inbox-core*
*Research completed: 2026-01-14*
*Ready for planning: yes*
