# Phase 11: Smart Lead Automation - Research

**Researched:** 2026-02-01
**Domain:** Webhook processing, phone normalization, CRM data display, activity timeline UI
**Confidence:** HIGH

## Summary

Phase 11 automates lead creation from WhatsApp conversations using existing webhook infrastructure. The core challenge is fixing the phone number normalization bug (queries by raw phone instead of normalized phone) and adding activity tracking (lastActivityAt field). The webhook infrastructure is already robust with signature verification, message deduplication, and batched processing. Dashboard UI needs a right panel to display universal + niche lead data with inline editing and an activity timeline.

**Key findings:**
- Phone normalization library (libphonenumber-js) already implemented and working correctly
- Bug is in database query: webhook normalizes phone but queries by raw phone string
- Webhook already has idempotency via kapso_message_id unique tracking
- Convex provides built-in OCC (Optimistic Concurrency Control) preventing race conditions
- Activity timeline pattern: daily summaries with dropdown for message details
- Inline editing pattern: auto-save on blur, no explicit save button

**Primary recommendation:** Fix phone_normalized query in findOrCreateContactWebhook mutation (line 1780-1785 in convex/mutations.ts), add lastActivityAt field to schema, build right panel with sections for universal/niche data display.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| libphonenumber-js | Latest | E.164 phone normalization | Industry standard for international phone parsing, 80-145KB metadata sets for different validation levels |
| Convex mutations | 1.x | Database write operations | Built-in ACID transactions with OCC prevent duplicate writes automatically |
| React 19 | 19.x | UI components | Already in use, supports concurrent features for inline editing UX |
| shadcn/ui | Latest | UI components | Project standard for components (Input, Form, etc.) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 3.x | Styling timeline/panel | Already project standard for all styling |
| date-fns | Latest | Timestamp formatting | Format timestamps for activity timeline display |
| Lucide React | Latest | Icons for timeline | Activity type icons (message, note, status change) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| libphonenumber-js | google-libphonenumber (full) | Full library is 145KB vs min 80KB - unnecessary for basic E.164 normalization |
| Auto-save on blur | Explicit save button | Adds friction to inline editing, increases clicks, feels dated in 2026 |
| Daily summaries | Show all messages | Timeline becomes overwhelming with 50+ messages per day |

**Installation:**
```bash
npm install date-fns lucide-react
# libphonenumber-js already installed in project
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── dashboard/
│   │   ├── lead-panel.tsx          # Right panel container
│   │   ├── lead-data-section.tsx   # Universal + niche data display
│   │   ├── activity-timeline.tsx   # Activity feed with daily summaries
│   │   └── inline-edit-field.tsx   # Reusable inline edit component
│   └── ui/                          # shadcn/ui components
├── lib/
│   ├── phone/
│   │   └── normalize.ts             # Already exists - E.164 normalization
│   └── activity/
│       └── summarize.ts             # AI daily summary generation
convex/
├── mutations.ts                      # Fix phone_normalized query (line 1780)
└── schema.ts                         # Add lastActivityAt field to contacts table
```

### Pattern 1: Phone Normalization with Deduplication
**What:** Normalize all phone numbers to E.164 format before storage, query by normalized phone to prevent duplicates
**When to use:** Every webhook message, every contact lookup, every API call involving phone numbers

**Example:**
```typescript
// Current implementation in /src/lib/phone/normalize.ts (working correctly)
import { normalizePhone } from '@/lib/phone/normalize'

// Webhook receives: "0813", "62813", "+62813", "081234567890"
const normalized = normalizePhone(phone, 'ID')  // All become: "+6281234567890"

// BUG TO FIX in convex/mutations.ts line 1780-1785:
// Current (WRONG - queries by raw phone):
const existing = await ctx.db
  .query("contacts")
  .withIndex("by_workspace_phone", (q) =>
    q.eq("workspace_id", args.workspace_id).eq("phone", args.phone)  // ❌ Raw phone
  )
  .first();

// Fixed (queries by normalized phone):
const existing = await ctx.db
  .query("contacts")
  .withIndex("by_workspace_phone_normalized", (q) =>
    q.eq("workspace_id", args.workspace_id).eq("phone_normalized", args.phone_normalized)  // ✅ Normalized
  )
  .first();
```

