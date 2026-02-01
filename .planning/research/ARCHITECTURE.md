# Architecture Research: Lead Automation Integration

**Domain:** CRM Lead Automation with Daily Activity Summaries
**Researched:** 2026-02-01
**Confidence:** HIGH

## Current Architecture (v2.0 Foundation)

### Existing System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          KAPSO WEBHOOK                               │
│  Receives WhatsApp message events → validates signature             │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│               /api/webhooks/whatsapp/route.ts                        │
│  1. Find workspace by phone_number_id                                │
│  2. findOrCreateContactWebhook (dedup by phone)                      │
│  3. findOrCreateConversationWebhook (links contact)                  │
│  4. createInboundMessageWebhook (stores message)                     │
│  5. processWithRules (rules engine + AI fallback)                    │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      CONVEX BACKEND                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   contacts   │  │conversations │  │   messages   │              │
│  │ (leads data) │  │  (threads)   │  │ (chat log)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────┐           │
│  │  sarah.ts (chatbot state sync to contacts)           │           │
│  │  leads.ts (status workflow, notes timeline)          │           │
│  └──────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS FRONTEND                                 │
│  Dashboard (lead list) → Inbox (Kapso embed) → Lead Detail          │
└─────────────────────────────────────────────────────────────────────┘
```

### Current Data Flow (v2.0)

```
WhatsApp Message Event
    ↓
Kapso Webhook (signature validation)
    ↓
/api/webhooks/whatsapp/route.ts
    ↓
findOrCreateContactWebhook
    ├─ Lookup by workspace_id + phone (index: by_workspace_phone)
    ├─ Deduplicate: phone only (exact match)
    └─ Create if new: { source: "whatsapp", lead_status: "new" }
    ↓
findOrCreateConversationWebhook
    ├─ Lookup by contact_id (index: by_contact)
    └─ Link Kapso conversation_id for inbox sync
    ↓
createInboundMessageWebhook
    ├─ Store message in Convex
    └─ Update conversation.last_message_at
    ↓
processWithRules (rules engine)
    ├─ Keyword detection (FAQ, handoff, manager commands)
    ├─ AI fallback to Sarah/Grok
    └─ Response sent via Kapso API
