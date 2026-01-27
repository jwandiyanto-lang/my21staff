# Architecture Patterns: Kapso Integration

**Project:** my21staff v3.4
**Domain:** WhatsApp CRM with Kapso inbox integration
**Researched:** 2026-01-27
**Confidence:** HIGH (codebase + official Kapso docs verified)

---

## Executive Summary

This research documents the architecture needed to integrate Kapso's `whatsapp-cloud-inbox` component library with my21staff's existing stack (Next.js 15, Convex, Clerk). The integration requires minimal architectural changes because:

1. **Kapso is a UI library**, not a database — it renders inbox UI but doesn't own data
2. **Data stays in Convex** — Kapso reads from Convex queries via props
3. **Kapso handles webhooks** — it receives WhatsApp messages via Kapso API
4. **No breaking changes** — existing routing, auth, and real-time patterns continue unchanged

The main challenge is **binding Kapso UI components to Convex queries** while maintaining real-time synchronization through the existing Convex → Kapso API → Convex webhook pipeline.

---

## Current Architecture (v3.3)

### Existing Component Hierarchy

```
app/(dashboard)/[workspace]/layout.tsx
  ├─ WorkspaceSidebar (static)
  └─ /inbox
      ├─ page.tsx (Server)
      │  └─ InboxClient (Client)
      │     ├─ ConversationList (custom)
      │     ├─ MessageThread (custom)
      │     └─ InfoSidebar (custom)
      └─ /settings
          └─ SettingsClient (custom)
             └─ AI config tabs
```

### Data Flow (Current)

```
WhatsApp Message
  ↓ (Kapso webhook)
convex/http/kapso.ts (HTTP action)
  ↓ (schedule async)
kapso.ts :: processWebhook (internal mutation)
  ├─ Find workspace by kapso_phone_id
  ├─ Create/update contact
  ├─ Create/update conversation
  └─ Schedule ARI processing
  ↓ (Convex subscription)
InboxClient useQuery → ConversationList render
```

### Key Integration Points

| Component | Responsibility | Technology |
|-----------|-----------------|------------|
| `page.tsx` | Server-side workspace fetch | `fetchQuery(api.workspaces.getBySlug)` |
| `InboxClient` | State management + filtering | React hooks + Convex `useQuery` |
| `ConversationList` | List rendering | Custom React component |
| `MessageThread` | Message display | Custom React component |
| `InfoSidebar` | Contact metadata + actions | Custom React component + Convex mutations |

---

## New Components Needed

### 1. KapsoInbox Wrapper Component

**File:** `/src/components/inbox/kapso-inbox.tsx`

**Purpose:** Adapter between Kapso UI and Convex data

**Responsibility:**
- Pass Convex data to Kapso components
- Handle Kapso's onSendMessage callback
- Implement message sending via existing Kapso API
- Maintain dev mode compatibility with mock data
- Handle error states

### 2. Kapso Message Sending API

**File:** `/src/app/api/messages/send-kapso/route.ts`

**Purpose:** New API route to send messages through Kapso

**Flow:**
1. Validate workspace + conversation access
2. Call Convex mutation to create outbound message record
3. Call Kapso API: `POST https://api.kapso.ai/meta/whatsapp/v24.0/{phoneId}/messages`
4. Return message ID for optimistic UI updates

### 3. Kapso Template Adapter

**File:** `/src/lib/kapso-templates.ts`

**Purpose:** Map my21staff quick_replies → Kapso template format

---

## Modified Components

### InboxClient Changes

**From:** 1000+ lines of custom conversation/message UI
**To:** Props adapter + Kapso component wrapper

**What stays:**
- Convex queries (listWithFilters, getMessages)
- State management (searchQuery, statusFilter, tagFilter, viewMode)
- Filter logic (client-side filtering for dev mode)
- Error handling

**What changes:**
```typescript
// OLD: Render custom ConversationList + MessageThread
return (
  <div className="flex">
    <ConversationList {...} />
    <MessageThread {...} />
  </div>
)

// NEW: Render Kapso components with adapters
return (
  <KapsoInbox
    conversations={conversations}
    selectedConversationId={selectedConversationId}
    onSelectConversation={setSelectedConversationId}
    onSendMessage={handleSendMessage}
  />
)
```

