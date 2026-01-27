# Feature Landscape: Kapso Inbox Integration

**Milestone:** v3.4 — Kapso Inbox UI Replacement
**Domain:** WhatsApp CRM with AI bot management
**Researched:** 2026-01-27
**Confidence:** HIGH (official Kapso docs verified, current codebase analyzed)

---

## Executive Summary

my21staff currently uses a custom-built inbox UI with basic WhatsApp conversation management. Kapso's `whatsapp-cloud-inbox` provides a production-ready, open-source Next.js inbox built specifically for the WhatsApp Cloud API. The replacement will enhance status filtering (temperature-based: hot/warm/cold), maintain real-time updates via Convex, and fix Your Intern page crashes that block admin configuration.

**Key Impact:**
- **UI modernization:** WhatsApp Web-style component library (template messages, interactive buttons, media handling)
- **Status filtering:** Upgrade from basic open/closed to Kapso's hot/warm/cold temperature system
- **Data integration:** Map Kapso components to existing Convex schemas (conversations, messages, contacts)
- **Admin fix:** Your Intern (knowledge-base) page debugging to unblock team configuration

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|-----------|-------|
| **Conversation List** | Core inbox—see all chats | Low | Kapso provides ready-made component |
| **Message Thread** | View full conversation history | Low | Kapso handles auto-polling + timestamp formatting |
| **Read/Unread Status** | Know which leads responded | Low | Convex tracks unread_count, Kapso UI shows badge |
| **Contact Profile** | See lead info while chatting | Med | Current: InfoSidebar. Kapso: extensible contact display |
| **Send Messages** | Reply to WhatsApp | Med | Current: via Kapso API. Kapso UI: composition + media |
| **Real-Time Updates** | See new messages instantly | High | Convex subscriptions required; Kapso uses polling |
| **Search** | Find conversation by name/phone | Low | Current: client-side filter. Kapso: supports search |
| **Status Badges** | Show lead temperature (hot/warm/cold) | Med | Current: hardcoded colors. Kapso: configurable |
| **Team Assignments** | Assign conversation to member | Low | Current: assigned_to field. Kapso UI supports dropdown |
| **Filter Bar** | Active/All, Status, Tags | Med | Current: v2.0 filter bar. Kapso: extends this |
| **Offline Mode (Dev)** | Local testing without Convex | Low | Current: mock data. Kapso: integrates with dev mode |

---

## Differentiators

Features that set the product apart. Not expected by users, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|-----------|-------|
| **Template Messages** | Pre-made responses with headers/buttons | Med | Kapso Cloud API feature. Current inbox: no templates |
| **Interactive Buttons** | Up to 3 action buttons per message | Med | Kapso Cloud API. Enables quick replies (Consultation? Yes/No) |
| **Media Handling** | Image, video, audio, document support | High | Kapso inbox renders media. Current: partial (shows URL) |
| **Your Intern Integration** | AI bot persona + scoring config | High | CURRENT BLOCKER: page crashes in production. Need to debug |
| **Lead Scoring UI** | Visual lead score breakdown (0-100) | Med | Current: Your Intern > Scoring tab. Needs fix |
| **Hot/Warm/Cold Routing** | Auto-assign based on temperature | High | Current: basic hot/warm/cold. Kapso inbox shows clearly |
| **24-Hour Window Enforcement** | WhatsApp rule: only reply within 24h | Med | Kapso Cloud API enforces. Current: not visible |
| **Conversation Inactivity Detection** | Auto-close old chats | Low | Kapso webhook: conversation_inactive event |
| **Message Delivery Status** | Know if message sent/read | Low | Kapso handles. Current: basic status indicator |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Custom WhatsApp Component Library** | Reinventing wheels; WhatsApp API changes frequently | Use Kapso's pre-built, maintained inbox |
| **Full Message Storage Search** | Expensive, requires indexing. Overkill for SME use case | Implement conversation list search (names, phone) |
| **Voice Transcription** | Complex, error-prone. Not in scope. | Link to audio files; users transcribe manually if needed |
| **WhatsApp Template Approvals** | Meta approval process is 48h+. Blocking feature. | Start with text/interactive buttons; defer templates to v3.5+ |
| **Multi-User Chat Assignment** | Complicates routing, ownership unclear. Not needed yet. | Single user per workspace (current: works fine) |
| **Message Quoting/Threading** | WhatsApp Cloud API doesn't support. Confuses UX. | Show reply context in metadata, not nested threads |
| **Emoji Reactions** | WhatsApp Cloud API doesn't support natively. | Use reaction buttons in interactive messages instead |
| **Typing Indicators** | Adds latency; confuses async workflows. | Show "Bot typing..." message instead |