```

## New Requirements for v2.0.1

### User Requirements

1. **Automatic lead creation:** Every WhatsApp message creates/updates a lead
2. **Deduplication:** Phone number only (no email, no name matching)
3. **Daily activity summaries:** Auto-generated notes summarizing the day's chat
4. **Notes display:** Show activity summaries in lead detail panel

### Existing Foundation to Build On

**Already working (v2.0):**
- Webhook receives all messages (processMessageWithRules in route.ts)
- findOrCreateContactWebhook handles deduplication by phone
- contacts table has notes timeline array (notes field with addedBy, addedAt)
- leads.ts has addContactNote mutation for note creation
- Convex cron job infrastructure exists (crons.ts with brain-daily-summary)
- Grok 4.1-fast integration for AI summaries (brainAnalysis.ts)

**What's missing:**
- Lead creation is passive (only on contact, no proactive update)
- Daily summary cron doesn't generate per-lead activity notes
- Activity aggregation logic (what data to summarize)
- Note display UI in lead detail panel

## Recommended Architecture for Lead Automation

### Integration Points

#### 1. Webhook Enhancement (MODIFY EXISTING)

**File:** `src/app/api/webhooks/whatsapp/route.ts`

**Current behavior:** Creates contact, conversation, message, then rules processing
**New behavior:** Same flow + update lead metadata (lastActivityAt timestamp)

**Change required:**
```typescript
// After createInboundMessageWebhook, BEFORE processWithRules:
await convex.mutation(api.leads.trackLeadActivity, {
  contactId: contact._id,
  activityType: 'message_received',
  metadata: {
    messageId: messageId,
    timestamp: Date.now(),
  }
})
```

**Why here:** Webhook already has contact_id, workspace_id, message data. No additional lookup needed.

**Performance:** Single mutation call, no blocking. Webhook still responds within 10s requirement.

#### 2. Lead Activity Tracking (NEW MUTATION)

**File:** `convex/leads.ts` (append new mutation)

**Purpose:** Update contact.lastActivityAt whenever any activity occurs

**Implementation:**
```typescript
export const trackLeadActivity = mutation({
  args: {
    contactId: v.id("contacts"),
    activityType: v.string(), // 'message_received' | 'message_sent' | 'status_changed'
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contactId, {
      lastActivityAt: Date.now(),
      updated_at: Date.now(),
    });
  },
});
```

**Why simple:** Schema already has lastActivityAt field. No complex aggregation needed.

**Deduplication:** Phone-only matching already handled by findOrCreateContactWebhook using by_workspace_phone index.

#### 3. Daily Summary Generation (MODIFY EXISTING CRON)

**File:** `convex/crons.ts` (already has brain-daily-summary)

**Current behavior:** Generates workspace-level summary (all leads overview)
**New behavior:** Generate per-lead activity summaries as notes

**Architecture decision:** ADD new cron job instead of modifying existing one

**New cron:**
```typescript
crons.daily(
  "lead-activity-summaries",
  { hourUTC: 2, minuteUTC: 0 }, // 10:00 WIB (after brain summary at 09:00)
  internal.leads.generateDailyActivityNotes
);
```

**Why separate cron:**
- Workspace summary (brain-daily-summary) = overview for manager
- Lead activity summaries = per-contact detailed notes
- Different purposes, different prompts, different storage
- Can run at different times (workspace summary first, then lead notes)

#### 4. Activity Aggregation Service (NEW INTERNAL MUTATION)

**File:** `convex/leads.ts` (append new internalMutation)

**Purpose:** Generate daily activity summary for each active lead and store as note

**Data to aggregate:**
- Messages sent/received count (today)
- Topics discussed (extracted from message content)
- Status changes (if any)
- Sarah phase transitions (if using chatbot)

**Implementation approach:**
```typescript
export const generateDailyActivityNotes = internalMutation({
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();

    for (const workspace of workspaces) {
      // Get contacts with activity in last 24 hours
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
      const activeContacts = await ctx.db
        .query("contacts")
        .withIndex("by_workspace", q => q.eq("workspace_id", workspace._id))
        .filter(q => q.gte(q.field("lastActivityAt"), cutoffTime))
        .collect();

      for (const contact of activeContacts) {
        // Generate summary using aggregated data
        const summary = await generateActivitySummary(ctx, contact, workspace);

        // Add as note using existing mutation
        if (summary) {
          await ctx.db.patch(contact._id, {
            notes: [
              ...(contact.notes || []),
              {
                content: summary,
                addedBy: "system-daily-summary",
                addedAt: Date.now(),
              }
            ],
            updated_at: Date.now(),
          });
        }
      }
    }
  },
});
```

**Why internal mutation:** Called by cron (not exposed to HTTP). No auth needed.

**Scalability consideration:** Processes contacts sequentially per workspace. For 100-1000 contacts, this is fine. For 10k+ contacts, would need to batch and use Promise.all.

#### 5. Activity Summary Generation (AI-POWERED)

**AI model selection:**

| Model | Cost/M tokens (input/output) | Speed | Quality | Recommendation |
|-------|------------------------------|-------|---------|----------------|
| Grok 4.1-fast | $0.20 / $0.50 | Fast | Good | **RECOMMENDED** |
| Gemini 2.5 Flash | $0.075 / $0.30 | Very fast | Good | Alternative |
| GPT-4o-mini | $0.15 / $0.60 | Fast | Very good | Over-spec'd |

**Recommendation: Grok 4.1-fast**

**Rationale:**
- Already integrated in brainAnalysis.ts (reuse code)
- Cost-effective for high volume ($0.0002 per summary)
- Fast response (no user waiting, cron job)
- Quality sufficient for activity summaries (not customer-facing)

**Prompt strategy:**
```typescript
const systemPrompt = `You are an activity summarizer. Given today's chat activity for a lead, create a brief 2-3 sentence summary.

Focus on:
- Key topics discussed
- Lead's questions or concerns
- Next steps mentioned

Format: Plain text, under 200 characters. No markdown, no bullet points.`;

