# Phase 4: Lead Database - Research

**Researched:** 2026-01-30
**Domain:** Convex Database Sync, Webhook Processing, Lead Data Schema
**Confidence:** HIGH

## Summary

This phase implements a lead database in Convex that mirrors Kapso WhatsApp data for instant dashboard access. The existing codebase already has mature patterns for webhook processing, contact/conversation sync, and Sarah bot state management that this phase can extend.

The primary technical challenge is schema design for Sarah's extracted data fields and implementing robust status tracking. The infrastructure for real-time webhook sync already exists in `convex/kapso.ts` and `convex/http.ts` - this phase extends it with lead-specific data fields.

**Primary recommendation:** Extend the existing `contacts` table with Sarah's extracted fields rather than creating a separate leads table. Use the existing `sarahConversations` table as the extraction source and sync to contacts on phase completion.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex | ^1.31.6 | Real-time database + functions | Already in use, reactive queries built-in |
| Kapso WhatsApp API | v24.0 | WhatsApp webhook source | Already integrated via `/webhook/kapso` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @convex-dev/auth | ^0.0.90 | Authentication context | Already configured, workspace scoping |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extend contacts table | New leads table | Contacts already linked to conversations/messages; extending avoids join complexity |
| Webhook real-time | Polling Kapso API | Webhook is faster (<1s) and already implemented |
| table-history component | Manual audit logs | Table-history for full audit trail, manual for simple last-changed only |

**Installation:**
No new packages required - existing Convex setup covers all needs.

## Architecture Patterns

### Recommended Project Structure
```
convex/
  schema.ts           # Extended contacts schema with Sarah fields
  kapso.ts            # Existing webhook processing (extend for lead sync)
  sarah.ts            # Existing Sarah state management (add sync triggers)
  leads.ts            # NEW: Lead-specific queries and mutations
  http.ts             # Existing HTTP actions (no changes needed)
```

### Pattern 1: Webhook-to-Database Sync (Already Implemented)
**What:** Kapso webhook triggers immediate Convex mutation via scheduler
**When to use:** All inbound message processing (already working)
**Existing Example:**
```typescript
// From convex/http.ts - POST /webhook/kapso
http.route({
  path: "/webhook/kapso",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = JSON.parse(await request.text());

    // Schedule async processing - returns 200 immediately
    await ctx.scheduler.runAfter(0, internal.kapso.processWebhook, {
      payload,
      receivedAt: Date.now(),
    });

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }),
});
```

### Pattern 2: Sarah State to Contact Sync
**What:** When Sarah conversation state updates, sync extracted data to contacts table
**When to use:** After each Sarah phase completion (Phase 1, 2, 3)
**Recommended Pattern:**
```typescript
// In convex/sarah.ts - extend upsertSarahState
export const upsertSarahState = httpAction(async (ctx, request) => {
  const body = await request.json();
  // ... existing state save logic ...

  // NEW: Sync extracted data to contact when phase completes
  if (body.extracted_data && Object.keys(body.extracted_data).length > 0) {
    await ctx.runMutation(internal.leads.syncSarahDataToContact, {
      contact_phone: body.contact_phone,
      extracted_data: body.extracted_data,
      lead_score: body.lead_score,
      lead_temperature: body.lead_temperature,
      chat_phase: body.state,
    });
  }
});
```

### Pattern 3: Notes as Timeline Array
**What:** Store notes as separate documents with timestamps for chronological display
**When to use:** Both bot-generated and human-added notes need tracking
**Existing Pattern:**
```typescript
// Already in schema.ts - contactNotes table
contactNotes: defineTable({
  workspace_id: v.id("workspaces"),
  contact_id: v.id("contacts"),
  user_id: v.string(),         // Can be "sarah-bot" for bot notes
  content: v.string(),
  created_at: v.number(),
  supabaseId: v.string(),
})
```

### Anti-Patterns to Avoid
- **Separate leads table:** Creates orphan records that need joins to contacts/conversations
- **Polling Kapso for sync:** Webhook already provides <1s latency, polling wastes resources
- **Storing notes in contact.metadata array:** Hard to query, array limits apply (8192 items)
- **Complex nested objects for status history:** Use separate statusHistory table or table-history component

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook deduplication | Custom ID tracking | Existing `by_kapso_message_id` index | Already handles race conditions |
| Real-time updates | WebSocket server | Convex reactive queries | Built into Convex, zero config |
| Phone normalization | Custom parsing | Existing `normalizePhone()` | Already handles +62, spaces, dashes |
| Contact creation | New mutations | Existing `processWorkspaceMessages()` | Already creates contacts from webhooks |
| Audit trail | Custom logging | table-history component or ticketStatusHistory pattern | Proven patterns exist |

**Key insight:** The codebase already handles 80% of the data sync requirements. This phase is primarily schema extension and field mapping, not new infrastructure.

