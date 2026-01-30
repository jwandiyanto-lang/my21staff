# Phase 4: Inbox UI & Filtering - Research

**Researched:** 2026-01-27
**Domain:** React/Next.js WhatsApp-style messaging UI with status/tag filtering
**Confidence:** HIGH (existing codebase analysis) + MEDIUM (Kapso component research)

## Summary

Phase 4 replaces the existing custom inbox with a WhatsApp-first UI while adding real-time status and tag filtering. The codebase already has foundational inbox components in place (message bubbles, conversation list, message thread), and the task is to enhance styling to match Kapso's aesthetic and implement filtering logic that's already partially present.

**Key findings:**
- Current implementation uses Shadcn/ui + custom message bubbles; Kapso provides reference architecture, not pre-built components
- Status filtering infrastructure exists (lead statuses: hot/warm/cold/new/client/lost); needs UI conversion to tabs
- Tag filtering already works with AND logic; needs UI refinement and real-time counts
- Message thread has auto-scroll and optimistic UI patterns; needs refinement for Kapso styling
- Critical: Whatsapp-style UX requires careful handling of scroll position, auto-scroll, and "new messages" indicators

**Primary recommendation:** Refine existing component architecture with Kapso styling patterns rather than replacing. Focus on visual polish, real-time filter counts via Convex subscriptions, and proper WhatsApp-style scroll behavior.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15+ | React framework with SSR | Project standard, enables dev mode |
| React | 19+ | UI components | Project standard |
| TypeScript | Latest | Type safety | Project standard for inbox |
| Shadcn/ui | Latest | Base UI primitives | Project standard for consistency |
| Tailwind CSS | Latest | Styling | Project standard, used in current inbox |
| Convex | Latest | Real-time database + subscriptions | Project standard for inbox queries + live updates |

### Message Display
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | Latest | Date formatting (timestamps) | Already used in current message-bubble |
| lucide-react | Latest | Icons (send, menu, filter, etc.) | Already used in inbox-client |

### Filtering & State
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useMemo (built-in) | N/A | Filter memoization | Prevents unnecessary re-renders during filtering |
| Convex subscriptions (useQuery) | Latest | Real-time message/conversation updates | Real-time filter counts, new messages |

**Installation:**
```bash
# All already in project - no new npm packages needed
npm install  # Re-run after adding any utilities
```

### Why No Additional Libraries

Kapso is a **reference/inspiration**, not a dependency. The whatsapp-cloud-inbox GitHub repo shows component patterns (conversation list layout, message bubble styling, input area structure) but is not published as an npm package. Current project already has the foundational components; the task is to enhance them with Kapso aesthetic principles.

## Architecture Patterns

### Recommended Project Structure (Current + Enhancements)

```
src/
├── components/
│   ├── inbox/
│   │   ├── inbox-client.tsx           # Root container, state management
│   │   ├── conversation-list.tsx      # Left sidebar conversation items
│   │   ├── message-thread.tsx         # Center: message display + auto-scroll
│   │   ├── message-bubble.tsx         # Individual message styling
│   │   ├── message-status.tsx         # Delivery status indicator
│   │   ├── compose-input.tsx          # Message input area
│   │   ├── filter-tabs.tsx            # STATUS TABS (new - refactored from popover)
│   │   ├── tag-filter-dropdown.tsx    # TAG FILTER (new - extracted for clarity)
│   │   └── date-separator.tsx         # Visual separator between dates
├── lib/
│   ├── lead-status.ts                 # Status config (already exists)
│   └── queries/                       # Convex queries
└── app/
    └── (dashboard)/
        └── [workspace]/
            └── inbox/
                └── inbox-client.tsx   # Server wrapper
```

### Pattern 1: Filter State Management in inbox-client

**What:** Centralized state for status filter, tag filter, and view mode in the root inbox-client component. Filters applied client-side (already implemented) or server-side via Convex queries.

**When to use:** This is the current pattern and should be maintained. Convex `listWithFilters` query accepts `statusFilters` and `tagFilters` arrays.