### Pattern 2: Webhook Idempotency via Unique Message ID
**What:** Track processed webhook messages by kapso_message_id to prevent duplicate processing on retries
**When to use:** All webhook endpoints that process external events

**Example:**
```typescript
// Source: Existing webhook implementation /src/app/api/webhook/kapso/route.ts line 255-264
// Already implemented correctly - no changes needed

// Step 3: Filter out duplicate messages
const newMessages: MessageData[] = []
for (const messageData of messagesData) {
  const exists = await convex.query(api.mutations.messageExistsByKapsoId, {
    kapso_message_id: messageData.message.id
  })

  if (!exists) {
    newMessages.push(messageData)
  }
}
```

### Pattern 3: Activity Tracking with lastActivityAt
**What:** Update contact.lastActivityAt on every inbound message to track lead engagement for follow-up prioritization
**When to use:** Every inbound message processing in webhook handler

**Example:**
```typescript
// Add to schema.ts contacts table (line 104):
lastActivityAt: v.optional(v.number()), // Already exists in schema ✅

// Update in findOrCreateContactWebhook mutation after line 1799:
if (existing) {
  await ctx.db.patch(existing._id, {
    lastActivityAt: now,  // Track activity timestamp
    kapso_name: args.kapso_name || existing.kapso_name,
    cache_updated_at: now,
    updated_at: now,
  });
  return await ctx.db.get(existing._id);
}
```

### Pattern 4: Inline Editing with Auto-Save
**What:** Click-to-edit fields with auto-save on blur, no explicit save button
**When to use:** Lead data fields in right panel (name, email, business_type, etc.)

**Example:**
```typescript
// Pattern for inline edit component
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

function InlineEditField({ contactId, field, value }) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const updateContact = useMutation(api.mutations.updateContact)

  const handleBlur = async () => {
    setIsEditing(false)
    if (localValue !== value) {
      // Auto-save on blur if changed
      await updateContact({
        contact_id: contactId,
        [field]: localValue
      })
    }
  }

  return isEditing ? (
    <input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      autoFocus
    />
  ) : (
    <div onClick={() => setIsEditing(true)}>{value || 'Click to edit'}</div>
  )
}
```

### Pattern 5: Activity Timeline with Daily Summaries
**What:** Group messages by day with AI-generated summary, dropdown to expand individual messages
**When to use:** Activity section in right panel, showing chronological lead interactions

**Example:**
```typescript
// Timeline structure (newest first recommended)
interface DailyActivity {
  date: string              // "2026-02-01"
  summary: string           // "5 messages - Lead asked about pricing, requested demo"
  messageCount: number      // 5
  messages: Message[]       // Individual messages (shown when expanded)
  events: Event[]          // Status changes, notes, system events
}

// Component structure:
<div className="space-y-4">
  {dailyActivities.map(day => (
    <div key={day.date}>
      <div className="font-medium">{formatDate(day.date)}</div>
      <div className="text-sm text-muted-foreground">{day.summary}</div>
      <Collapsible>
        <CollapsibleTrigger>Show {day.messageCount} messages</CollapsibleTrigger>
        <CollapsibleContent>
          {day.messages.map(msg => (
            <div key={msg.id}>
              <span>{formatTime(msg.created_at)}</span>
              <span>{msg.content}</span>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  ))}
</div>
```

### Anti-Patterns to Avoid
- **Querying by raw phone string:** Always use phone_normalized field for lookups
- **Trusting webhook payload timestamps without validation:** Always use server-side Date.now() for database timestamps
- **Overwriting manual CRM edits with automated updates:** Only update empty fields or activity-related fields
- **Showing all 50+ messages in timeline:** Use daily summaries with expand/collapse for details
- **Explicit save buttons for inline editing:** Use auto-save on blur for frictionless UX

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone number normalization | Custom regex phone parser | libphonenumber-js (already implemented) | Handles international formats, country codes, validation - 200+ countries supported |
| Webhook idempotency | Custom TTL tracking system | Convex unique indexes + OCC | Built-in race condition prevention, automatic conflict resolution |
| Inline editing state | Custom edit/save state machine | Auto-save on blur pattern | Industry standard in 2026, reduces clicks, better UX |
| Activity feed AI summaries | Custom text extraction | LLM prompt with message batch | AI extracts intents/themes better than keywords |
| Timeline grouping by day | Manual date grouping logic | date-fns groupBy + format | Handles timezones, locales, edge cases |