## Common Pitfalls

### Pitfall 1: Duplicate Contact Creation
**What goes wrong:** Same phone number creates multiple contact records
**Why it happens:** Race condition when webhook processes faster than index query returns
**How to avoid:** The existing code already handles this with:
```typescript
// From kapso.ts - checks BEFORE each insert
const existingMsg = await ctx.db
  .query("messages")
  .withIndex("by_kapso_message_id", (q) => q.eq("kapso_message_id", message.id))
  .first();
if (existingMsg) { /* skip duplicate */ }
```
**Warning signs:** Contact count increases faster than unique phone count

### Pitfall 2: Status Sync Conflicts
**What goes wrong:** Sarah says "qualified" but human marked "lost"
**Why it happens:** Both bot and human can update status without coordination
**How to avoid:** Implement source priority: Kapso webhook > Brain bot > Sarah extraction > human edit. Or use last-write-wins with status_source field.
**Warning signs:** Status flips back and forth in logs

### Pitfall 3: Extracted Data Overwrite
**What goes wrong:** Phase 2 extraction overwrites Phase 1 data
**Why it happens:** Naive `{ ...existingData, ...newData }` replaces all fields
**How to avoid:** Deep merge that only updates non-null new fields:
```typescript
const mergedData = {
  ...existingData,
  ...Object.fromEntries(
    Object.entries(newData).filter(([_, v]) => v !== null && v !== undefined)
  ),
};
```
**Warning signs:** User names disappear after Phase 2 messages

### Pitfall 4: Lead Status vs Conversation Status Confusion
**What goes wrong:** UI shows wrong status because contact.lead_status and conversation.status are different
**Why it happens:** Existing code has both fields with different purposes
**How to avoid:**
- `conversation.status`: AI mode control (open/handover/closed)
- `contact.lead_status`: Sales pipeline stage (new/qualified/contacted/converted/archived)
**Warning signs:** Filters produce unexpected results, status counts don't match

## Code Examples

Verified patterns from existing codebase:

### Extend Contacts Schema with Sarah Fields
```typescript
// Source: convex/schema.ts - add to existing contacts table
contacts: defineTable({
  // ... existing fields ...

  // Sarah Phase 1 (Gathering)
  sarah_name: v.optional(v.string()),           // Extracted name (may differ from kapso_name)
  business_type: v.optional(v.string()),         // "online shop", "F&B", "spa"
  domisili: v.optional(v.string()),              // Location
  business_duration: v.optional(v.string()),     // "3 tahun", "baru mulai"

  // Sarah Phase 2 (Interest)
  pain_points: v.optional(v.array(v.string())),  // ["kewalahan", "miss message"]
  priority: v.optional(v.string()),              // Main pain point
  urgency_level: v.optional(v.string()),         // "high", "medium", "low"

  // Sarah Phase 3 (Closing)
  lead_score: v.number(),                        // 0-100 (already exists)
  lead_temperature: v.optional(v.string()),      // "hot", "warm", "lukewarm", "cold"
  closing_technique_used: v.optional(v.string()), // "assumptive", "summary", "scarcity"
  objection_raised: v.optional(v.string()),      // Last objection if any

  // Status tracking
  lead_status: v.string(),                       // Already exists: extend values
  chat_phase: v.optional(v.string()),            // "A", "B", "C", "D" from Sarah
  status_updated_at: v.optional(v.number()),     // Last status change timestamp
  status_updated_by: v.optional(v.string()),     // "sarah-bot", "brain-bot", user_id

  // Timestamps (some already exist)
  created_at: v.number(),
  updated_at: v.number(),
  last_message_at: v.optional(v.number()),       // Most recent message timestamp
  last_contact_at: v.optional(v.number()),       // Last human interaction

  // ... rest of existing fields ...
})
```