**Example:**
```typescript
// Source: Current inbox-client.tsx
const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
const [tagFilter, setTagFilter] = useState<string[]>([])

const convexData = useQuery(
  api.conversations.listWithFilters,
  isDevMode() ? 'skip' : {
    workspace_id: workspaceId,
    statusFilters: statusFilter.length > 0 ? statusFilter : undefined,
    tagFilters: tagFilter.length > 0 ? tagFilter : undefined,
  }
)

// Client-side filtering (dev mode fallback)
const filteredConversations = useMemo(() => {
  let filtered = [...data.conversations]

  // Filter by status (OR logic: any selected status matches)
  if (statusFilter.length > 0) {
    filtered = filtered.filter(conv => {
      const status = (conv.contact?.lead_status || 'prospect') as LeadStatus
      return statusFilter.includes(status)
    })
  }

  // Filter by tags (AND logic: conversation must have ALL selected tags)
  if (tagFilter.length > 0) {
    filtered = filtered.filter(conv => {
      if (!conv.contact?.tags) return false
      return tagFilter.every(tag => conv.contact.tags?.includes(tag))
    })
  }

  return filtered
}, [data.conversations, statusFilter, tagFilter])
```

**Key insight:** Status filters use OR logic (show conversations matching ANY selected status), but tag filters use AND logic (show conversations with ALL selected tags). This is explicitly documented in CONTEXT.md.

### Pattern 2: Real-Time Filter Counts via Convex Subscriptions

**What:** Display conversation counts per status tab (e.g., "Hot (5)", "Warm (12)") that update in real-time when conversations are created, updated, or status changes.

**When to use:** For the status tabs UI, use a separate Convex query that groups by status and returns counts. This query re-runs automatically when conversation data changes.

**Example:**
```typescript
// Convex function (new):
export const getConversationCountsByStatus = query({
  args: { workspace_id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_workspace", q => q.eq("workspace_id", args.workspace_id))
      .collect()

    const counts = new Map<string, number>()
    for (const conv of conversations) {
      const contact = await ctx.db.get(conv.contact_id)
      const status = (contact?.lead_status || "new") as LeadStatus
      counts.set(status, (counts.get(status) || 0) + 1)
    }

    return Object.fromEntries(counts)
  }
})

// React component:
const statusCounts = useQuery(
  api.conversations.getConversationCountsByStatus,
  { workspace_id: workspaceId }
)

// In UI:
<button className={...}>
  Hot {statusCounts?.hot > 0 && `(${statusCounts.hot})`}
</button>
```

**Key insight:** Convex automatically re-runs queries when underlying data changes, so counts stay in sync without manual polling.

### Pattern 3: WhatsApp-Style Auto-Scroll Behavior

**What:** Message thread scrolls to bottom automatically when user is already at bottom, but shows a "new messages" indicator when new messages arrive while user is scrolled up.

**When to use:** Standard for messaging apps. Current implementation in message-thread.tsx uses scroll threshold; enhance with visual indicator.

**Example:**
```typescript
// Source: Current message-thread.tsx pattern
const [isAtBottom, setIsAtBottom] = useState(true)
const [showNewIndicator, setShowNewIndicator] = useState(false)

const handleScroll = () => {
  if (!containerRef.current) return
  const { scrollTop, scrollHeight, clientHeight } = containerRef.current
  const threshold = 100 // pixels from bottom
  const atBottom = scrollHeight - scrollTop - clientHeight < threshold
  setIsAtBottom(atBottom)
  setShowNewIndicator(!atBottom && messages.length > lastKnownLength)
}

useEffect(() => {
  if (isAtBottom && messages && messages.length > 0) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowNewIndicator(false)
  }
}, [messages, isAtBottom])

// UI:
{showNewIndicator && (
  <div className="sticky bottom-4 left-0 right-0 flex justify-center">
    <button className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
      New messages ↓
    </button>
  </div>
)}
```

**Key insight:** Threshold of 100px from bottom is standard; 50-200px range is safe. Too sensitive = scrolls on every message, too loose = misses user being at bottom.

### Pattern 4: Optimistic UI for Message Sending

**What:** Message appears immediately in thread with "sending" indicator before Convex mutation completes. Rolls back on error.

**When to use:** Required for responsive messaging UX. Convex has built-in optimistic update support.

**Example:**
```typescript
// Source: Convex docs pattern
const sendMessage = useMutation(api.messages.send)
  .withOptimisticUpdate(ctx => {
    const current = ctx.getQuery(api.messages.listByConversationAsc, {
      conversation_id: conversationId
    }) || []

    ctx.setQuery(api.messages.listByConversationAsc,
      { conversation_id: conversationId },
      [
        ...current,
        {
          _id: crypto.randomUUID(),
          content: text,
          direction: 'outbound',
          created_at: Date.now(),
          metadata: { status: 'sending' },
          // ... other fields
        }
      ]
    )
  })
```

**Key insight:** Optimistic updates roll back automatically if mutation fails; no manual cleanup needed.

### Anti-Patterns to Avoid

