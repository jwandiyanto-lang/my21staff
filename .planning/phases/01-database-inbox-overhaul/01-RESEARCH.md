# Phase 1: Database Schema & Inbox Overhaul - Research

**Researched:** 2026-01-20
**Domain:** Supabase PostgreSQL schema design, Realtime subscriptions, caching patterns
**Confidence:** HIGH

## Summary

This phase requires database schema extensions for ARI functionality plus inbox improvements with real-time updates and Kapso metadata caching. The project already has a solid Supabase foundation with working RLS policies, realtime subscriptions, and TanStack Query integration.

Key findings:
1. **Schema design** follows existing conventions - UUID PKs, workspace isolation, TIMESTAMPTZ columns
2. **Realtime** is already working via `supabase_realtime` publication - just add new tables
3. **Caching** should use new columns on existing `contacts` table, not a separate cache table
4. **Phone normalization** is partially implemented - needs E.164 standardization
5. **Typing indicators** require Supabase Broadcast (not Presence) for ephemeral state from Kapso webhooks

**Primary recommendation:** Extend existing patterns, add GIN indexes for array queries, use Broadcast for typing indicators.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.x | Database client | Already integrated |
| @supabase/ssr | ^0.x | Server-side auth | Already integrated |
| @tanstack/react-query | ^5.x | Client caching | Already integrated |

### Supporting (Add for Phone Normalization)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| libphonenumber-js | ^1.12.x | E.164 phone normalization | Contact matching, webhook processing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| libphonenumber-js | google-libphonenumber | Heavier (800KB+ vs 150KB), same accuracy |
| libphonenumber-js | phone npm package | Smaller but less validation features |
| Separate cache table | Columns on contacts | Columns preferred - atomic updates, no joins |

**Installation:**
```bash
npm install libphonenumber-js
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/
├── migrations/
│   ├── 34_ari_tables.sql           # ARI config, destinations, conversations, messages
│   ├── 35_ari_payments.sql         # Payments, appointments
│   ├── 36_ari_ai_comparison.sql    # A/B testing table
│   ├── 37_contacts_cache_fields.sql # Add Kapso metadata columns to contacts
│   ├── 38_ari_indexes.sql          # GIN indexes for tags, performance indexes
│   └── 39_ari_realtime.sql         # Enable realtime for new tables
src/
├── lib/
│   ├── phone/
│   │   └── normalize.ts            # E.164 normalization utility
│   └── queries/
│       └── use-typing-indicator.ts # Supabase Broadcast subscription
```

### Pattern 1: Workspace-Scoped Tables with RLS
**What:** All ARI tables include `workspace_id` FK with RLS policies
**When to use:** Every new table in multi-tenant system
**Example:**
```sql
-- Source: Existing schema.sql pattern
CREATE TABLE ari_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- ... other fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ari_config ENABLE ROW LEVEL SECURITY;

-- Standard RLS policy pattern from existing codebase
CREATE POLICY "Users can view ari_config in their workspaces" ON ari_config
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
```

### Pattern 2: Optimized RLS with SELECT Wrapper
**What:** Wrap `auth.uid()` in SELECT for 100x better performance
**When to use:** All RLS policies
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
-- BAD: Called per-row
CREATE POLICY "bad_policy" ON table
  FOR SELECT USING (auth.uid() = user_id);