### Sync Sarah Data to Contact
```typescript
// Source: Recommended new mutation in convex/leads.ts
export const syncSarahDataToContact = internalMutation({
  args: {
    contact_phone: v.string(),
    extracted_data: v.any(),
    lead_score: v.number(),
    lead_temperature: v.string(),
    chat_phase: v.string(),
  },
  handler: async (ctx, args) => {
    // Find contact by phone
    const normalized = args.contact_phone.replace(/\D/g, "");

    // Query all workspaces for this phone (usually just one)
    const contacts = await ctx.db
      .query("contacts")
      .filter((q) => q.eq(q.field("phone_normalized"), normalized))
      .collect();

    if (contacts.length === 0) return { synced: false, reason: "contact_not_found" };

    const contact = contacts[0];
    const now = Date.now();

    // Build update object - only set non-null values
    const updates: any = {
      updated_at: now,
      last_message_at: now,
    };

    // Map Sarah extracted_data to contact fields
    if (args.extracted_data.name) updates.sarah_name = args.extracted_data.name;
    if (args.extracted_data.business_type) updates.business_type = args.extracted_data.business_type;
    if (args.extracted_data.domisili) updates.domisili = args.extracted_data.domisili;
    if (args.extracted_data.business_duration) updates.business_duration = args.extracted_data.business_duration;
    if (args.extracted_data.pain_points) updates.pain_points = args.extracted_data.pain_points;
    if (args.extracted_data.priority) updates.priority = args.extracted_data.priority;
    if (args.extracted_data.urgency_level) updates.urgency_level = args.extracted_data.urgency_level;

    // Always update scoring if provided
    if (args.lead_score !== undefined) updates.lead_score = args.lead_score;
    if (args.lead_temperature) updates.lead_temperature = args.lead_temperature;
    if (args.chat_phase) updates.chat_phase = args.chat_phase;

    // Derive lead_status from chat_phase
    const statusMap: Record<string, string> = {
      greeting: "new",
      collect_name: "new",
      salam_kenal: "new",
      collect_domisili: "new",
      listening: "qualified",
      summarize: "qualified",
      validate_pain_points: "qualified",
      discover_interest: "qualified",
      solution_match: "contacted",
      close_attempt: "contacted",
      handoff: "contacted",
      completed: "converted", // or "archived" based on outcome
    };

    if (args.chat_phase && statusMap[args.chat_phase]) {
      updates.lead_status = statusMap[args.chat_phase];
      updates.status_updated_at = now;
      updates.status_updated_by = "sarah-bot";
    }

    await ctx.db.patch(contact._id, updates);
    return { synced: true, contact_id: contact._id };
  },
});
```

### Lead Status Values (Extended)
```typescript
// Source: Recommended lead_status union type
type LeadStatus =
  | "new"        // Just arrived, no qualification
  | "qualified"  // Passed Phase 1-2, pain points identified
  | "contacted"  // In closing phase, demo/sales engaged
  | "converted"  // Became customer
  | "archived";  // Not interested, lost, or inactive

// Note: Existing schema uses "hot", "warm", "cold", "client", "lost"
// New schema can coexist - add migration path
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate leads table | Extend contacts | This phase | Single source of truth for all lead data |
| Manual sync polling | Webhook triggers | Already done | <1s latency vs 30-60s polling |
| Status in metadata | First-class fields | This phase | Queryable, indexable, type-safe |

**Deprecated/outdated:**
- `supabaseId` fields: Migration artifact, can be optional or removed in future
- `ariConversations` separate from Sarah: May consolidate in Phase 5

## Open Questions

Things that couldn't be fully resolved:

1. **Status history tracking depth**
   - What we know: ticketStatusHistory pattern exists, table-history component available
   - What's unclear: Is full audit trail needed or just last-changed-by?
   - Recommendation: Start with status_updated_at + status_updated_by fields, add full history table if needed

2. **Conflict resolution when Kapso and Convex diverge**
   - What we know: Kapso is source of truth per CONTEXT.md
   - What's unclear: What if Convex has newer human edits?
   - Recommendation: Keep source_field (e.g., "kapso", "human", "sarah-bot") to track origin; human edits override bot but Kapso phone/name always win

3. **Brain bot (Phase 5) status control**
   - What we know: Grok Manager Bot will determine status transitions
   - What's unclear: Exact API contract between Sarah and Brain
   - Recommendation: Design status updates to accept source parameter, Brain can override Sarah's status

## Sources

### Primary (HIGH confidence)
- convex/schema.ts - Existing schema patterns and field types
- convex/kapso.ts - Webhook processing, contact creation, message sync
- convex/sarah.ts - Sarah conversation state management
- convex/contacts.ts - Contact queries and mutations
- convex/http.ts - HTTP action patterns for webhooks
- business_21/03_bots/B-phase1-gathering.md - Phase 1 data fields
- business_21/03_bots/C-phase2-summarize-interest.md - Phase 2 data fields
- business_21/03_bots/D-phase3-sales-closing.md - Phase 3 scoring fields

### Secondary (MEDIUM confidence)
- [Convex Scheduled Functions](https://docs.convex.dev/scheduling/scheduled-functions) - Transaction guarantees
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions) - Webhook patterns
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) - Internal mutations, security
- [table-history component](https://github.com/get-convex/table-history) - Audit logging

### Tertiary (LOW confidence)
- WebSearch results for Kapso webhook format - should verify with actual webhook logs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing codebase already uses Convex 1.31.6
- Architecture: HIGH - patterns extracted from working production code
- Pitfalls: HIGH - based on actual issues visible in codebase comments
- Schema design: MEDIUM - Sarah fields extracted from docs, may need adjustment

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (stable patterns, Convex version unlikely to change)