const userPrompt = `Summarize today's activity for ${contact.name || 'Unknown'}:
Messages received: ${messageCount}
Topics: ${extractedTopics.join(', ')}
Last message: "${lastMessage.substring(0, 100)}..."`;
```

**Why short prompts:** Reduces token cost. Activity summaries don't need deep analysis, just factual recap.

**Storage:** Store summary in contacts.notes array as:
```typescript
{
  content: "Discussed pricing for social media service. Asked about payment plans. Interested in monthly package.",
  addedBy: "system-daily-summary",
  addedAt: 1738425600000, // timestamp
}
```

#### 6. Lead Detail Panel Updates (NEW COMPONENT)

**File:** `src/app/[workspace]/demo/database/components/LeadDetailPanel.tsx` (if exists) or create new

**Purpose:** Display notes timeline in lead detail view

**Component structure:**
```typescript
export function ActivityTimeline({ notes }: { notes: Note[] }) {
  return (
    <div className="space-y-4">
      <h3>Activity History</h3>
      {notes.map((note, idx) => (
        <div key={idx} className="border-l-2 pl-4">
          <div className="text-sm text-muted-foreground">
            {formatDate(note.addedAt)} • {note.addedBy}
          </div>
          <p>{note.content}</p>
        </div>
      ))}
    </div>
  );
}
```

**Why simple:** Notes already stored in contacts.notes array (schema field exists). Just need UI to display.

**Design:** Black/white theme, Geist Mono font, Shadcn/ui components (matches project style).

## Data Flow: New Lead Automation

### Message → Lead Update Flow

```
WhatsApp Message Event
    ↓
Kapso Webhook
    ↓
/api/webhooks/whatsapp/route.ts
    ↓
findOrCreateContactWebhook
    ├─ Lookup: by_workspace_phone (phone deduplication)
    ├─ Create if new OR update if exists
    └─ Return contact
    ↓
createInboundMessageWebhook (store message)
    ↓
trackLeadActivity (NEW)
    └─ Update contact.lastActivityAt
    ↓
processWithRules (existing rules engine)
```

**Performance:** +1 mutation call per webhook (trackLeadActivity). Adds ~10ms latency. Still well within 10s webhook timeout.

### Daily Summary Flow

```
Convex Cron (02:00 UTC / 10:00 WIB)
    ↓
generateDailyActivityNotes (NEW internal mutation)
    ↓
For each workspace:
    ├─ Query contacts with lastActivityAt > 24h ago
    ├─ For each active contact:
    │   ├─ Aggregate activity data (messages, topics, status)
    │   ├─ Call Grok 4.1-fast for summary generation
    │   └─ Store summary in contact.notes array
    └─ Next workspace
```

**Execution time:** ~50ms per contact (Grok API latency). For 100 contacts = 5 seconds total. For 1000 contacts = 50 seconds. Convex cron timeout = 5 minutes (safe).

**Cost:** $0.0002 per summary. 100 contacts/day = $0.02/day = $7/year. 1000 contacts/day = $0.20/day = $73/year.

### Note Display Flow

```
User clicks lead in dashboard
    ↓
Lead Detail Panel renders
    ↓
Fetch contact by ID (Convex query)
    ├─ contact.notes array (already in schema)
    └─ Sort by addedAt DESC (newest first)
    ↓