### SettingsClient: Your Intern Debugging

**Current Issue:** Settings page crashes in production (likely SSR auth issue)

**Root Cause Analysis:**
```typescript
// Problem: useQuery in client component, but SSR context incomplete
const ariConfig = useQuery(
  api.ari.getAriConfig,
  isDevMode ? 'skip' : { workspace_id: workspace.id }
)
// In SSR (production), Convex client not initialized, Clerk auth context unavailable
```

**Solution: Move AI Config to Client-Only**

1. Remove `fetchQuery(api.ari.getAriConfig)` from page.tsx
2. Keep `useQuery(api.ari.getAriConfig)` in SettingsClient (already there)
3. Add error boundary + loading state around AI section
4. Ensure dev mode check prevents Convex calls in offline mode

---

## Real-Time Data Synchronization

### Convex Subscriptions (Unchanged)

My21staff uses Convex's real-time subscriptions:

```typescript
// In InboxClient component
const conversations = useQuery(
  api.conversations.listWithFilters,
  { workspace_id, statusFilters, tagFilters, ... }
)
// ↑ Automatically re-runs when conversations table changes
```

### Integration with Kapso

Kapso receives data via props and re-renders:

```typescript
<KapsoInbox
  conversations={conversations} // Changes trigger re-render
  selectedConversationId={selectedId}
/>
```

**No Additional Sync Code Needed.** Kapso's auto-polling is fallback; Convex subscriptions are primary.

---

## Data Flow: Kapso Integration

```
User clicks send in Kapso UI
  ↓
onSendMessage callback (props)
  ↓
InboxClient handleSendMessage
  ↓
POST /api/messages/send-kapso
  ↓
Convex mutation: messages.create + conversations.update
  ↓
Kapso API: POST https://api.kapso.ai/meta/whatsapp/v24.0/{phoneId}/messages
  ↓
WhatsApp Cloud API → WhatsApp sent
  ↓
Webhook: Kapso → my21staff → processWebhook
  ↓
Convex subscription triggers
  ↓
Kapso component re-renders with new message
```

---

## Dev Mode Compatibility

### Current Mock Data Pattern

Kapso needs the same mock data structure:

```typescript
MOCK_CONVERSATIONS = [{
  _id: string
  contact_id: string
  status: 'open' | 'closed'
  unread_count: number
  last_message_at: number
  last_message_preview: string
  contact: { name, kapso_name, phone, lead_status, ... }
}]

MOCK_MESSAGES = [{
  _id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  sender_type: 'contact' | 'user' | 'bot'
  content: string
  created_at: number
}]
```

**No changes needed** — current mock data already matches what Kapso expects.

---

## Integration Challenges & Solutions

### Challenge 1: Custom Fields Not in Kapso

**Problem:** my21staff has `lead_status`, `tags`, `assigned_to`, `lead_score`. Kapso UI doesn't natively display these.

**Solution:** Extend Kapso's contact sidebar via props or custom render

### Challenge 2: Message Callbacks Need Database Context

**Problem:** Kapso's `onSendMessage(conversationId, text)` lacks workspace context.

**Solution:** Closure captures context from InboxClient

```typescript
const handleSendMessage = useCallback(async (conversationId: string, text: string) => {
  const res = await fetch(`/api/messages/send-kapso`, {
    method: 'POST',
    body: JSON.stringify({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      contact_phone: conversations.find(c => c._id === conversationId)?.contact?.phone,
      message: text
    })
  })
  return res.json()
}, [workspaceId, conversations])
```

### Challenge 3: Template Parameters

**Problem:** Kapso templates may need dynamic parameters. my21staff quick_replies are plain text.

**Solution:** Phase 1 sends as plain text, Phase 2+ enhances

### Challenge 4: Offline Mode (Dev Mode)

**Problem:** How does Kapso's auto-polling work when Convex is mocked?

**Solution:** Disable Kapso's polling in dev mode, use Convex subscriptions

---

## Pitfalls & Prevention

### Pitfall 1: Forgetting Dev Mode Checks in New Code