- **Hard-coded "hot/warm/cold/new/client/lost" status values:** Use LEAD_STATUS_CONFIG from lib/lead-status.ts instead. Workspace can override statuses in settings.
- **Filtering ALL conversations on every keystroke:** Use `useMemo` with dependencies to prevent re-renders. Convex `listWithFilters` query handles server-side filtering.
- **Fetching entire message history on load:** Already handled by `listByConversationAsc` query; pagination/virtualization can be added later if performance degrades.
- **Manual scroll management without tracking scroll position:** Always check if user is at bottom before auto-scrolling. Use scroll event listener.
- **Missing dev mode checks in new components:** All new components that use Convex queries or Clerk must check `isDevMode()` and skip services if in dev mode.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Message timestamp formatting | Custom date logic | date-fns (already in project) | Handles all edge cases: relative time, locale, DST |
| Message scroll-to-bottom behavior | Manual scroll calculation | Ref + useEffect pattern (current) | Scroll container state is complex; use library or proven pattern |
| Real-time conversation counts | Polling endpoint every N seconds | Convex subscriptions (useQuery) | Polling wastes resources; Convex pushes updates automatically |
| Filter state persistence | localStorage manually | Convex workspaceMembers.settings field | Syncs across devices, survives logout, backed up |
| Status/tag data structure | Hard-coded arrays | LEAD_STATUS_CONFIG + workspace config | Single source of truth; workspace can override |
| Optimistic UI for messages | Manual state rollback | Convex `.withOptimisticUpdate()` | Automatic rollback on failure; no race conditions |

**Key insight:** Convex is the project's backend, and its query subscriptions + optimistic updates are specifically designed to replace polling and manual state sync. Don't fight the framework.

## Common Pitfalls

### Pitfall 1: Scroll Position Lost on Filter Change
**What goes wrong:** User scrolls through conversations, selects a status filter, and the list jumps to top. Disorients user and loses scroll context.

**Why it happens:** Filter state change triggers re-render of ConversationList, but scroll position isn't preserved.

**How to avoid:**
- Keep conversation scroll position in a ref/state if it's critical
- Consider showing a "filters applied" banner so user understands why list changed
- Convex `listWithFilters` returns filtered data; React keeps scroll position if key doesn't change

**Warning signs:** User opens devtools and sees conversation list re-mounting on filter change.

### Pitfall 2: "AND" vs "OR" Filter Logic Confusion
**What goes wrong:** User selects multiple tags expecting ANY tag to match (OR logic), but gets only conversations with ALL tags (AND logic). Frustration when no results appear.

**Why it happens:** Context.md explicitly specifies AND logic for tags, but wasn't clearly communicated in UI.

**How to avoid:**
- Add tooltip or help text: "Shows conversations with ALL selected tags"
- Consider supporting both AND/OR modes if context changes
- Current implementation already does AND; document it in code comments

**Warning signs:** User feedback: "I selected two tags but nothing shows up."

### Pitfall 3: Auto-Scroll Disabled When It Shouldn't Be
**What goes wrong:** New messages arrive while user is reading a message halfway up the screen. The scroll doesn't move, and user misses new context being added at bottom.

**Why it happens:** Threshold is too strict, or scroll listener isn't firing properly.

**How to avoid:**
- Use 100px threshold (user within 100px of bottom = "at bottom")
- Test on various screen sizes; 100px might be too small on mobile
- Always check both `scrollHeight - scrollTop - clientHeight < threshold` before auto-scrolling
- Add console logging during development to verify threshold is working

**Warning signs:** Scroll listener fires but auto-scroll doesn't happen, or it happens too aggressively.

### Pitfall 4: Missing Dev Mode Checks
**What goes wrong:** New filter component uses Convex query directly without checking `isDevMode()`. In dev mode, query is undefined, component crashes.

**Why it happens:** Dev mode bypasses Convex/Clerk to allow offline testing. New components must respect this.

**How to avoid:**
- Check `isDevMode()` before any Convex query
- Use mock data fallback in dev mode
- Pattern: `const data = useQuery(..., isDevMode() ? 'skip' : { args }); if (isDevMode()) return mockData`

**Warning signs:** Component crashes or shows "undefined" when testing at localhost:3000/demo.

### Pitfall 5: Filter Counts Out of Sync
**What goes wrong:** Status tab shows "Hot (5)" but there are actually 3 hot conversations after filtering. Count stale.

**Why it happens:** Filter count query wasn't subscribed; it ran once and never updated. Contact lead_status changed, but count didn't refresh.

**How to avoid:**
- Use Convex `useQuery()` for count queries; it auto-subscribes to changes
- If implementing manual query, use `watch()` pattern or re-run on interval (bad)
- Test by changing a contact's status in workspace settings and verify tab count updates