---

## Feature Dependencies

```
Core Inbox Experience
├── Conversation List
│   ├── Real-Time Updates (Convex subscription)
│   └── Search/Filter (client-side or server)
│
├── Message Thread
│   ├── Convex message loading (listByConversationAsc)
│   ├── ComposeInput (Kapso API integration)
│   ├── Message rendering (Kapso components)
│   └── Media handling (Kapso Cloud API)
│
├── Status & Lead Temperature
│   ├── Contact lead_status (Convex contacts table)
│   ├── Lead score (0-100, Convex contacts.lead_score)
│   ├── Temperature calculation (hot/warm/cold from score)
│   └── Status filter UI
│
└── Admin Configuration (Your Intern)
    ├── Persona Tab (ariConfig.bot_name, greeting_style, tone)
    ├── Flow Tab (ariFlowStages, conversation scripts)
    ├── Database Tab (ariKnowledgeCategories, ariKnowledgeEntries)
    ├── Scoring Tab (ariScoringConfig: thresholds)
    └── Slots Tab (consultantSlots: availability)
```

**Critical Dependency:** Your Intern page must be fixed before replacing inbox. Admins need to configure ARI before bot can respond.

---

## Feature Complexity Matrix

| Feature | Build Time | Maintenance | Risk |
|---------|----------|------------|------|
| Inbox List + Thread | 8h (Kapso + integration) | Low | Low |
| Real-Time Updates | 4h (Convex subscriptions) | Low | Med |
| Send Messages | 4h (Kapso API + ComposeInput) | Low | Med |
| Status Filtering | 6h (temp calculation + UI) | Med | Low |
| Contact Sidebar | 4h (InfoSidebar enhancement) | Low | Low |
| Template Messages | 12h (Kapso Cloud API setup) | High | High |
| Interactive Buttons | 8h (Kapso button rendering) | Med | Med |
| Your Intern Debug | 4h (identify crash, fix) | Med | Med |
| Lead Score UI | 6h (scoring-tab component) | Low | Low |

---

## MVP Feature Set

For initial Kapso inbox replacement.

**Must Have (MVP):**
1. ✓ Conversation list with real-time updates
2. ✓ Message thread with Kapso message rendering
3. ✓ Search/filter by name, phone, status
4. ✓ Send text messages via Kapso API
5. ✓ Hot/warm/cold status badges from Convex lead_score
6. ✓ Contact profile sidebar (name, score, tags)
7. ✓ Your Intern page loads without errors

**Nice to Have (Post-MVP):**
- Template message support (requires Kapso Cloud setup)
- Interactive button messages
- Media upload/preview enhancements
- 24-hour window warning (UI indicator)

**Defer (Future):**
- Voice transcription
- WhatsApp template approvals
- Full message search indexing

---

## Integration Points with Convex

Kapso inbox components connect to existing Convex schemas:

| Kapso Component | Convex Table | Field Mapping | Status |
|-----------------|--------------|---------------|--------|
| Conversation List | conversations | workspace_id, contact_id, status, unread_count | ✓ Live |
| Message Thread | messages | conversation_id, direction, sender_type, content | ✓ Live |
| Contact Profile | contacts | name, phone, email, lead_status, lead_score, tags | ✓ Live |
| Status Filter | contacts | lead_status, lead_score | ✓ Live |
| Real-Time Updates | All above | Convex subscriptions | ✓ Live |
| ComposeInput | messages (insert) | message_type, content, media_url, created_at | ✓ Live |
| Message Status | messages | metadata (delivery status) | ⚠️ Partial |

**Gap:** Message delivery status (read receipts) currently minimal. Kapso Cloud API provides this via webhook—integration exists but not fully tested.

---

## Your Intern Page: Crash Analysis

**Current State:** Knowledge-base page (5 tabs: Persona, Flow, Database, Scoring, Slots)

**Symptom:** Page crashes in production (localhost:3000/demo works fine)

**Likely Root Causes:**
1. **SSR/Hydration Mismatch** — Component renders differently on server vs client
   - Persona tab: fetches ariConfig async in useEffect (could have stale hydration)
   - Fix: Move data fetch to server component or add Suspense boundary

2. **Clerk Auth Hook Issue** — useAuth() hook not available on server
   - Current: knowledge-base-client.tsx is 'use client', but page.tsx might have auth check on server
   - Fix: Ensure all auth checks happen in client component

3. **Convex Query Type Mismatch** — useQuery returns loading state during hydration
   - Scoring tab: fetches ariScoringConfig with useQuery
   - Fix: Add isLoading guard or defer to client render