ActivityTimeline component renders notes
```

**Performance:** No additional queries. Notes stored inline with contact document. Single read operation.

## Component Boundaries

### Modified Components

| Component | Current Responsibility | New Responsibility |
|-----------|------------------------|-------------------|
| `/api/webhooks/whatsapp/route.ts` | Receive webhook, create contact/message, process rules | + Track lead activity (update lastActivityAt) |
| `convex/leads.ts` | Lead status workflow, notes CRUD | + Daily activity note generation (cron handler) |
| `convex/crons.ts` | Brain daily summary at 09:00 WIB | + Lead activity summaries at 10:00 WIB |

### New Components

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `leads.trackLeadActivity` | Update lastActivityAt on any activity | Mutation (convex/leads.ts) |
| `leads.generateDailyActivityNotes` | Generate AI summaries for active leads | Internal mutation (convex/leads.ts) |
| `ActivityTimeline` | Display notes in lead detail panel | React component (frontend) |

## Build Order (Dependency Chain)

**Phase 1: Foundation (No UI changes)**
1. Add `trackLeadActivity` mutation to `convex/leads.ts`
2. Modify webhook to call `trackLeadActivity` after message creation
3. Test: Verify lastActivityAt updates on every message

**Phase 2: Daily Summaries (Backend only)**
4. Add `generateDailyActivityNotes` internal mutation to `convex/leads.ts`
5. Add Grok API call helper (reuse from brainAnalysis.ts)
6. Add new cron job to `convex/crons.ts`
7. Test: Run cron manually, verify notes created

**Phase 3: UI (Frontend)**
8. Create ActivityTimeline component
9. Integrate into lead detail panel
10. Test: Verify notes display correctly

**Why this order:**
- Phase 1 is non-blocking (just tracking, no side effects)
- Phase 2 can run in background (doesn't break existing features)
- Phase 3 is pure UI (no backend dependency once Phase 2 works)

**Parallel work possible:**
- Phase 1 and Phase 2 backend logic can be built simultaneously (different functions)
- Phase 3 can start with mock data while Phase 2 is in progress

## Performance Implications

### Deduplication at Scale

**Current approach:** Lookup by workspace_id + phone using by_workspace_phone index

**Performance:**
- Index lookup: O(log n) where n = contacts in workspace
- For 1000 contacts: ~10 index reads
- For 10,000 contacts: ~14 index reads
- For 100,000 contacts: ~17 index reads

**Bottleneck:** None. Convex indexes are B-trees. Lookups are fast even at scale.

**Alternative considered: Phone normalization index**
- Add by_workspace_phone_normalized index for +62 vs 62 vs 0 variations
- Decision: NOT NEEDED. Webhook already normalizes phone before lookup (normalizePhone function)

### Webhook Latency Impact

**Current webhook processing time:** ~100-200ms
- Find workspace: 10ms
- Find/create contact: 20ms
- Find/create conversation: 20ms
- Create message: 20ms
- Process rules: 50-100ms

**Added latency with trackLeadActivity:**
- trackLeadActivity mutation: 10ms

**Total: 110-210ms** (still well under 10s timeout)

**Optimization opportunity:** Combine trackLeadActivity with findOrCreateContactWebhook (single mutation instead of two). Not critical, but possible if latency becomes issue.

### Daily Cron Performance

**Workload:** 100-1000 active contacts per day (typical SME CRM)

**Processing:**
- Query active contacts: 50ms (indexed by workspace)
- Per contact:
  - Aggregate messages: 20ms (indexed by conversation_id, created_at)
  - Call Grok API: 50ms
  - Store note: 10ms
  - Total per contact: 80ms

**Total time:**
- 100 contacts: 8 seconds
- 1000 contacts: 80 seconds (1.3 minutes)

**Convex cron timeout:** 5 minutes (safe headroom)

**Optimization for 10k+ contacts:**
- Batch Grok API calls (10 concurrent requests)
- Use Promise.all for parallel processing
- Reduces 10k contacts from 800s (13 min) to 80s (1.3 min)

## Anti-Patterns to Avoid

### Anti-Pattern 1: Deduplicate by Email or Name

**What people do:** Match contacts by email OR name OR phone
**Why it's wrong:**
- Email optional (not all leads have email)
- Name inconsistent (typos, variations)
- Creates false duplicates (two people, same name, different phone)

**Do this instead:**
- Phone number ONLY deduplication
- Phone normalized (+62 vs 62 vs 0 handled by normalizePhone)
- Index: by_workspace_phone (exact match)

**Already correct in v2.0:** findOrCreateContactWebhook uses phone-only lookup

### Anti-Pattern 2: Real-time AI Summary on Every Message

**What people do:** Call Grok API on every message to generate instant summary
**Why it's wrong:**
- Webhook timeout risk (Grok API latency variable)
- Cost explosion (Grok calls on every message = $$$)
- Unnecessary (summaries don't need to be instant)

**Do this instead:**
- Daily cron job (batch processing)
- Aggregate activity first, summarize once per day
- User sees summary next morning (acceptable latency)

**Recommendation:** Daily cron at 10:00 WIB (after workspace summary at 09:00)

### Anti-Pattern 3: Store Messages Twice for Aggregation

**What people do:** Copy messages to separate "activity log" table for summarization
**Why it's wrong:**
- Duplicate storage (messages already in messages table)
- Sync complexity (two sources of truth)
- Wasted database space

**Do this instead:**
- Query messages table directly (indexed by conversation_id, created_at)
- Aggregate on-the-fly during cron job
- No duplicate storage

**Already correct:** Messages stored in single messages table with proper indexes

### Anti-Pattern 4: Generate Summaries in Webhook Handler

**What people do:** Generate AI summary synchronously in webhook processing
**Why it's wrong:**
- Blocks webhook response (Kapso timeout)
- Unreliable (API failure = webhook failure)
- Bad user experience (delayed message ack)

**Do this instead:**
- Webhook only updates lastActivityAt (fast mutation)
- Cron job generates summaries asynchronously (batch, retry-able)
- Decouple user-facing flow from AI processing

**Recommendation:** trackLeadActivity mutation only updates timestamp (10ms). Grok summary generation happens in cron (non-blocking).

## Scalability Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k contacts | Current approach works. Single cron, sequential processing. |
| 1k-10k contacts | Add batching to cron (10 concurrent Grok API calls). |
| 10k-100k contacts | Shard cron by workspace (multiple cron jobs, workspace batches). Add Redis cache for activity aggregation. |
| 100k+ contacts | Consider separate worker service for summary generation (offload from Convex cron). Use message queue (e.g., Convex scheduler or external queue). |

**Current recommendation:** Build for 1k-10k scale. Add batching from start (future-proof).

## Sources

**Verified with official documentation:**
- Convex cron jobs: https://docs.convex.dev/scheduling/cron-jobs (HIGH confidence)
- Convex indexes performance: https://docs.convex.dev/database/indexes (HIGH confidence)
- Convex mutation timeouts: https://docs.convex.dev/functions (HIGH confidence)

**Verified with existing codebase:**
- Webhook flow: src/app/api/webhooks/whatsapp/route.ts (lines 68-243)
- Contact deduplication: convex/mutations.ts (lines 1770-1824)
- Notes schema: convex/schema.ts (lines 94-100)
- Cron setup: convex/crons.ts (lines 1-30)
- Grok integration: convex/brainAnalysis.ts (lines 68-110)

**Knowledge cutoff limitations:**
- Grok 4.1-fast pricing verified from documentation (as of Jan 2025)
- Convex cron timeout = 5 minutes (verified from docs)

---
*Architecture research for: Lead Automation with Daily Activity Summaries*
*Researched: 2026-02-01*
*Confidence: HIGH (based on existing codebase analysis + official Convex docs)*