**Warning signs:** Manual database update → count doesn't change until page refresh.

### Pitfall 6: Unread Count Logic Broken by Filtering
**What goes wrong:** Unread badge shows on conversation, but when status filter is applied, conversation disappears. User thinks message was deleted.

**Why it happens:** Filter removed conversation from list, but unread state didn't clear.

**How to avoid:**
- Unread count and filtering are separate concerns; don't couple them
- Unread badge should always show if `unread_count > 0`, regardless of filters
- Filtering just hides conversations; doesn't mark them read

**Warning signs:** Unread badge appears in "unfiltered" view but conversation invisible after filtering.

## Code Examples

Verified patterns from current codebase:

### Filter State Management in inbox-client
```typescript
// Source: /src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx
const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
const [tagFilter, setTagFilter] = useState<string[]>([])

const convexData = useQuery(
  api.conversations.listWithFilters,
  isDevMode() ? 'skip' : {
    workspace_id: workspaceId as any,
    statusFilters: statusFilter.length > 0 ? statusFilter : undefined,
    tagFilters: tagFilter.length > 0 ? tagFilter : undefined,
  }
)

// Toggle handler
const handleStatusToggle = (status: LeadStatus) => {
  setStatusFilter((prev) =>
    prev.includes(status)
      ? prev.filter((s) => s !== status)
      : [...prev, status]
  )
}
```

### Client-Side Filtering with useMemo
```typescript
// Source: /src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx
const filteredConversations = useMemo(() => {
  if (!data?.conversations) return []

  let filtered = [...data.conversations] as any[]

  // Filter by status (OR: any selected status)
  if (statusFilter.length > 0) {
    filtered = filtered.filter((conv: any) => {
      const contact = conv.contact
      if (!contact) return false
      const contactStatus = (contact.lead_status || 'prospect') as LeadStatus
      return statusFilter.includes(contactStatus)
    })
  }

  // Filter by tags (AND: all selected tags must be present)
  if (tagFilter.length > 0) {
    filtered = filtered.filter((conv: any) => {
      const contact = conv.contact
      if (!contact?.tags) return false
      // Check if ALL selected tags are in contact's tags
      return tagFilter.every((tag: string) => contact.tags?.includes(tag))
    })
  }

  return filtered
}, [data?.conversations, statusFilter, tagFilter])
```

### Message Bubble with WhatsApp Styling
```typescript
// Source: /src/components/inbox/message-bubble.tsx
export function MessageBubble({ message, onReply }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div className={cn('flex group', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2 shadow-sm',
          isOutbound
            ? 'bg-primary text-primary-foreground rounded-tr-none'  // Brand color, right-aligned
            : 'bg-white rounded-tl-none'  // White, left-aligned
        )}
      >
        {/* Content */}
        {message.message_type === 'image' && message.media_url && (
          <img src={message.media_url} alt="Image" className="rounded max-w-full h-auto" />
        )}
        {message.message_type === 'text' && message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Footer: timestamp + status */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={cn('text-xs', isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {isOutbound && <MessageStatus status={message.metadata?.status} />}
        </div>
      </div>
    </div>
  )
}
```

### Auto-Scroll with Scroll Position Tracking
```typescript
// Source: /src/components/inbox/message-thread.tsx
const [isAtBottom, setIsAtBottom] = useState(true)

const handleScroll = () => {
  if (!containerRef.current) return
  const { scrollTop, scrollHeight, clientHeight } = containerRef.current
  const threshold = 100 // pixels from bottom
  const atBottom = scrollHeight - scrollTop - clientHeight < threshold
  setIsAtBottom(atBottom)
}

// Auto-scroll only if user is at bottom
useEffect(() => {
  if (isAtBottom && messages && messages.length > 0) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
}, [messages, isAtBottom])

// Render
<div
  ref={containerRef}
  onScroll={handleScroll}
  className="flex-1 overflow-y-auto"
>
  {/* Messages */}
  <div ref={messagesEndRef} />
</div>
```