**What goes wrong:** New API works in production but crashes in dev mode (no Kapso credentials).

**Prevention:** Every API route touching Kapso should check:
```typescript
if (isDevMode) {
  return Response.json({ kapso_message_id: 'mock_' + Date.now() })
}
```

### Pitfall 2: Kapso Props Change Signature on Update

**What goes wrong:** npm package update changes Kapso component prop interface, UI breaks.

**Prevention:**
- Pin Kapso version in package.json
- Keep wrapper component (KapsoInbox) as translation layer
- Changes only impact one file

### Pitfall 3: Missing Error Boundaries

**What goes wrong:** Kapso component throws, entire inbox crashes.

**Prevention:**
```typescript
<ErrorBoundary fallback={<InboxError />}>
  <KapsoInbox {...props} />
</ErrorBoundary>
```

### Pitfall 4: Conversation Updates Not Refreshing

**What goes wrong:** User sends message, Kapso shows it, but Convex hasn't synced yet. Then message appears twice.

**Prevention:**
- Optimistic UI updates (show message immediately)
- Debounce Convex subscription updates (200ms)
- Deduplicate messages by kapso_message_id

### Pitfall 5: Settings Page Crash Pattern Recurring

**What goes wrong:** Similar SSR issue pops up in new code.

**Prevention:**
- Document: "Never use Convex queries in server components"
- Add ESLint rule to flag `useQuery` outside 'use client' boundary
- Code review checklist: "Browser-only context?"

---

## Recommended Build Order

### Phase 1: Data Binding & Testing (Low Risk)

1. Install Kapso: `npm install @kapso/whatsapp-cloud-inbox`
2. Create `/src/components/inbox/kapso-inbox.tsx` wrapper
3. Update InboxClient to use KapsoInbox instead of custom components
4. Test with mock data at `/demo`
5. Verify real data with production workspace

**Success Criteria:** Conversations and messages display via Kapso UI, no functionality lost.

### Phase 2: Message Sending (Medium Risk)

1. Create `/src/app/api/messages/send-kapso/route.ts`
2. Wire Kapso's `onSendMessage` callback to new API
3. Test sending through Kapso UI
4. Verify message appears in WhatsApp
5. Verify message syncs back via webhook

**Success Criteria:** Messages send and receive end-to-end.

### Phase 3: Settings & Your Intern Debug (Parallel)

1. Identify Settings SSR crash
2. Move `useQuery(api.ari.getAriConfig)` to client-only context
3. Add error boundary + loading state
4. Test Settings page loads without errors
5. Test all tabs functional

**Success Criteria:** Settings page stable, Your Intern works in production.

### Phase 4: Polish & Edge Cases (Testing)

1. Template message support (optional)
2. Media message handling (optional)
3. Contact detail sidebar integration
4. Custom field display (lead score, tags, assignment)
5. Performance optimization

**Success Criteria:** All features work, no crashes, real-time sync working.

---

## Files to Create/Modify

### New Files

- `/src/components/inbox/kapso-inbox.tsx` — Kapso wrapper
- `/src/app/api/messages/send-kapso/route.ts` — Message sending API
- `/src/lib/kapso-templates.ts` — Template adapter utilities

### Modified Files

- `/src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` — Replace UI rendering
- `/src/app/(dashboard)/[workspace]/inbox/page.tsx` — Remove AI config fetch
- `/src/app/(dashboard)/[workspace]/settings/settings-client.tsx` — Add error boundary
- `/src/app/(dashboard)/[workspace]/settings/page.tsx` — Remove SSR ariConfig fetch

### Deprecated Files

- `/src/components/inbox/conversation-list.tsx`
- `/src/components/inbox/message-thread.tsx`
- `/src/components/inbox/message-bubble.tsx`
- `/src/components/inbox/date-separator.tsx`

---

## Sources

- [Kapso GitHub](https://github.com/gokapso)
- [whatsapp-cloud-inbox Repository](https://github.com/gokapso/whatsapp-cloud-inbox)
- [Kapso Website](https://kapso.ai/)

---

*Created: 2026-01-27*
*Status: Architecture research complete. Ready for roadmap phase planning.*