4. **Memory Leak in Dependencies** — scoring-tab component re-fetches on every render
   - Scoring tab uses useQuery without proper dependency array
   - Fix: Verify useQuery dependencies

**Prevention for Replacement:**
- Test Kapso inbox at localhost:3000/demo (mock data)
- Test at localhost:3000/eagle-overseas (real Convex)
- Test Your Intern fix in same demo/production split
- Ensure all server components are explicitly 'use client' or data is fetched server-side

---

## Kapso Inbox Technical Integration

### Architecture Pattern: Inbox + Convex Bridge

```
User Action (click message)
  ↓
Kapso Inbox Component
  ↓
Convex Hook (useQuery / useMutation)
  ↓
Convex Function (query / mutation)
  ↓
Database (conversations, messages, contacts)
  ↓
Real-Time Subscription
  ↓
Re-render Kapso component
```

### Data Refresh Strategy

| Event | Trigger | Refresh Method |
|-------|---------|-----------------|
| Open conversation | User clicks item | useQuery listByConversationAsc |
| New message arrives | Webhook → Convex | Convex subscription + Kapso polling |
| Status change | User updates lead_status | useMutation updateContact |
| Filter change | User selects status/tag | Re-fetch with filter params |

**Current:** Convex real-time subscriptions are live. Kapso uses auto-polling (checks Kapso API every N seconds). Hybrid approach is fine for SME scale.

### Component Boundaries

| Component | Kapso Provided | Custom Required | Notes |
|-----------|----------------|-----------------|-------|
| Conversation List | ✓ (UI + rendering) | Convex query hook | Query listWithFilters returns array |
| Message Bubble | ✓ (layout + styling) | Convex message data | Adapt message type to Kapso format |
| Compose Input | ✓ (UI + media button) | Kapso API send + Convex mutation | Insert message + call Kapso |
| Contact Sidebar | ✓ (template) | InfoSidebar component exists | Merge or adapt design |
| Filter Bar | ✓ (partial) | Status/tag filter logic | Custom state + Convex params |

---

## Pitfalls by Phase

### Phase Structure Implications

**Phase 1: Inbox UI Replacement** (est. 16-20h)
- Replace custom inbox with Kapso components
- Map Convex queries to Kapso props
- Test real-time updates (HIGH RISK)
- **Pitfall:** Kapso uses auto-polling; Convex uses subscriptions. Verify no duplicate refreshes.
- **Pitfall:** Message timestamps may differ (Kapso local vs Convex UTC). Ensure consistent formatting.

**Phase 2: Status Filtering Enhancements** (est. 6-8h)
- Implement hot/warm/cold temperature display
- Add temperature calculation based on lead_score
- Update filter bar with new status options
- **Pitfall:** Lead temperature thresholds (hot=70, warm=40) are configurable. Verify Settings integration before assuming defaults.
- **Pitfall:** Existing conversations have old status values. Need migration or mapping layer.

**Phase 3: Your Intern Page Debugging** (est. 4-6h)
- Identify SSR/hydration crash root cause
- Fix Clerk hooks, Convex queries, or server/client boundaries
- Re-test all 5 tabs in production
- **Pitfall:** Production error differs from dev (mock data). Capture actual error with Sentry or console logging.
- **Pitfall:** Fix may require moving component logic between server/client. Test with `npm run build` locally first.

**Phase 4: Real-Time Sync Verification** (est. 4h)
- Verify Convex subscriptions work with Kapso polling
- Test webhook message delivery
- Test manual refresh
- **Pitfall:** Kapso polling + Convex subscriptions may cause double re-renders. Monitor performance.

---

## Success Criteria by Feature Category

### Inbox Replacement
- [ ] Conversation list displays all workspace conversations
- [ ] Message thread loads and auto-scrolls to latest
- [ ] Search bar filters conversations by name/phone
- [ ] Real-time updates (new messages appear without refresh)
- [ ] Compose input sends message via Kapso API
- [ ] Dev mode (localhost:3000/demo) works offline with mock data

### Status Filtering
- [ ] Temperature calc: score >= 70 = hot, >= 40 = warm, else cold
- [ ] Filter UI shows hot/warm/cold/new/client/lost options
- [ ] Filtering works with Convex server-side params
- [ ] Status badges display correct color for each temperature

### Your Intern Page
- [ ] Page loads in production without errors
- [ ] Persona tab fetches and displays ariConfig
- [ ] Flow tab renders ariFlowStages list
- [ ] Database tab shows knowledge entries
- [ ] Scoring tab displays ariScoringConfig (thresholds)
- [ ] Slots tab shows consultant availability
- [ ] All tabs functional in dev mode + production