### Status Configuration Access
```typescript
// Source: /src/lib/lead-status.ts
const statusConfig = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.new || {
  label: 'Unknown',
  color: '#6B7280',
  bgColor: '#F3F4F6',
}

// Use in UI
<span
  style={{
    color: statusConfig.color,
    backgroundColor: statusConfig.bgColor,
  }}
>
  {statusConfig.label}
</span>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling endpoint for updates | Convex subscriptions via useQuery | Convex adoption (Phase 2) | Real-time updates without polling; reduced server load |
| PopoverContent for all filters | Dedicated filter components (Tabs for status, Dropdown for tags) | Phase 4 refactor | Clearer UX, easier to add filter counts |
| Manual optimistic UI | Convex .withOptimisticUpdate() | Convex adoption | Automatic rollback on failure; no race conditions |
| Custom scroll-to-bottom logic | useRef + useEffect pattern | Current (solid pattern) | Standard for React, proven in production |
| Hard-coded status labels | LEAD_STATUS_CONFIG from config | Current | Workspace can override; single source of truth |

**Deprecated/outdated:**
- Custom Redux-like state management: Convex replaces with real-time queries
- Polling for new messages: Convex subscriptions push updates automatically
- LocalStorage for filters: Should migrate to Convex workspaceMembers.settings

## Open Questions

1. **Kapso Component Integration Approach**
   - What we know: whatsapp-cloud-inbox is a reference repo, not an npm package. It's built with Next.js + React.
   - What's unclear: Whether to extract specific component patterns from that repo (folder structure, naming conventions) or build independently with Kapso aesthetic principles
   - Recommendation: Clone repo as reference, study component organization and styling approach, but build components independently to maintain project's current architecture. Prioritize aesthetic alignment over code reuse.

2. **Real-Time Filter Count Performance**
   - What we know: Convex queries auto-subscribe; can compute counts server-side
   - What's unclear: Whether aggregating counts for 6 statuses per query will scale for workspaces with 10k+ conversations
   - Recommendation: Start with separate count query; if performance degrades, batch counts into single query or use Convex aggregation functions

3. **Tag Filter Search/Auto-complete**
   - What we know: Current implementation shows all tags as checkboxes
   - What's unclear: For workspaces with 100+ tags, dropdown will be unusable. Should we add search/filter within the tag dropdown?
   - Recommendation: Implement as Claude's discretion. Add searchable tag input (Shadcn ComboBox) if tag count exceeds 20.

4. **Mobile Responsiveness for Filters**
   - What we know: Current desktop layout has tabs + dropdown. Mobile has limited space.
   - What's unclear: Should filters collapse into a single "Filter" button on mobile, or should they remain visible?
   - Recommendation: Use breakpoints: Desktop (tabs + dropdown visible), Mobile (single "Filter" button that opens modal)

## Sources

### Primary (HIGH confidence)
- **Current Codebase Analysis**: `/src/components/inbox/` and `/src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` - existing inbox implementation patterns
- **Convex Documentation**: [Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates), [React Integration](https://docs.convex.dev/client/react), [Tutorial: Chat App](https://docs.convex.dev/tutorial/)
- **Project Lead Status Config**: `/src/lib/lead-status.ts` - status definitions and configurations
- **Convex Schema**: `/convex/schema.ts` - conversations and messages table structure

### Secondary (MEDIUM confidence)
- **Kapso WhatsApp Cloud Inbox**: [GitHub Repository](https://github.com/gokapso/whatsapp-cloud-inbox) - reference architecture for WhatsApp-style inbox
- **Kapso Documentation**: [Kapso Docs](https://docs.kapso.ai/) - WhatsApp Cloud API integration
- **Shadcn Chat Patterns**: [shadcn-chat GitHub](https://github.com/jakobhoeg/shadcn-chat), [Shadcn AI Components](https://www.shadcn.io/ai) - React chat component patterns
- **Convex Real-Time**: [Realtime Features](https://www.convex.dev/realtime), [Real-Time Collaboration Guide](https://stack.convex.dev/keeping-real-time-users-in-sync-convex)

### Tertiary (LOW confidence - reference only)
- **WebSearch Filter UX**: [Baymard Filtering UX](https://baymard.com/blog/allow-applying-of-multiple-filter-values), [Smashing Magazine Infinite Scroll](https://www.smashingmagazine.com/2022/03/designing-better-infinite-scroll/) - general SaaS filtering and scrolling patterns
- **WhatsApp Design**: [WhatsApp Blog - Chat Themes](https://blog.whatsapp.com/chat-themes-to-reflect-your-style), [WhatsApp Color Palette](https://www.designpieces.com/palette/whatsapp-color-palette-hex-and-rgb/) - messaging UI aesthetic reference

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All libraries already in project, no new dependencies
- Architecture: **HIGH** - Current codebase provides clear patterns; Kapso reference supplements
- Pitfalls: **MEDIUM** - Based on common messaging app issues + current codebase observations
- Kapso integration: **MEDIUM** - Reference repo exists but component extraction approach unclear

**Research date:** 2026-01-27
**Valid until:** 2026-02-24 (30 days for stable stack, libraries not moving fast)
**Next review:** If Kapso releases official npm package or major UI update
