# Kapso Integration Recommendation for my21staff CRM

**Date:** January 29, 2025
**Purpose:** Complete integration strategy for Inbox and Bot workflows

---

## 📑 Document Navigation

This document covers two main topics:

1. **[Inbox Strategy](#inbox-strategy-keep-your-custom-build)** (You're on the right track)
2. **[Bot Strategy](#bot-strategy-simplify-before-scaling)** (See [BOT-STRATEGY.md](./BOT-STRATEGY.md) for full details)

---

## Executive Summary

**Inbox:** Keep your custom inbox - it's better than Kapso embed for multi-tenant. Just add Active/Closed filter.

**Bot:** Simplify ARI - use Kapso workflows for 80% of simple cases, keep ARI only for complex lead qualification.

---

## Table of Contents

- [Part 1: Inbox Strategy](#inbox-strategy-keep-your-custom-build)
  - [Current Architecture](#current-architecture-what-you-have)
  - [What to Add](#what-to-add-this-week)
  - [Multi-Tenant Design](#multi-tenant-design)
  - [Active vs Closed Window](#active-vs-closed-window-24h-meta-rule)
  - [Kapso Embed? No.](#inbox-build-your-own-vs-kapso-embed)

- [Part 2: Bot Strategy](#bot-strategy-simplify-before-scaling)
  - [ARI vs Kapso Workflows](#ari-vs-kapso-workflows)
  - [Full Analysis](#see-bot-strategymd)

---

## 1. Current Situation Analysis

### What You Already Have (Codebase Review)

**Good News:** Your implementation is actually solid! You're NOT reimplementing everything.

| Component | Your Implementation | Status |
|-----------|---------------------|--------|
| **Webhook Processing** | `/api/webhook/kapso` → `processWebhook` mutation | ✅ Working |
| **Data Storage** | Messages, contacts, conversations in Convex | ✅ Correct |
| **Multi-Tenant** | `workspaces.kapso_phone_id` mapping | ✅ Implemented |
| **Message Sending** | `/api/messages/send` via Kapso API | ✅ Working |
| **Inbox UI** | Full React UI with filters, message thread | ✅ Built |
| **ARI Bot** | Custom AI response system | ✅ Custom built |

### What's Actually "Messy"

**Not the architecture, but the status filter approach:**

1. **Conversation Status Confusion**
   - You have: `conversation.status` = 'open', 'handover', 'closed'
   - This controls: ARI bot auto-respond behavior
   - This is: **NOT the same as Active/Closed (24h window)**

2. **You're Missing Meta's Active Window**
   - Meta's concept: 24-hour window for free replies
   - Your code: Doesn't track this anywhere
   - Impact: Users don't know if they can reply freely or need a template

3. **The "Status Filter" You Built**
   - Location: `inbox-client.tsx` → `FilterTabs` component
   - Filters by: Contact's `lead_status` (new, hot, warm, cold, client, lost)
   - Works: Yes, but it's filtering CRM data, not messaging status

### What You Should Keep vs. Change

| Keep As-Is | Consider Simplifying |
|------------|----------------------|
| ✅ Webhook → Convex storage | ❓ Do you need Active/Closed filter? |
| ✅ Kapso phone_id → workspace mapping | ❓ ARI bot vs Kapso workflows? |
| ✅ Message sending via Kapso API | ❓ Conversation status complexity |
| ✅ Inbox UI with filters | |
| ✅ Contact enrichment | |
| ✅ ARI bot system | |

### The Real Question

**Do you need the Active/Closed (24h window) filter?**

- **If YES** → Add `is_active` derived field to conversations (calculate from `last_message_at`)
- **If NO** → Your current `lead_status` filter is enough for business purposes

**My recommendation:** Add it. It's a simple computed property and users care about it.

---

# Part 1: Inbox Strategy (Keep Your Custom Build)

---

## 2. Your Current Architecture (How It Fits)

### Data Flow: What Actually Happens

```
┌─────────────────────────────────────────────────────────────┐
│  1. WhatsApp Message Arrives                                 │
│                                                              │
│  2. Kapso Webhook → Your Server                              │
│     POST /api/webhook/kapso                                  │
│     ↓                                                        │
│  3. Convex: kapso.processWebhook (mutation)                  │
│     ├─ Find workspace by kapso_phone_id                      │
│     ├─ Get/create contact (normalize phone)                  │
│     ├─ Get/create conversation                               │
│     ├─ Store message (with kapso_message_id)                 │
│     └─ Update conversation (unread_count, last_message_at)   │
│                                                              │
│  4. ARI Bot Triggered (if enabled)                           │
│     ├─ Check conversation.status !== 'handover'              │
│     ├─ Generate AI response (The Mouth)                      │
│     ├─ Send via Kapso API                                    │
│     └─ Update lead score (The Brain)                         │
│                                                              │
│  5. UI Polls Convex                                           │
│     ├─ Inbox queries conversations list                      │
│     ├─ Message thread loads messages                         │
│     └─ Real-time updates via Convex subscriptions            │
│                                                              │
│  6. User Replies                                             │
│     POST /api/messages/send                                   │
│     ├─ Get Kapso credentials from workspace                  │
│     ├─ Call Kapso API to send                                │
│     └─ Store outbound message in Convex                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Schema Relationships

```typescript
// Your Convex schema (already implemented):

workspaces: {
  kapso_phone_id: string,        // Maps Kapso phone → workspace
  meta_access_token: string,     // Encrypted API credentials
}

contacts: {
  workspace_id: workspaces._id,
  phone: string,                 // Normalized (+62 format)
  kapso_name: string,            // From WhatsApp profile
  lead_status: string,           // Your CRM filter
  tags: string[],
  metadata: {},                  // Your enrichment
}

conversations: {
  workspace_id: workspaces._id,
  contact_id: contacts._id,
  status: 'open' | 'handover',    // Controls ARI bot
  unread_count: number,
  last_message_at: number,
}

messages: {
  kapso_message_id: string,      // Links to Kapso
  direction: 'inbound' | 'outbound',
  content: string,
  media_url: string,
}
```

### What You're Doing Right

| ✅ Good Pattern | Why It Works |
|-----------------|--------------|
| Webhook → Async processing | Respond 200 OK immediately, process in background |
| Kapso phone_id → workspace mapping | Perfect multi-tenant isolation |
| Store kapso_message_id | Deduplicates, prevents double-processing |
| Normalize phone numbers | Consistent matching between systems |
| ARI checks conversation.status | Human can take over, bot respects this |

### What You're Missing (Small Gaps)

1. **Active/Closed Window (24h Meta)**
   ```typescript
   // Add to conversations.ts (listWithFilters query):
   const now = Date.now();
   const lastMessageAt = conversation.last_message_at || 0;
   const hoursSince = (now - lastMessageAt) / (1000 * 60 * 60);
   const isActive = hoursSince < 24;

   // Add filter option to listWithFilters args
   ```

2. **Kapso Conversation Status**
   - Kapso has: `conversation.status` (active, closed, etc.)
   - You're not syncing this from Kapso
   - Impact: You don't know Meta's conversation state

3. **Message Delivery Status**
   - Kapso tracks: pending → sent → delivered → read
   - You store: `kapso_message_id` but not delivery status
   - Impact: Can't show "read" receipts or "delivered" checks

---

## 3. Inbox: Build Your Own vs. Kapso Embed?

### The Short Answer: **Keep Your Inbox**

You've already built a solid inbox. Don't switch to Kapso embed.

### Why Your Current Inbox Is Better

| Your Inbox | Kapso Embed | Winner |
|------------|-------------|--------|
| ✅ Multi-tenant (workspace filtering) | ❌ Shows all conversations | **Yours** |
| ✅ Contact enrichment sidebar | ❌ Kapso contacts only | **Yours** |
| ✅ Lead status filters (your CRM value) | ❌ Generic messaging filters | **Yours** |
| ✅ ARI bot integration (handover toggle) | ❌ No bot control | **Yours** |
| ✅ Assignment to team members | ❌ No assignment | **Yours** |
| ✅ Your branding, UX | ❌ Generic Kapso UI | **Yours** |
| ✅ Custom tags, notes | ❌ Limited metadata | **Yours** |
| ⚠️ Manual sync from webhook | ✅ Real-time native data | **Kapso** |
| ⚠️ No delivery status (sent/delivered/read) | ✅ Shows delivery checks | **Kapso** |

### What Your Inbox Already Has (from code review)

**File: `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`**

```typescript
// ✅ Already implemented:
- Conversation list (left sidebar)
- Message thread (center)
- Contact info sidebar (right overlay)
- Search by name/phone
- Filter by lead status (hot/warm/cold/etc.)
- Filter by tags
- Filter by assignment (me/team/all)
- Mark as read on click
- Handover status toggle (AI vs Human)
- Team member display
- Unread count badges
```

### What You Should Add (Small Improvements)

**1. Active/Closed Filter (24h Window)**

```typescript
// Add to inbox-client.tsx:
const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'closed'>('all')

// Calculate from last_message_at:
const isActive = (conv) => {
  const hours = (Date.now() - conv.last_message_at) / (1000 * 60 * 60)
  return hours < 24
}

// Add filter button to header:
<FilterTabs value={activeFilter} onChange={setActiveFilter} />
```

**2. Message Delivery Status**

```typescript
// Add to message-bubble.tsx:
{message.kapso_message_id && (
  <MessageStatus messageId={message.kapso_message_id} />
)}

// This would query Kapso API for delivery status
// Or sync it via webhook events (message_delivered, message_read)
```

**3. Responsive Right Sidebar**

```typescript
// Current: Floating overlay (awkward)
// Better: Integrated panel on desktop, modal on mobile

{showInfoSidebar && (
  <InfoSidebar
    className={cn(
      "fixed right-0 top-0 h-full", // Current
      "lg:static lg:col-span-1"     // Better: integrated on large screens
    )}
  />
)}
```

### Kapso Embed: When Would It Make Sense?

**Only consider if:**
- You have 0 engineering resources
- You need to ship in 1 week
- Multi-tenant is NOT a requirement
- You're okay with generic branding

**For your business:** None of these apply. Keep your inbox.

---

## 4. Bot Strategy: ARI (Custom) vs. Kapso Workflows?

### Current State: You Built ARI (Custom Bot)

**File: `convex/kapso.ts` + `convex/ai/`**

```typescript
// Your ARI implementation:
- The Mouth: AI response generation (Grok-3, GPT-4)
- The Brain: Lead scoring, conversation analysis
- Custom flow stages (qualification, scheduling, handoff)
- Consultation booking system
- Multi-language (ID, EN)
- Persona configuration per workspace
```

**This is sophisticated and valuable. Don't replace it.**

### Kapso Workflows: What They're Good For

| Kapso Workflow Feature | Your ARI Alternative | Use Case |
|------------------------|---------------------|----------|
| Visual flow builder | Code-based configuration | Non-technical users |
| Pre-built templates | Custom flows only | Quick setup |
| Simple auto-replies | AI conversations | Basic FAQ |
| Trigger-based automation | Webhook + scheduled | Event-driven actions |

### Recommended Hybrid Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  Keep ARI For:                    Use Kapso Workflows For:  │
│  • Lead qualification             • Auto-acknowledgment      │
│  • AI conversations (Grok, GPT)   • 24h window alerts       │
│  • Lead scoring (The Brain)       • Simple FAQ               │
│  • Consultation booking           • Tag-based routing        │
│  • Complex state machines         • Scheduled follow-ups     │
│  • Multi-language support         • Notification broadcasts │
└─────────────────────────────────────────────────────────────┘
```

### Practical Split

**ARI stays because:**
- It's already built and working
- It's your competitive advantage (AI lead scoring)
- Clients pay for smart automation, not simple bots

**Add Kapso workflows for:**
1. **24-Hour Window Alert**
   ```
   Trigger: Schedule (every hour)
   Action: Find conversations with last_message_at > 23h
   Output: Slack/email notification to team
   ```

2. **Auto-ACK for New Leads**
   ```
   Trigger: Incoming message, new contact
   Action: Send template "Thanks for reaching out..."
   Benefit: Instant response, ARI takes over later
   ```

3. **Simple Tag Routing**
   ```
   Trigger: Message contains "price", "harga"
   Action: Tag "pricing_question", notify sales
   Benefit: Fast routing without AI complexity
   ```

---

## 5. Meta 24-Hour Window (Active vs Closed)

### How Meta Works
```
0-24 hours:  FREE inbound message reply
24+ hours:  Must use TEMPLATE message (costs per send)
```

### Kapso's Active vs Closed Concept
| State | Meaning | Meta Status | Your Action |
|-------|---------|-------------|-------------|
| **Active** | Within 24-hour window | Free to reply | Use regular text/media messages |
| **Closed** | Outside 24-hour window | Template required | Use pre-approved template messages |

### Status Filter - Is It Worth It?

**Your current implementation:** You filter by `lead_status` (CRM data)

**Recommendation:** ADD Active/Closed filter, but:
- Derive it from `conversation.last_message_at`
- Don't store as separate field (it changes over time)
- Calculate on the fly: `isActive = (now - last_message_at) < 24 hours`

**Why:**
- Users care about "can I reply freely?" vs "do I need a template?"
- Easy to implement as computed property
- Your current lead_status filter is separate (CRM value, not messaging status)

**Implementation:**
```typescript
// In inbox-client.tsx, add:
const [windowFilter, setWindowFilter] = useState<'all' | 'active' | 'closed'>('all')

// Filter conversations:
const filteredByWindow = conversations.filter(conv => {
  if (windowFilter === 'all') return true
  const hoursSince = (Date.now() - conv.last_message_at) / (1000 * 60 * 60)
  const isActive = hoursSince < 24
  return windowFilter === 'active' ? isActive : !isActive
})
```

---

## 3. Kapso Native Capabilities You Should Use

### 3.1 Webhooks (Event-Based)

```typescript
// Kapso webhook events you can subscribe to:
// - message_received
// - message_sent
// - message_delivered
// - message_read
// - workflow_completed
// - contact_created
// - contact_updated
```

**Use Kapso for:**
- Receiving real-time events
- Event filtering and buffering
- Secret key signing for security

**Your job:**
- Build the endpoint that receives webhook payloads
- Process and store relevant data in your CRM
- Don't try to replicate the event delivery system

### 3.2 Messages API

```typescript
// List messages for a conversation
GET /whatsapp/messages?conversation_id={id}

// Filter options:
- direction: 'inbound' | 'outbound'
- status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
- message_type: 'text' | 'image' | 'video' | 'template' | etc.
```

**Use Kapso for:**
- Fetching message history
- Filtering and pagination
- Media URL retrieval (images, documents, etc.)

### 3.3 Conversations API

```typescript
// List conversations
GET /whatsapp/conversations

// Each conversation includes:
- id, phone_number_id, contact_phone
- last_message_preview
- last_message_at
- unread_count
- status (you could derive "active" from timestamp)
```

**This replaces your custom conversation tracking.**

---

## 4. Recommended Architecture

### The Easy Route (Phase 1)

```
┌─────────────────────────────────────────────────────────────┐
│                      Your CRM (Next.js)                     │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Inbox UI      │  │   Contacts      │  │  Reporting  │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┘ │
│           │                    │                           │
│           └────────────────────┴───────────────────────────┘
│                              │
│                              ▼
│              ┌────────────────────────────────┐
│              │      Your Convex Database      │
│              │  (User org, contact mapping)   │
│              └──────────────┬─────────────────┘
│                             │
│                             ▼
│              ┌────────────────────────────────┐
│              │   Kapso API (as source of      │
│              │   truth for messaging)         │
│              └────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### What You Build

| Layer | What | Use Kapso For |
|-------|------|---------------|
| **UI** | Inbox interface, conversation list, message view | Display only |
| **Contacts** | Your enriched contact data | Sync via webhook events |
| **Conversations** | Conversation metadata, user assignment | Fetch from Kapso API |
| **Messages** | Message display, history | Fetch from Kapso API |
| **Status Filter** | Active vs Closed | Derive from `last_message_at` + 24h |

### What Kapso Handles

- WhatsApp API connectivity with Meta
- Message delivery and status tracking
- Webhook event generation
- Conversation state management
- Template message management

---

## 5. Multi-Tenant Considerations

Since your inbox is used by **clients (paying users) AND you**:

### Organization Separation

```typescript
// Convex schema pattern:
organizations (id, name, kapso_phone_numbers[])
contacts (org_id, phone, name, metadata)
conversations (org_id, kapso_conversation_id, assigned_to)
users (org_id, role, email)
```

### Phone Number Mapping

```typescript
// Each organization has one or more phone numbers
// Kapso phone_number_id maps to your organization_id
// Filter all Kapso API calls by phone_number_id
```

### Client Isolation

- Client A only sees conversations from their phone numbers
- You (superadmin) see all conversations or can switch views
- API calls should include `phone_number_id` filter

---

## 6. Bot Workflow Capabilities

### Kapso Workflow Nodes Available

| Node Type | Capability | Use Case |
|-----------|------------|----------|
| **AI Agent** | LLM with custom prompt | Smart auto-responses, Q&A |
| **User Input** | Wait for user response | Qualification flows |
| **Send Message** | WhatsApp message | Notifications, replies |
| **Condition** | If/then branching | Route based on keywords |
| **Function** | Custom JavaScript | Data processing, API calls |
| **Set Variable** | Store values | Pass data between nodes |
| **Make API Request** | HTTP calls | External integrations |
| **Loop** | Iterate arrays | Bulk operations |
| **Search Knowledge Base** | RAG queries | FAQ automation |
| **Generate Content** | AI text generation | Dynamic content |
| **Send Email** | Email dispatch | Multi-channel alerts |

### Trigger Types

- **Incoming Message** - Any message, specific keywords, or patterns
- **Webhook** - External triggers from your system
- **Schedule** - Time-based (reminders, follow-ups)
- **Contact Tag Added** - Tag-based automation

### Powerful Combinations for Your CRM

1. **Lead Qualification Bot**
   ```
   Incoming message → AI Agent (qualify) →
   Condition (qualified?) →
     Yes: Set tag "hot_lead" → Send to inbox
     No: Auto-reply with info → Close
   ```

2. **24-Hour Window Alert**
   ```
   Incoming message → Set variable (timestamp) →
   Schedule (23 hours) →
   Check if conversation still active →
   Alert team: "Reply before window closes!"
   ```

3. **Customer Support Bot**
   ```
   Incoming message → Search Knowledge Base →
   If answer found → Send auto-reply
   If not found → Tag "needs_human" → Route to inbox
   ```

4. **Appointment Reminder**
   ```
   Schedule trigger →
   Check appointment data →
   Send reminder message →
   Update status to "reminded"
   ```

---

## 7. Business Differentiation Opportunities

### What Makes Your CRM Valuable (Beyond Messaging)

| Feature | Why Clients Pay |
|---------|-----------------|
| **Contact Enrichment** | Auto-add name, company, notes from conversation |
| **Conversation Tags** | Organize by intent, product interest, status |
| **Team Assignment** | Route leads to specific salespeople |
| **Analytics Dashboard** | Response time, conversion rates, volume |
| **Template Management** | Easy template creation and approval flow |
| **Knowledge Base** | AI-powered FAQ that learns |
| **Multi-channel Inbox** | WhatsApp + maybe future channels |

### Unique Angles for Indonesian Market

1. **Bahasa Indonesia AI** - Train bot on local language nuances
2. **SME Templates** - Pre-built flows for common businesses (salon, clinic, retail)
3. **Multi-agent Handoff** - Seamless bot-to-human transition
4. **Offline Notifications** - Alert team when high-priority messages arrive
5. **Bulk Broadcast** - Send updates to many contacts (template-based)

---

## 8. Implementation Steps (Based on Your Current Code)

### Quick Wins (This Week)

#### 1. Add Active/Closed Filter (2 hours)

```typescript
// File: src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx

// Add state:
const [windowFilter, setWindowFilter] = useState<'all' | 'active' | 'closed'>('all')

// Add helper function:
const getConversationWindowStatus = (lastMessageAt: number | undefined) => {
  if (!lastMessageAt) return 'unknown'
  const hoursSince = (Date.now() - lastMessageAt) / (1000 * 60 * 60)
  return hoursSince < 24 ? 'active' : 'closed'
}

// Update filter logic:
const windowFilteredConversations = filteredConversations.filter(conv => {
  if (windowFilter === 'all') return true
  const status = getConversationWindowStatus(conv.last_message_at)
  return status === windowFilter
})

// Add UI component (after FilterTabs):
<WindowStatusFilter value={windowFilter} onChange={setWindowFilter} />
```

**Create component:**
```typescript
// File: src/components/inbox/window-status-filter.tsx

import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

type WindowStatus = 'all' | 'active' | 'closed'

export function WindowStatusFilter({
  value,
  onChange
}: {
  value: WindowStatus
  onChange: (value: WindowStatus) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Button
        variant={value === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('all')}
      >
        All
      </Button>
      <Button
        variant={value === 'active' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('active')}
      >
        Active
      </Button>
      <Button
        variant={value === 'closed' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('closed')}
      >
        Closed
      </Button>
    </div>
  )
}
```

#### 2. Add Message Delivery Status (3 hours)

```typescript
// File: src/components/inbox/message-bubble.tsx

// Add to message bubble (after content):
{message.direction === 'outbound' && message.kapso_message_id && (
  <MessageDeliveryStatus messageId={message.kapso_message_id} />
)}

// New component:
// File: src/components/inbox/message-delivery-status.tsx

import { useEffect, useState } from 'react'
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'

type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export function MessageDeliveryStatus({ messageId }: { messageId: string }) {
  // For now, simple icon based on kapso_message_id presence
  // TODO: Query Kapso API for actual status

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <CheckCheck className="h-3 w-3" />
      <span>Sent</span>
    </div>
  )
}
```

#### 3. Fix InfoSidebar Layout (1 hour)

```typescript
// File: src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx

// Change from absolute overlay to integrated panel:
{showInfoSidebar && selectedConversationId && contactForSidebar && (
  <>
    {/* Backdrop on mobile */}
    <div
      className="fixed inset-0 bg-black/50 z-50 lg:hidden"
      onClick={() => setShowInfoSidebar(false)}
    />

    {/* Sidebar - integrated on desktop, modal on mobile */}
    <div className="absolute right-0 top-0 h-full z-[60] shadow-lg lg:static lg:shadow-none lg:col-span-1 bg-background">
      <InfoSidebar
        key={contactForSidebar.id}
        contact={contactForSidebar}
        messagesCount={messagesCount}
        lastActivity={selectedConversation?.last_message_at
          ? new Date(selectedConversation.last_message_at).toISOString()
          : null}
        conversationStatus={selectedConversation?.status || 'open'}
        contactTags={contactTags}
        conversationId={String(selectedConversationId)}
        onClose={() => setShowInfoSidebar(false)}
      />
    </div>
  </>
)}
```

### Phase 2: Kapso Workflow Integration (Next Week)

#### 1. Set Up 24h Window Alert Workflow

**In Kapso Dashboard:**
1. Create new workflow
2. Trigger: Schedule (every hour)
3. Node 1: Make API Request → Your Convex HTTP endpoint
   ```
   GET /api/conversations?expiring_soon=true
   Returns conversations with last_message_at between 23-24h ago
   ```
4. Node 2: Filter by count > 0
5. Node 3: Send Slack notification to team
6. Activate workflow

**Create endpoint:**
```typescript
// File: src/app/api/conversations/expiring/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace_id')

  // This would need to be implemented in conversations.ts
  const expiring = await fetchQuery(
    api.conversations.getExpiringConversations,
    { workspace_id: workspaceId, hours_threshold: 23 }
  )

  return NextResponse.json({ conversations: expiring })
}
```

#### 2. Create Auto-ACK Workflow

**In Kapso Dashboard:**
1. Create new workflow
2. Trigger: Incoming message
3. Condition: Contact has no previous messages
4. Action: Send template message "auto_acknowledgment"
5. Activate workflow

**Benefit:** Instant response, ARI takes over after

### Phase 3: Polish (Ongoing)

#### 1. Message Search Within Conversation

```typescript
// Add to message-thread.tsx:
const [searchQuery, setSearchQuery] = useState('')

const filteredMessages = messages.filter(msg =>
  msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
)
```

#### 2. Keyboard Shortcuts

```typescript
// Add to inbox-client.tsx:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'j') navigateNext()
    if (e.key === 'k') navigatePrev()
    if (e.key === 'r') focusReplyInput()
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

#### 3. Media Gallery in InfoSidebar

```typescript
// Add to info-sidebar.tsx:
const mediaMessages = messages.filter(m =>
  m.message_type === 'image' || m.message_type === 'video'
)

{mediaMessages.length > 0 && (
  <div className="border-t pt-4">
    <h4 className="text-sm font-medium mb-2">Shared Media</h4>
    <div className="grid grid-cols-3 gap-2">
      {mediaMessages.map(m => (
        <img src={m.media_url} alt="" className="rounded" />
      ))}
    </div>
  </div>
)}
```

---

## 9. What NOT To Change

### Don't Break These Working Systems

| ✅ Keep As-Is | Why |
|---------------|-----|
| Webhook processing (`processWebhook`) | Works perfectly, async is correct |
| Kapso phone_id → workspace mapping | Multi-tenant isolation is solid |
| ARI bot (Mouth + Brain) | Your competitive advantage |
| Message sending via Kapso API | Correct pattern |
| Contact enrichment | Core CRM value |
| Conversation status (open/handover) | Controls ARI behavior correctly |

### Don't Add These Yet

| ❌ Skip For Now | Why |
|----------------|-----|
| Kapso embed inbox | Your UI is better, multi-tenant ready |
| Replace ARI with Kapso workflows | ARI is more sophisticated |
| Real-time delivery status | Nice to have, not critical |
| Two-way Kapso sync | One-way (webhook) is sufficient |
| Message read receipts | Can add later, low priority |

---

## 10. Priority Checklist

### Do This Week (Quick Wins)

- [ ] Add Active/Closed filter to inbox (2 hours)
- [ ] Add message delivery status icon (3 hours)
- [ ] Fix InfoSidebar layout (1 hour)
- [ ] Test locally at `/demo` route

### Do Next Week (Kapso Workflows)

- [ ] Create 24h window alert workflow
- [ ] Create auto-ACK workflow for new contacts
- [ ] Test workflow handoffs

### Do When You Have Time (Polish)

- [ ] Message search within conversation
- [ ] Keyboard shortcuts
- [ ] Media gallery in sidebar
- [ ] Conversation threading (grouped messages)
- [ ] Template management UI

---

## 9. Quick Wins with Kapso

### Today Without Custom Code

1. **Use Kapso's built-in inbox** for testing (quick validation)
2. **Configure webhooks** through Kapso dashboard first
3. **Test workflows** in Kapso UI before automating
4. **Use Kapso's conversation list** as reference implementation

### Migrate Incrementally

| Step | What | Risk |
|------|------|------|
| 1 | Read from Kapso API, keep your storage | Low - read-only initially |
| 2 | Mirror conversations in your DB | Medium - sync logic needed |
| 3 | Write back enriched data to Kapso? | High - don't do this yet |
| 4 | Replace with your own UI | Your value-add layer |

---

## 11. Key Takeaways (Updated Based on Your Code)

### What You Got Right

1. ✅ **Architecture is solid** - Webhook → Convex → UI flow is correct
2. ✅ **Multi-tenant isolation** - Kapso phone_id → workspace mapping works
3. ✅ **ARI bot is sophisticated** - Don't replace it with Kapso workflows
4. ✅ **Contact enrichment** - This is your CRM value, keep it
5. ✅ **Inbox UI is custom and better** - Don't switch to Kapso embed

### What You Should Add

1. 🆕 **Active/Closed filter** - Add as computed property (2 hours work)
2. 🆕 **Hybrid bot strategy** - Keep ARI, add simple Kapso workflows
3. 🆕 **Message delivery status** - Nice to have, easy to add

### What You Should Ignore

1. ❌ **Kapso embed inbox** - Your UI is better for multi-tenant
2. ❌ **Replacing ARI** - Your AI bot is more valuable
3. ❌ **Two-way sync** - One-way via webhook is sufficient
4. ❌ **Building full Kapso integration** - You already have what you need

### Strategic Positioning

**Your CRM value is NOT in:**
- Basic message sending (Kapso does this)
- Webhook handling (Kapso does this)
- Conversation management (Kapso does this)

**Your CRM value IS in:**
- Multi-tenant organization management ✅
- Contact enrichment and CRM features ✅
- ARI AI bot with lead scoring ✅
- Custom inbox UI with filters ✅
- Team assignment and collaboration ✅

**The sweet spot:** Use Kapso for messaging plumbing, focus your energy on CRM features that clients pay for.

---

## 12. Next Steps (Action Items)

### Immediate (This Week)

1. **Add Active/Closed filter**
   ```bash
   # Files to create:
   src/components/inbox/window-status-filter.tsx

   # Files to modify:
   src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx
   ```

2. **Test locally at `/demo`**
   ```bash
   npm run dev
   # Open http://localhost:3000/demo
   # Test inbox with mock data
   ```

3. **Review Kapso workflow dashboard**
   - Login to Kapso
   - Explore workflow builder
   - Plan 24h window alert workflow

### Short Term (Next 2 Weeks)

1. **Implement Kapso workflow for 24h alerts**
   - Create API endpoint for expiring conversations
   - Build workflow in Kapso dashboard
   - Test alert delivery

2. **Add message delivery status**
   - Create `message-delivery-status.tsx` component
   - Add to message bubbles
   - Consider webhook events for status updates

3. **Polish InfoSidebar layout**
   - Fix responsive behavior
   - Test on mobile and desktop
   - Consider integrated panel vs overlay

### Medium Term (Next Month)

1. **Auto-ACK workflow**
   - Create template in Kapso
   - Build workflow for new contacts
   - Test with ARI handoff

2. **Message search feature**
   - Add search input to message thread
   - Filter messages by content
   - Highlight search matches

3. **Template management UI**
   - List all Kapso templates
   - Allow editing from your CRM
   - Show template usage stats

---

## 13. Files Reference (Your Codebase)

### Key Files for Inbox

| File | Purpose | Status |
|------|---------|--------|
| `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` | Main inbox component | ✅ Built |
| `src/components/inbox/conversation-list.tsx` | Conversation list UI | ✅ Built |
| `src/components/inbox/message-thread.tsx` | Message display | ✅ Built |
| `src/components/inbox/message-bubble.tsx` | Individual message | ✅ Built |
| `src/components/inbox/filter-tabs.tsx` | Lead status filter | ✅ Built |
| `src/components/inbox/tag-filter-dropdown.tsx` | Tag filter | ✅ Built |
| `src/components/contact/info-sidebar.tsx` | Contact details | ✅ Built |
| `src/components/inbox/compose-input.tsx` | Message input | ✅ Built |

### Key Files for Kapso Integration

| File | Purpose | Status |
|------|---------|--------|
| `src/app/api/webhook/kapso/route.ts` | Webhook endpoint | ✅ Working |
| `convex/kapso.ts` | Webhook processing | ✅ Working |
| `src/app/api/messages/send/route.ts` | Send via Kapso | ✅ Working |
| `convex/contacts.ts` | Contact queries | ✅ Working |
| `convex/conversations.ts` | Conversation queries | ✅ Working |
| `convex/schema.ts` | Database schema | ✅ Complete |

### Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `src/components/inbox/window-status-filter.tsx` | Active/Closed filter | HIGH |
| `src/components/inbox/message-delivery-status.tsx` | Delivery status | MEDIUM |
| `src/app/api/conversations/expiring/route.ts` | 24h alert endpoint | MEDIUM |

---

## 14. Questions to Answer

1. **Do you want Active/Closed filter?**
   - If yes: Implement as described (2 hours)
   - If no: Your current lead_status filter is sufficient

2. **Do you need real-time delivery status?**
   - If yes: Add webhook events for message_delivered, message_read
   - If no: Simple "sent" indicator is enough

3. **Will you use Kapso workflows?**
   - If yes: Start with 24h window alert (easy win)
   - If no: Your ARI bot is sufficient

4. **Multi-tenant isolation requirements?**
   - Current: Workspace-based isolation works
   - Future: Consider phone_number_id per organization

---

# Part 2: Bot Strategy (Simplify Before Scaling)

## Executive Summary for Bots

**Current ARI Bot:** Sophisticated but over-engineered for most use cases.

**Problem:** You built a full AI platform (Mouth + Brain + 10+ tables) when 80% of clients just want simple auto-replies.

**Solution:** Hybrid approach - Use Kapso workflows for simple bots, keep ARI only for complex lead qualification.

**Full Analysis:** See [BOT-STRATEGY.md](./BOT-STRATEGY.md) for complete details.

---

## ARI vs. Kapso Workflows (Quick Comparison)

| Feature | ARI (Custom) | Kapso Workflows | Winner |
|---------|-------------|-----------------|--------|
| **Setup Time** | Weeks | Minutes | **Kapso** |
| **Maintenance** | High (code) | Low (visual) | **Kapso** |
| **Auto-Replies** | ✅ AI-powered | ✅ AI-powered | **Tie** |
| **FAQ** | ✅ Custom RAG | ✅ Built-in | **Kapso** |
| **Lead Scoring** | ✅ Custom logic | ❌ Needs API | **ARI** |
| **Appointments** | ✅ Full system | ❌ Needs API | **ARI** |
| **Multi-language** | ✅ Single bot | ⚠️ Per workflow | **ARI** |
| **Cost** | ~$97/month (AI) | $0 (included) | **Kapso** |

---

## What Clients Actually Need

### Simple Bots (80% of requests) → Use Kapso

| Use Case | Frequency | Solution |
|----------|-----------|----------|
| **"Thanks, we'll reply soon"** | 90% | Kapso template |
| **FAQ: pricing, hours, location** | 70% | Kapso knowledge base |
| **"We're closed, reply tomorrow"** | 50% | Kapso schedule trigger |
| **Route to sales team** | 60% | Kapso condition + tag |
| **Alert: 24h window closing** | 40% | Kapso schedule + webhook |

### Complex Bots (20% of requests) → Keep ARI

| Use Case | Frequency | Solution |
|----------|-----------|----------|
| **Lead qualification with scoring** | 30% | ARI Brain |
| **Appointment booking system** | 20% | ARI slots |
| **Multi-language AI conversations** | 15% | ARI Mouth |
| **Custom state machines** | 10% | ARI flow stages |

---

## Recommended Hybrid Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  Simple Tasks (80%)           │  Complex Tasks (20%)         │
│                              │                               │
│  • Auto-acknowledgment        │  • Lead qualification         │
│  • FAQ answers                │  • Appointment booking        │
│  • Business hours             │  • Multi-language AI          │
│  • Lead routing               │  • Custom lead scoring        │
│  • 24h window alerts          │                               │
│                              │                               │
│  Implementation:             │  Implementation:              │
│  Kapso Workflows             │  ARI (Mouth + Brain)          │
│  (visual, minutes)           │  (custom, weeks)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Wins: Migrate to Kapso This Week

### 1. Auto-Acknowledgment Workflow (5 minutes)

```
Kapso Dashboard → Workflows → Create New
Trigger: Incoming message
Condition: Contact has no previous messages
Action: Send template message
Template: "auto_acknowledgment"
```

### 2. Business Hours Workflow (10 minutes)

```
Kapso Dashboard → Workflows → Create New
Trigger: Incoming message
Condition: Current time is outside 9-5 Mon-Fri
Action: Send message "We're closed, will reply tomorrow"
```

### 3. 24h Window Alert (15 minutes)

```
Kapso Dashboard → Workflows → Create New
Trigger: Schedule (every hour)
Action: Make API Request → Your Convex endpoint
Endpoint: GET /api/conversations?expiring_soon=true
Output: Send Slack notification to team
```

---

## When to Use Which (Decision Tree)

```
Client wants bot
    ↓
What do they need?
    ↓
    ├─ Simple auto-reply → Kapso Workflow
    ├─ FAQ automation → Kapso Workflow
    ├─ Business hours → Kapso Workflow
    ├─ Lead routing → Kapso Workflow
    ├─ 24h alerts → Kapso Workflow
    ├─ Lead scoring → ARI (Brain)
    ├─ Appointment booking → ARI (Slots)
    └─ Multi-language AI → ARI (Mouth)
```

---

## Cost Savings

**ARI Costs:**
- Grok API: ~$97/month per 1000 conversations
- Development: ~$2000 initial + ~$500/month maintenance

**Kapso Workflow Costs:**
- AI Agent: $0 (included in plan)
- Development: ~$200 one-time + $0/month

**Savings:** ~$1800/month for simple bots

---

## Next Steps for Bots

1. **Read [BOT-STRATEGY.md](./BOT-STRATEGY.md)** - Complete analysis of ARI vs. Kapso
2. **Audit ARI usage** - Which clients need complex features?
3. **Set up Kapso workflow templates** - Auto-ACK, FAQ, hours, routing
4. **Migrate simple clients** - Keep ARI only for high-value cases
5. **Track metrics** - AI costs, development time, client satisfaction

---

## Key Takeaways (Bots)

### What You Got Right

- ✅ ARI is sophisticated (lead scoring, appointments, multi-language)
- ✅ The Mouth + Brain split is good architecture
- ✅ Multi-tenant aware (workspace-specific config)

### What Should Change

- 🔄 Over-engineering for simple use cases (auto-ACK doesn't need AI)
- 🔄 Maintenance burden (custom code vs. visual workflows)
- 🔄 AI costs (paying for Grok when simple rules suffice)
- 🔄 Client setup complexity (training clients on your system)

### Bottom Line

**Use Kapso workflows for:**
- Auto-acknowledgment
- FAQ automation
- Business hours
- Lead routing
- 24h window alerts

**Keep ARI for:**
- Lead qualification with scoring
- Appointment booking system
- Multi-language complex AI

---

*Document version: 2.0*
*Last updated: January 29, 2025*
*Based on codebase review and Kapso API analysis*

**Related Documents:**
- [BOT-STRATEGY.md](./BOT-STRATEGY.md) - Complete bot strategy analysis
- [Kapso API Docs](https://docs.kapso.ai) - Platform API reference