**Key insight:** Webhook reliability is critical - don't reinvent idempotency, deduplication, or phone normalization. These problems have sharp edges (race conditions, international formats, retry storms) that mature libraries already handle.

## Common Pitfalls

### Pitfall 1: Phone Number Lookup Mismatches
**What goes wrong:** Webhook normalizes phone to +6281234567890 but queries database by raw phone "0813", creating duplicate contacts
**Why it happens:** Code normalizes phone for storage but forgets to query by normalized field
**How to avoid:** Always query by phone_normalized field, not raw phone field
**Warning signs:** Multiple contacts with same phone in different formats (0813, 62813, +62813)

**Fix location:** `/convex/mutations.ts` line 1780-1785
```typescript
// Change query index from "by_workspace_phone" to "by_workspace_phone_normalized"
// Query by phone_normalized field instead of phone field
```

### Pitfall 2: Webhook Retry Duplicate Leads
**What goes wrong:** Webhook retries create duplicate leads because idempotency check fails
**Why it happens:** Using non-unique identifiers for deduplication (timestamp, content hash) instead of stable webhook event ID
**How to avoid:** Use kapso_message_id (provider's unique ID) for deduplication, not timestamp or content
**Warning signs:** Same message appearing multiple times in conversation, duplicate lead entries

**Already handled correctly:** Lines 255-264 in `/src/app/api/webhook/kapso/route.ts`

### Pitfall 3: Overwriting Manual CRM Edits
**What goes wrong:** User manually sets contact name to "John (Hot Lead - Follow up Mon)", webhook overwrites with WhatsApp name "John"
**Why it happens:** Automated updates don't check if field was manually edited
**How to avoid:** Only update empty fields (if !existing.name) or activity-related fields (lastActivityAt, unread_count)
**Warning signs:** User complaints about "data keeps changing back", CRM edits getting lost

**Implementation:**
```typescript
// In findOrCreateContactWebhook, only update kapso_name if contact.name is empty
if (args.kapso_name && args.kapso_name !== existing.kapso_name) {
  await ctx.db.patch(existing._id, {
    kapso_name: args.kapso_name,
    // Only overwrite name if not manually set
    ...(existing.name ? {} : { name: args.kapso_name }),
    lastActivityAt: now,  // Always update activity timestamp
    updated_at: now,
  });
}
```

### Pitfall 4: Timeline Performance with Large Message Counts
**What goes wrong:** Loading 500+ messages for activity timeline causes slow page loads, UI freezes
**Why it happens:** Querying all messages at once without pagination or daily grouping
**How to avoid:** Group by day, lazy-load expanded message details, limit initial load to last 30 days
**Warning signs:** Dashboard slow to load, timeline scroll lag with long conversations

**Solution:**
```typescript
// Query messages grouped by day, don't load all at once
const recentActivity = await ctx.db
  .query("messages")
  .withIndex("by_conversation_time", q => q.eq("conversation_id", conversationId))
  .order("desc")
  .filter(q => q.gte(q.field("created_at"), thirtyDaysAgo))  // Limit to 30 days
  .take(100);  // Cap at 100 most recent

// Group by day on client side, lazy-load details
```

### Pitfall 5: E.164 Format Edge Cases
**What goes wrong:** Indonesian numbers starting with "08" fail to normalize, causing lookup failures
**Why it happens:** Not handling country-specific formatting rules (Indonesia drops leading 0 for +62)
**How to avoid:** Use libphonenumber-js with country hint ('ID'), test with local number formats
**Warning signs:** Indonesian contacts not being found, duplicate leads for same number

**Already handled correctly:** `/src/lib/phone/normalize.ts` lines 18-21 handle "08" → "+628" conversion

## Code Examples

Verified patterns from official sources:

### Phone Normalization (E.164 Format)
```typescript
// Source: /src/lib/phone/normalize.ts (already implemented)
import { normalizePhone } from '@/lib/phone/normalize'

// Handle Indonesian formats
const variants = [
  "081234567890",   // Local format
  "0813",           // Partial
  "62813",          // Country code, no +
  "+62813",         // E.164
]

// All normalize to same result
variants.forEach(phone => {
  console.log(normalizePhone(phone, 'ID'))  // "+6281234567890"
})

// Invalid numbers return null
normalizePhone("123", 'ID')  // null
normalizePhone("", 'ID')     // null
```

### Webhook Idempotency Check
```typescript
// Source: /src/app/api/webhook/kapso/route.ts line 255-264
// Filter out duplicate messages by checking kapso_message_id
const newMessages: MessageData[] = []

for (const messageData of messagesData) {
  const exists = await convex.query(api.mutations.messageExistsByKapsoId, {
    kapso_message_id: messageData.message.id  // Stable provider ID
  })

  if (!exists) {
    newMessages.push(messageData)
  }
}

// Only process new messages
console.log(`Processing ${newMessages.length} new messages`)
```

### Convex Mutation with OCC
```typescript
// Source: Convex official docs - https://docs.convex.dev/functions/mutation-functions
// Built-in optimistic concurrency control prevents race conditions

export const updateContactActivity = mutation({
  args: {
    contact_id: v.id("contacts"),
    lastActivityAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Convex automatically handles concurrent writes
    // If two webhooks update same contact simultaneously:
    // - First write succeeds
    // - Second write retries with fresh data
    // No manual locking needed
    await ctx.db.patch(args.contact_id, {
      lastActivityAt: args.lastActivityAt,
      updated_at: Date.now(),
    });
  },
});
```

### Inline Edit with Auto-Save
```typescript
// Pattern based on: https://blog.logrocket.com/build-inline-editable-ui-react/
import { useState } from 'react'
import { useMutation } from 'convex/react'

function InlineEditField({ contactId, field, value, label }) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const updateContact = useMutation(api.mutations.updateContact)

  const handleSave = async () => {
    if (localValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await updateContact({
        contact_id: contactId,
        [field]: localValue,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
      setLocalValue(value)  // Revert on error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {isEditing ? (
        <input
          className="w-full px-3 py-2 border rounded"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}  // Auto-save on blur
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') {
              setLocalValue(value)
              setIsEditing(false)
            }
          }}
          disabled={isSaving}
          autoFocus
        />
      ) : (
        <div
          className="px-3 py-2 border border-transparent hover:border-gray-300 rounded cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          {value || <span className="text-muted-foreground">Click to edit</span>}
        </div>
      )}
    </div>
  )
}
```

### Activity Timeline with Daily Grouping
```typescript
// Pattern based on: https://flowbite.com/docs/components/timeline/
import { format, formatDistanceToNow } from 'date-fns'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface Message {
  id: string
  content: string
  created_at: number
  direction: 'inbound' | 'outbound'
}

interface DailyActivity {
  date: string
  summary: string
  messages: Message[]
}

function ActivityTimeline({ activities }: { activities: DailyActivity[] }) {
  return (
    <div className="space-y-6">
      {activities.map((day) => (
        <div key={day.date} className="relative pl-6 border-l-2 border-gray-200">
          {/* Timeline dot */}
          <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full" />

          {/* Date and summary */}
          <div className="mb-2">
            <div className="font-medium text-sm">
              {format(new Date(day.date), 'MMM d, yyyy')}
            </div>
            <div className="text-sm text-muted-foreground">
              {day.summary}
            </div>
          </div>

          {/* Expandable message details */}
          <Collapsible>
            <CollapsibleTrigger className="text-sm text-blue-600 hover:underline">
              Show {day.messages.length} messages
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {day.messages.map((msg) => (
                <div key={msg.id} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                    <span className={msg.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'}>
                      {msg.direction === 'inbound' ? '← Received' : '→ Sent'}
                    </span>
                  </div>
                  <div>{msg.content}</div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Explicit save buttons for editing | Auto-save on blur | 2024-2025 shift | Reduces clicks, faster workflows, industry standard in modern CRMs |
| Show all messages in feed | Daily summaries + expand | 2025-2026 AI era | Timeline stays scannable even with 100+ messages/day |
| Manual phone deduplication | E.164 normalization | Always required | Industry standard since PSTN, critical for international numbers |
| Custom webhook retry logic | Provider-side retries + idempotency | 2023+ | Shifts complexity to provider, receiver just needs deduplication |
| Regex phone validation | libphonenumber-js | 2018+ standard | Handles 200+ countries, validation, formatting, type detection |

**Deprecated/outdated:**
- Custom phone parsers: Use libphonenumber-js (Google's library, battle-tested)
- Synchronous webhook processing: Use queue-first architecture (respond 200 immediately, process async)
- Explicit "Save" buttons for inline edits: Auto-save on blur is 2026 standard

## Open Questions

Things that couldn't be fully resolved:

1. **AI Summary Generation Algorithm**
   - What we know: Daily summaries should extract key intents/themes from messages
   - What's unclear: Specific prompt template, which LLM to use (existing ARI model vs dedicated summarizer)
   - Recommendation: Use existing ARI infrastructure (Sea Lion or Grok) with simple prompt "Summarize these {count} messages in one sentence, focusing on what the lead asked for or their main intent"

2. **Activity Timeline Chronological Order**
   - What we know: Could be newest-first or oldest-first
   - What's unclear: User preference for CRM context (scroll down for history vs scroll up for history)
   - Recommendation: **Newest first** (reverse chronological) - matches inbox/chat apps, users see latest activity without scrolling

3. **Niche Data Conditional Display**
   - What we know: Different industries need different fields (real estate vs med spa vs SaaS)
   - What's unclear: How to determine which niche data to show (business_type field? Manual selection? Auto-detect?)
   - Recommendation: Use contact.business_type field to conditionally render niche sections - if business_type matches niche category, show those fields

4. **Index Creation for phone_normalized**
   - What we know: Need to query by phone_normalized field
   - What's unclear: Whether index already exists (schema shows indexes but not all listed)
   - Recommendation: Check schema.ts line 106 - may need to add .index("by_workspace_phone_normalized", ["workspace_id", "phone_normalized"]) if not present

## Sources

### Primary (HIGH confidence)
- [Hookdeck: Implement Webhook Idempotency](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency) - Webhook deduplication patterns
- [Convex Database Writing Data](https://docs.convex.dev/database/writing-data) - OCC and mutation patterns
- [Convex Mutation Functions](https://docs.convex.dev/functions/mutation-functions) - Transaction guarantees
- [Twilio: What is E.164?](https://www.twilio.com/docs/glossary/what-e164) - E.164 format specification
- [libphonenumber-js GitHub](https://github.com/catamphetamine/libphonenumber-js) - Phone normalization library documentation

### Secondary (MEDIUM confidence)
- [LogRocket: Build Inline Editable UI in React](https://blog.logrocket.com/build-inline-editable-ui-react/) - Inline editing patterns
- [Aubergine: Guide to Designing Chronological Activity Feeds](https://www.aubergine.co/insights/a-guide-to-designing-chronological-activity-feeds) - Timeline UI best practices
- [Flowbite: Tailwind CSS Timeline](https://flowbite.com/docs/components/timeline/) - Timeline component examples
- [Medium: How to Implement Auto-Save Feature in React](https://medium.com/@cchalop1/how-to-implement-an-auto-save-feature-in-react-b88268d1c691) - Auto-save patterns

### Tertiary (LOW confidence)
- [Zapier: AI Summarize Email Alerts into Daily Digest](https://zapier.com/automation/use-case/using-ai-summarize-new-email-alerts-into-a-daily-digest-for-easy-review) - AI summarization workflow patterns
- [shadcn/ui GitHub Issue #1719](https://github.com/shadcn-ui/ui/issues/1719) - Inline editing discussions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use or industry standard
- Architecture: HIGH - Patterns verified in existing codebase and official docs
- Pitfalls: HIGH - Bug location identified in code, solutions verified

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable domain, no fast-moving changes expected)
