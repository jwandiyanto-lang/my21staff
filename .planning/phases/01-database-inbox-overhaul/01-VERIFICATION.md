---
phase: 01-database-inbox-overhaul
verified: 2026-01-20T13:00:00Z
status: passed
score: 5/5 must-haves verified
must_haves:
  truths:
    - "ARI tables created with RLS policies"
    - "Kapso metadata cached on contacts table"
    - "Inbox loads instantly with cached contact data"
    - "Real-time message updates via Supabase subscriptions"
    - "Active/All and tag filters working"
  artifacts:
    - path: "supabase/migrations/34_ari_tables.sql"
      provides: "7 ARI tables with RLS policies and indexes"
      status: verified
    - path: "supabase/migrations/35_contacts_cache_fields.sql"
      provides: "Kapso cache columns and phone_normalized"
      status: verified
    - path: "supabase/migrations/36_ari_realtime.sql"
      provides: "Realtime publication for ARI tables"
      status: verified
    - path: "src/lib/phone/normalize.ts"
      provides: "E.164 phone normalization utility"
      status: verified
    - path: "src/app/api/webhook/kapso/route.ts"
      provides: "Webhook caching Kapso metadata on contacts"
      status: verified
    - path: "src/app/api/conversations/route.ts"
      provides: "Server-side filtering API with active/status/tags params"
      status: verified
    - path: "src/lib/queries/use-conversations.ts"
      provides: "TanStack Query hook with filters and real-time invalidation"
      status: verified
    - path: "src/lib/queries/use-typing-indicator.ts"
      provides: "Supabase Broadcast typing indicators"
      status: verified
    - path: "src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx"
      provides: "Active/All toggle UI with filter presets"
      status: verified
  key_links:
    - from: "ari_conversations"
      to: "contacts"
      via: "contact_id FK"
      status: verified
    - from: "webhook/kapso"
      to: "contacts.kapso_name"
      via: "UPDATE on message receipt"
      status: verified
    - from: "inbox-client"
      to: "api/conversations"
      via: "useConversations hook with filters"
      status: verified
    - from: "use-conversations"
      to: "Supabase realtime"
      via: "postgres_changes subscription"
      status: verified
---

# Phase 1: Database Schema & Inbox Overhaul Verification Report