---

## Data Flow: Current → Future

### Current Inbox (v3.2)

```
1. User opens /inbox
2. InboxClient queries conversations.listWithFilters
3. ConversationList renders with filters (Active/All, Status, Tags)
4. User clicks conversation
5. MessageThread queries messages.listByConversationAsc
6. ComposeInput sends via Kapso API + inserts message to Convex
7. Real-time subscription updates all components
```

### Future Inbox (v3.4 with Kapso)

```
1. User opens /inbox
2. KapsoInboxClient queries conversations.listWithFilters (same)
3. Kapso ConversationList component renders (replaces custom)
4. User clicks conversation
5. Kapso MessageThread queries messages (via custom adapter)
6. Kapso ComposeInput sends via Kapso API + Convex mutation
7. Convex subscription + Kapso polling updates (hybrid)
```

**Change:** UI components swap from custom to Kapso. Data flow stays the same (Convex).

---

## Known Blockers & Workarounds

### Blocker 1: Your Intern Page Crashes in Production

**Impact:** Admins can't configure ARI settings (bot persona, scoring rules).

**Workaround:** Configure via Convex dashboard manually (temporary).

**Resolution:** Phase 3 debugging (4-6h).

**Timeline:** Must fix before v3.4 ships. Without it, clients can't customize AI bot.

### Blocker 2: ARI Workspace Linkage Issue (v3.3 Carryover)

**Impact:** Bot doesn't respond to WhatsApp messages.

**Current Status:** Documented in v3.3 audit. Requires manual Convex fix (15 min).

**Resolution:** Fix before v3.4 starts OR as part of v3.4 if still not resolved.

**Implication:** Don't bother testing Inbox + AI bot integration until this is fixed.

### Blocker 3: Message Delivery Status Not Complete

**Impact:** Users see "sent" but not "read" status reliably.

**Current:** Kapso Cloud API sends delivery_update webhook. Convex receives but doesn't store consistently.

**Workaround:** Show "sent" only; defer "read" to future version.

**Timeline:** Low priority. Inbox replacement can proceed without this.

---

## Recommendations

### For Roadmap Structure

1. **Phase 1: Inbox UI Replacement** (tight dependency)
   - High complexity (16-20h)
   - Unblock real-time testing
   - Don't start until ARI workspace linkage is fixed (v3.3 carryover)

2. **Phase 2: Status Filtering** (dependent on Phase 1)
   - Medium complexity (6-8h)
   - Quick win once Phase 1 complete
   - Improves UX significantly

3. **Phase 3: Your Intern Debugging** (parallel possible)
   - Can start immediately (not blocked by Phase 1)
   - Medium complexity (4-6h)
   - CRITICAL for client onboarding
   - **Recommend:** Run in parallel with Phase 1 if possible

4. **Phase 4: Real-Time Verification** (dependent on Phase 1)
   - Low complexity (4h)
   - Final integration test
   - Ensures Convex + Kapso polling don't conflict

### For Your Intern Page Fix

**Investigation Steps:**
1. Capture production error with Sentry or browser console
2. Compare hydration state between dev (mock) and production (Convex)
3. Check if useQuery is being called on server vs client
4. Verify Clerk auth hooks are only in 'use client' components
5. Test with `npm run build && npm run start` locally

**Common Fixes:**
- Add `'use client'` to page that fetches data
- Wrap async data in Suspense boundary
- Move useQuery into client component if currently on server
- Verify Convex schema matches expected return types

---

## Sources

| Source | Authority | Accessed |
|--------|-----------|----------|
| [Kapso whatsapp-cloud-inbox GitHub](https://github.com/gokapso/whatsapp-cloud-inbox) | Official | 2026-01-27 |
| [Kapso Documentation - Flows](https://docs.kapso.ai/docs/whatsapp/flows/kapso-integration) | Official | 2026-01-27 |
| [my21staff PROJECT.md](file:///home/jfransisco/Desktop/21/my21staff/planning/PROJECT.md) | Internal | 2026-01-27 |
| [my21staff ROADMAP.md](file:///home/jfransisco/Desktop/21/my21staff/planning/ROADMAP.md) | Internal | 2026-01-27 |
| [my21staff Convex Schema](file:///home/jfransisco/Desktop/21/my21staff/convex/schema.ts) | Internal | 2026-01-27 |
| [v3.3 Milestone Audit](file:///home/jfransisco/Desktop/21/my21staff/planning/v3.3-MILESTONE-AUDIT.md) | Internal | 2026-01-27 |

---

*Research complete. Ready for roadmap phase structure.*