-- GOOD: Cached via initPlan
CREATE POLICY "good_policy" ON table
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- GOOD: For workspace-based policies
CREATE POLICY "workspace_access" ON ari_conversations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );
```

### Pattern 3: Realtime with TanStack Query Integration
**What:** Supabase realtime triggers query invalidation
**When to use:** Real-time updates for inbox
**Example:**
```typescript
// Source: Existing use-messages.ts pattern
useEffect(() => {
  if (!conversationId) return

  const supabase = createClient()
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        // Add to cache directly for instant UI
        queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
          if (!old) return [payload.new as Message]
          if (old.some((m) => m.id === (payload.new as Message).id)) return old
          return [...old, payload.new as Message]
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [conversationId, queryClient])
```

### Pattern 4: Broadcast for Typing Indicators
**What:** Ephemeral state via Supabase Broadcast (not database)
**When to use:** Typing indicators, cursor positions, transient state
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/realtime
// For typing indicators from Kapso webhook
const channel = supabase.channel(`typing:${workspaceId}`)

// Listen for typing events (in inbox component)
channel.on('broadcast', { event: 'typing' }, (payload) => {
  setTypingContacts(prev => {
    const updated = new Map(prev)
    if (payload.payload.isTyping) {
      updated.set(payload.payload.phone, Date.now())
    } else {
      updated.delete(payload.payload.phone)
    }
    return updated
  })
}).subscribe()

// Send typing event (from webhook handler)
await supabase.channel(`typing:${workspaceId}`).send({
  type: 'broadcast',
  event: 'typing',
  payload: { phone: contactPhone, isTyping: true }
})
```

### Pattern 5: Phone Number Normalization
**What:** Consistent E.164 format for matching
**When to use:** Contact creation, webhook processing, phone lookups
**Example:**
```typescript
// Source: https://www.npmjs.com/package/libphonenumber-js
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

export function normalizePhone(phone: string, defaultCountry: string = 'ID'): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // Handle Indonesian format: 0812 -> +62812
  if (cleaned.startsWith('0') && defaultCountry === 'ID') {
    return '+62' + cleaned.slice(1)
  }

  // Handle already E.164 format
  if (cleaned.startsWith('+')) {
    return cleaned
  }

  // Parse and format
  try {
    const parsed = parsePhoneNumber(cleaned, defaultCountry)
    if (parsed && isValidPhoneNumber(parsed.number)) {
      return parsed.format('E.164') // Returns +6281234567890
    }
  } catch {
    // Fall through to basic normalization
  }

  // Fallback: assume Indonesian if no country code
  return '+62' + cleaned.replace(/^62/, '')
}
```

### Anti-Patterns to Avoid
- **Separate cache table:** Don't create a `kapso_cache` table - use columns on `contacts` for atomic updates
- **Polling for updates:** Don't poll for new messages - use realtime subscriptions
- **RLS without indexes:** Don't use `workspace_id` in RLS without index on that column
- **Storing denormalized phone formats:** Don't store `0812xxx` - always normalize to E.164

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone normalization | Regex-based stripping | libphonenumber-js | Edge cases (country codes, validation, formatting) |
| Real-time updates | WebSocket wrapper | Supabase Realtime | Already integrated, handles reconnection |
| Filter state | Custom useState | URL search params or workspace settings | Persistence, shareability |
| Typing indicators | Database polling | Supabase Broadcast | Ephemeral, no storage needed |
| Workspace isolation | Manual where clauses | Supabase RLS | Centralized, cannot bypass |

**Key insight:** Supabase already handles realtime, auth, and RLS. Don't rebuild infrastructure - extend existing patterns.

## Common Pitfalls

### Pitfall 1: RLS Performance on Large Tables
**What goes wrong:** Slow queries when RLS policies check against large tables
**Why it happens:** RLS policies run per-row without optimization
**How to avoid:**
- Add indexes on `workspace_id` columns
- Use `(SELECT auth.uid())` wrapper pattern
- Add explicit filters even when RLS handles it
**Warning signs:** Queries taking >100ms, EXPLAIN showing Seq Scan

### Pitfall 2: Realtime Message Duplication
**What goes wrong:** Same message appears twice in UI
**Why it happens:** Both optimistic update AND realtime event fire
**How to avoid:**
- Check for existing ID before adding to cache
- Use idempotent cache updates (existing pattern in use-messages.ts)
**Warning signs:** Duplicate messages after send

### Pitfall 3: Phone Number Matching Failures
**What goes wrong:** Same phone stored as `0812xxx` and `+6281xxx`, no match
**Why it happens:** Webhook and form submit use different formats
**How to avoid:**
- Normalize ALL phone inputs on entry
- Create unique index on normalized phone
- Normalize in webhook handler BEFORE lookup
**Warning signs:** Duplicate contacts for same person

### Pitfall 4: GIN Index Write Overhead
**What goes wrong:** Slow inserts/updates on tables with GIN indexes
**Why it happens:** GIN indexes expensive to maintain
**How to avoid:**
- Only add GIN indexes on columns actually filtered by `@>` or `&&`
- Consider partial indexes for hot paths
**Warning signs:** Insert latency >50ms

### Pitfall 5: Typing Indicator Timeout
**What goes wrong:** "Contact is typing..." stays forever
**Why it happens:** Leave event not received (network issue)
**How to avoid:**
- Implement client-side timeout (5 seconds)
- Clear typing state when message received
- Store timestamp, not just boolean
**Warning signs:** Stale typing indicators

### Pitfall 6: Filter Preset JSONB Bloat
**What goes wrong:** Saved filter presets grow unbounded
**Why it happens:** Users save many presets, never clean up
**How to avoid:**
- Limit presets per user (e.g., 10 max)
- Store in user preferences, not separate table
- Simple JSONB structure
**Warning signs:** Settings column >1KB

## Code Examples

Verified patterns from official sources and existing codebase:

### GIN Index for Tags Array
```sql
-- Source: https://www.tigerdata.com/learn/optimizing-array-queries-with-gin-indexes-in-postgresql
-- Enable GIN index for tag filtering
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);

-- Query pattern for filtering
SELECT * FROM contacts
WHERE workspace_id = $1
  AND tags @> ARRAY['Australia']::text[];
```

### Caching Kapso Metadata on Contacts
```sql
-- Source: Schema design for phase requirements
-- Add cached fields to existing contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kapso_name VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kapso_profile_pic TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kapso_last_seen TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kapso_is_online BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS cache_updated_at TIMESTAMPTZ;

-- Index for online status filtering
CREATE INDEX idx_contacts_kapso_online ON contacts(workspace_id, kapso_is_online)
  WHERE kapso_is_online = true;
```

### Saved Filter Presets in Workspace Settings
```typescript
// Store in workspace_members or user preferences
interface FilterPreset {
  id: string
  name: string
  filters: {
    showUnreadOnly: boolean
    statusFilter: string[]
    tagFilter: string[]
    assignedFilter: string
  }
}

// Save preset
const { error } = await supabase
  .from('workspace_members')
  .update({
    settings: {
      ...existingSettings,
      filterPresets: [...presets, newPreset].slice(-10) // Max 10
    }
  })
  .eq('id', memberId)
```

### Active/All Conversation Filter
```sql
-- Active = has unread messages
SELECT c.*, contacts.*
FROM conversations c
JOIN contacts ON c.contact_id = contacts.id
WHERE c.workspace_id = $1
  AND c.unread_count > 0  -- Active filter
ORDER BY c.last_message_at DESC
LIMIT 50;

-- All conversations (no unread filter)
SELECT c.*, contacts.*
FROM conversations c
JOIN contacts ON c.contact_id = contacts.id
WHERE c.workspace_id = $1
ORDER BY c.last_message_at DESC
LIMIT 50;
```

### ARI Tables Schema Pattern
```sql
-- ari_conversations: Track ARI's conversation state
CREATE TABLE ari_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- State
  state VARCHAR(50) DEFAULT 'greeting', -- greeting, qualifying, scoring, booking, handoff
  lead_score INTEGER DEFAULT 0,
  lead_temperature VARCHAR(20), -- hot, warm, cold

  -- Context
  context JSONB DEFAULT '{}', -- Collected info during conversation
  last_ai_message_at TIMESTAMPTZ,
  handoff_at TIMESTAMPTZ,
  handoff_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, contact_id)
);

-- Index for active conversations lookup
CREATE INDEX idx_ari_conversations_workspace_state
  ON ari_conversations(workspace_id, state);
CREATE INDEX idx_ari_conversations_contact
  ON ari_conversations(contact_id);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling for updates | Supabase Realtime postgres_changes | Already using | Real-time without polling |
| Manual phone cleaning | libphonenumber-js | Standard practice | Proper E.164 validation |
| Separate cache tables | Columns with cache_updated_at | Best practice | Atomic updates, fewer joins |
| RLS without wrapping | `(SELECT auth.uid())` pattern | 2024 Supabase docs | 100x performance improvement |

**Deprecated/outdated:**
- `supabase-js` v1 realtime API (use v2 channel-based API)
- Manual websocket management (use built-in reconnection)

## Open Questions

Things that couldn't be fully resolved:

1. **Kapso Typing Indicator Webhook**
   - What we know: WhatsApp Cloud API supports typing indicators, Kapso proxies Meta API
   - What's unclear: Does Kapso forward typing indicator webhooks?
   - Recommendation: Test with Kapso, fallback to Broadcast from message timing

2. **Kapso Profile Data**
   - What we know: Webhook includes `contacts[].profile.name`
   - What's unclear: Does Kapso provide profile picture URL and online status?
   - Recommendation: Check Kapso webhook payload, may need separate API call

3. **Filter Preset Storage Location**
   - What we know: Can store in workspace_members.settings or separate table
   - What's unclear: Optimal location for filter presets
   - Recommendation: Use workspace_members settings JSONB (simpler, no new table)

## Sources

### Primary (HIGH confidence)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) - Subscription patterns, filters
- [Supabase RLS Performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - SELECT wrapper, indexing
- [Supabase Presence](https://supabase.com/docs/guides/realtime/presence) - Typing indicator pattern
- [PostgreSQL GIN Indexes](https://www.postgresql.org/docs/current/gin.html) - Array indexing for tags
- [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) - Phone normalization

### Secondary (MEDIUM confidence)
- [TanStack Query with Supabase](https://makerkit.dev/blog/saas/supabase-react-query) - Cache invalidation patterns
- [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices) - General architecture

### Codebase (HIGH confidence - existing patterns)
- `/home/jfransisco/Desktop/21/my21staff/supabase/schema.sql` - Table conventions, RLS patterns
- `/home/jfransisco/Desktop/21/my21staff/src/lib/queries/use-messages.ts` - Realtime + TanStack Query integration
- `/home/jfransisco/Desktop/21/my21staff/src/app/api/webhook/kapso/route.ts` - Webhook processing patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing libraries, minimal additions
- Architecture: HIGH - Extending proven patterns from codebase
- Pitfalls: HIGH - Based on official docs and existing implementation
- Phone normalization: MEDIUM - Library verified, exact integration TBD
- Typing indicators: MEDIUM - Kapso webhook capability unverified

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable domain, existing patterns)