**Phase Goal:** Foundation for ARI + improved inbox experience
**Verified:** 2026-01-20T13:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ARI tables created with RLS policies | VERIFIED | 7 tables in 34_ari_tables.sql (434 lines), RLS enabled on all 7, 21 policies created |
| 2 | Kapso metadata cached on contacts table | VERIFIED | 35_contacts_cache_fields.sql adds kapso_name, kapso_profile_pic, kapso_is_online, kapso_last_seen, phone_normalized columns |
| 3 | Inbox loads instantly with cached contact data | VERIFIED | useConversations uses TanStack Query with staleTime caching; API returns data directly from DB without Kapso API calls |
| 4 | Real-time message updates via Supabase subscriptions | VERIFIED | use-messages.ts has postgres_changes subscription; use-conversations.ts invalidates on changes; 36_ari_realtime.sql adds ARI tables to publication |
| 5 | Active/All and tag filters working | VERIFIED | conversations API accepts active/status/tags/assigned params; inbox-client.tsx has Active/All toggle with badge count |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/34_ari_tables.sql` | ARI database tables with RLS | VERIFIED | 434 lines, 7 tables (ari_config, ari_destinations, ari_conversations, ari_messages, ari_payments, ari_appointments, ari_ai_comparison), RLS enabled, 21 policies, 20 indexes |
| `supabase/migrations/35_contacts_cache_fields.sql` | Kapso cache columns | VERIFIED | 42 lines, adds kapso_name, kapso_profile_pic, kapso_is_online, kapso_last_seen, cache_updated_at, phone_normalized with indexes and backfill |
| `supabase/migrations/36_ari_realtime.sql` | Realtime publication | VERIFIED | 21 lines, adds all 7 ARI tables to supabase_realtime publication |
| `src/lib/phone/normalize.ts` | E.164 normalization | VERIFIED | 93 lines, uses libphonenumber-js (in package.json), handles 0xxx/62xxx/+62 Indonesian formats |
| `src/app/api/webhook/kapso/route.ts` | Kapso caching webhook | VERIFIED | 495 lines, updates kapso_name, cache_updated_at on contacts, uses phone_normalized for matching |
| `src/app/api/conversations/route.ts` | Filtered conversations API | VERIFIED | 113 lines, accepts active/status/tags/assigned params, returns activeCount for badge |
| `src/lib/queries/use-conversations.ts` | TanStack Query hook | VERIFIED | 119 lines, builds URL with filters, includes filters in query key, has realtime invalidation |
| `src/lib/queries/use-typing-indicator.ts` | Typing indicator hook | VERIFIED | 127 lines, Supabase Broadcast subscription, 5-second auto-clear, isContactTyping helper |
| `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` | Inbox UI with filters | VERIFIED | 860 lines, Active/All toggle, status/tag filter dropdowns, filter presets, typing indicators |
| `src/app/(dashboard)/[workspace]/inbox/conversation-list.tsx` | Conversation list with typing | VERIFIED | 168 lines, typingContacts prop, animated typing indicator display |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| ari_conversations | contacts | contact_id FK | VERIFIED | Line 45 in 34_ari_tables.sql: `contact_id UUID NOT NULL REFERENCES contacts(id)` |
| ari_messages | ari_conversations | ari_conversation_id FK | VERIFIED | Line 70: `ari_conversation_id UUID NOT NULL REFERENCES ari_conversations(id)` |
| webhook/kapso | contacts.kapso_name | UPDATE on receipt | VERIFIED | Lines 385-397: updates kapso_name and cache_updated_at when profile data changes |
| inbox-client | api/conversations | useConversations | VERIFIED | Line 89: `useConversations(workspace.id, page, filters)` with filter object |
| api/conversations | contacts.lead_status | .in() query | VERIFIED | Line 47: `query = query.in('contact.lead_status', statusFilters)` |
| api/conversations | contacts.tags | .overlaps() query | VERIFIED | Line 52: `query = query.overlaps('contact.tags', tagFilters)` |
| use-conversations | Supabase realtime | invalidateQueries | VERIFIED | Lines 92-116: postgres_changes subscription invalidates queries |
| use-messages | Supabase realtime | postgres_changes | VERIFIED | Lines 42-61: INSERT event updates message cache |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| DB-01: ari_config table | SATISFIED | - |
| DB-02: ari_destinations table | SATISFIED | - |
| DB-03: ari_conversations table | SATISFIED | - |
| DB-04: ari_messages table | SATISFIED | - |
| DB-05: ari_payments table | SATISFIED | - |
| DB-06: ari_appointments table | SATISFIED | - |
| DB-07: ari_ai_comparison table | SATISFIED | - |
| DB-08: Kapso cache fields on contacts | SATISFIED | - |
| DB-09: RLS policies for ARI tables | SATISFIED | - |
| INBOX-01: Kapso metadata caching | SATISFIED | - |
| INBOX-02: Cache refresh via webhook | SATISFIED | - |
| INBOX-03: Real-time message updates | SATISFIED | - |
| INBOX-04: Active/All toggle | SATISFIED | - |
| INBOX-05: Filter by tags | SATISFIED | - |
| INBOX-06: Filter by lead status | SATISFIED | - |
| INBOX-07: Improved Kapso sync | SATISFIED | Idempotent handlers prevent duplicates |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| - | - | - | - | No blockers or warnings found |

**No stub patterns, placeholder content, or empty implementations detected in key files.**

### Human Verification Required

#### 1. Inbox Load Performance
**Test:** Open inbox page after cache warm-up
**Expected:** Conversations render in <200ms without Kapso API calls
**Why human:** Network timing and perceived performance need real browser testing

#### 2. Real-time Message Updates
**Test:** Send a WhatsApp message to test contact while inbox is open
**Expected:** Message appears in thread without page refresh
**Why human:** Requires live Kapso webhook and Supabase subscription

#### 3. Active/All Filter Toggle
**Test:** Click Active/All toggle and observe conversation list
**Expected:** Active shows only unread, All shows everything, badge shows correct count
**Why human:** Visual confirmation of filter behavior

#### 4. Typing Indicator Display
**Test:** Have contact start typing while viewing conversation
**Expected:** Animated dots appear in both conversation list and message header
**Why human:** Requires live Kapso typing event and visual timing

### Gaps Summary

No gaps found. All Phase 1 success criteria have been implemented:

1. **ARI tables created with RLS policies** - 7 tables with full RLS coverage (21 policies)
2. **Kapso metadata cached on contacts table** - 5 new columns with indexes and webhook integration
3. **Inbox loads instantly with cached contact data** - TanStack Query caching, no external API calls
4. **Real-time message updates via Supabase subscriptions** - postgres_changes on messages and conversations
5. **Active/All and tag filters working** - Server-side filtering with client-side toggle UI

**Database migrations must be applied** to Supabase for the schema changes to take effect. The code is ready and verified.

---

*Verified: 2026-01-20T13:00:00Z*
*Verifier: Claude (gsd-verifier)*
