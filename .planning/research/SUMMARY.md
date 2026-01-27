# Research Summary: Kapso Inbox Integration & Your Intern Fix

**Milestone:** v3.4 — Replace Inbox UI + Fix Admin Configuration
**Domain:** WhatsApp CRM inbox modernization + AI bot configuration
**Researched:** 2026-01-27
**Overall Confidence:** HIGH

---

## Executive Summary

my21staff currently manages WhatsApp conversations with a custom-built inbox UI. Kapso's open-source `whatsapp-cloud-inbox` provides a production-ready Next.js component library specifically designed for WhatsApp Cloud API—offering template messages, interactive buttons, media handling, and WhatsApp Web-style UX. The v3.4 milestone will replace the inbox UI with Kapso components while maintaining real-time data integration via Convex.

Additionally, the "Your Intern" page (knowledge-base admin panel) crashes in production, blocking team configuration of the AI bot's persona, scoring rules, and conversation flow. This must be fixed in parallel as teams cannot configure the bot without it.

**Key Insight:** The inbox replacement is primarily UI modernization. The data layer (Convex conversations, messages, contacts tables) stays intact. This is a low-risk architectural swap if the status filtering logic is properly integrated.

---

## Key Findings

### Stack
Kapso inbox is built with Next.js 15 + TypeScript + modern React patterns. No new dependencies required beyond what's already in my21staff. The inbox integrates with Convex through custom query adapters—no breaking changes to existing schema.

### Architecture
Kapso provides UI components (ConversationList, MessageThread, ComposeInput) as a reference implementation. my21staff wraps these with Convex queries and real-time subscriptions. Data flow remains: Convex → Kapso UI → User Action → Convex mutation/Kapso API.

### Critical Pitfall
**Your Intern page crashes in production.** Root cause unclear but likely SSR/hydration mismatch or Clerk auth hook issue in knowledge-base page. This blocks client onboarding—admins cannot configure ARI settings without it. Must be fixed before or during v3.4.

### Blocker Carryover
v3.3 left an unresolved ARI workspace linkage issue (workspace ID mismatch in ariConfig). This prevents the bot from responding to WhatsApp messages. While not directly part of v3.4, it should be verified/fixed first to enable full testing.

---

## Implications for Roadmap

Based on research, recommended phase structure:

### Phase 1: Your Intern Page Debugging (Parallel Start)
**Rationale:** This is the highest-risk blocker for client success. Must be unblocked early.
- **Duration:** 4-6 hours
- **Complexity:** Medium (requires production error capture + SSR/client-server debugging)
- **Priority:** CRITICAL (blocks admin onboarding)
- **Can start:** Immediately (no dependencies)
- **Includes:**
  - Capture production error (Sentry/console log)
  - Identify root cause (hydration, Clerk hooks, Convex queries)
  - Fix server/client boundary issue
  - Test all 5 tabs (Persona, Flow, Database, Scoring, Slots) in dev + production

### Phase 2: Inbox UI Replacement
**Rationale:** Kapso components are production-ready. The integration is straightforward—replace custom components with Kapso while keeping Convex data layer.
- **Duration:** 16-20 hours
- **Complexity:** High (component swap + real-time testing)
- **Priority:** High (improves UX significantly)
- **Dependencies:** Phase 1 (Your Intern fix improves confidence)
- **Includes:**
  - Swap InboxClient components with Kapso inbox
  - Map Convex queries to Kapso component props
  - Verify real-time updates (Convex subscriptions)
  - Test in dev mode (mock data) and production
  - Handle Kapso auto-polling vs Convex subscriptions

### Phase 3: Status Filtering Enhancements
**Rationale:** Upgrade from basic open/closed to hot/warm/cold temperature display. Leverages Convex lead_score.
- **Duration:** 6-8 hours
- **Complexity:** Medium (calculation + UI)
- **Priority:** High (improves lead prioritization)
- **Dependencies:** Phase 2 (Kapso inbox provides new filter UI)
- **Includes:**
  - Implement temperature calculation (score >= 70 = hot, >= 40 = warm)
  - Update filter bar with hot/warm/cold/new/client/lost options
  - Map Convex lead_status to temperature display
  - Verify Settings integration (status config)

### Phase 4: Real-Time Sync Verification & E2E Testing
**Rationale:** Final integration testing to ensure Kapso polling + Convex subscriptions work together without conflicts.
- **Duration:** 4 hours
- **Complexity:** Low (mostly testing)
- **Priority:** Medium (verification before v3.4 ships)
- **Dependencies:** Phases 2-3
- **Includes:**
  - Test webhook message delivery
  - Verify no duplicate re-renders (Kapso polling + Convex subscriptions)
  - E2E: WhatsApp message → Inbox → Your Intern updates
  - Performance monitoring

---

## Phase Ordering Rationale

**Sequential order recommended:**

1. **Phase 1 (Your Intern) → Phases 2-3 (Parallel possible) → Phase 4**

**Why this order:**
- Phase 1 unblocks client onboarding (highest business value)
- Phase 1 can start immediately (no dependencies)
- Phase 2 & 3 can run in parallel once Phase 1 is done (Kapso inbox + status filtering are loosely coupled)
- Phase 4 comes last (E2E testing of complete system)
- Each phase delivers value: 1 = admin config, 2 = better UX, 3 = better prioritization, 4 = verified system

**Alternative:** Start Phase 2 immediately while Phase 1 debugs in background. If Your Intern fix is simple, can merge before Phase 2 completes. If complex, Phase 2 will be done and can proceed to Phase 3/4 while Phase 1 continues.

---

## Research Flags for Phases

### Phase 1: Your Intern Debugging
**Likely needs deeper research:** YES
- **What:** Exact root cause of production crash
- **Why:** Symptoms differ between dev (works) and production (crashes)
- **How:** Enable production error logging, check Clerk auth patterns, verify Convex schema
- **Timeline:** First 30-60 minutes of phase

### Phase 2: Inbox UI Replacement
**Likely needs deeper research:** MAYBE
- **What:** Real-time sync behavior (Kapso polling + Convex subscriptions)
- **Why:** Hybrid approach not yet tested at scale
- **How:** Load test with 100+ concurrent messages, monitor for double re-renders
- **Timeline:** Phase 2 integration testing (last 4-6 hours)

### Phase 3: Status Filtering
**Likely needs deeper research:** NO
- **Why:** Standard feature, clear data source (lead_score), existing filter architecture
- **Timeline:** No additional research needed

### Phase 4: Real-Time Verification
**Likely needs deeper research:** NO
- **Why:** Primarily E2E testing, not feature development
- **Timeline:** Execute as planned

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Kapso is open-source, documented. Next.js 15 compatible. No new dependencies. |
| **Features** | HIGH | Clear table stakes (list, thread, search) and differentiators (templates, buttons). Your Intern crash is documented in v3.3 audit. |
| **Architecture** | HIGH | Data flow (Convex → UI → Convex) well-understood. Kapso UI is stateless component library. |
| **Pitfalls** | HIGH | SSR/hydration, Kapso polling + Convex subscriptions, ARI workspace linkage all identified. |
| **Timeline** | MEDIUM | Inbox replacement: 16-20h (fairly clear). Your Intern debugging: 4-6h (depends on root cause). |

**Overall:** HIGH confidence in structure and direction. Medium confidence in Your Intern timeline (unknown root cause). Standard risk (integration testing) for Kapso polling.

---

## Key Decisions from Research

1. **Keep Convex data layer as-is** (no schema changes)
   - Rationale: Kapso is UI-only; data structures are unchanged
   - Risk: Zero (backward compatible)

2. **Hybrid polling + subscriptions** (Kapso polling + Convex subscriptions)
   - Rationale: Works for SME scale. Kapso Cloud API best-effort polling, Convex subscriptions for real-time
   - Risk: Potential duplicate re-renders; monitor in Phase 4

3. **Defer template messages to post-v3.4**
   - Rationale: Requires Kapso Cloud API setup; nice-to-have, not blocking
   - Risk: None (intentional deferral)

4. **Fix Your Intern in Phase 1, not as tech debt**
   - Rationale: Client onboarding blocker; higher priority than inbox UI
   - Risk: None (essential)

---

## Open Questions for Phase Teams

### Phase 1 (Your Intern Debugging)
- [ ] What is the exact error message in production? (Check Sentry/browser console)
- [ ] Does the crash happen on all tabs or specific ones?
- [ ] Does it fail during initial load or on user interaction (tab click)?
- [ ] Can you reproduce locally by switching dev mode off?

### Phase 2 (Inbox UI Replacement)
- [ ] Has Kapso polling latency been tested? (Should be <5 seconds)
- [ ] How to handle Kapso 404 if contact doesn't exist in Kapso (but exists in Convex)?
- [ ] Should we pre-fetch Kapso data or lazy-load on click?

### Phase 3 (Status Filtering)
- [ ] Are hot/warm/cold thresholds configurable per workspace, or fixed?
- [ ] Do existing conversations need lead_score recalculation?

### Phase 4 (Real-Time Verification)
- [ ] What's acceptable latency for message appearing in inbox? (Target: <2 seconds)
- [ ] Monitor: duplicate renders, memory leaks, CPU usage under 100+ concurrent messages?

---

## Gaps to Address

1. **Your Intern Root Cause Unknown**
   - Will be identified in Phase 1
   - May require additional refactoring based on findings

2. **Kapso Polling Behavior Under Load**
   - Assumed to work fine, not tested at scale
   - Phase 2 integration testing will verify
   - If issues arise: consider increasing polling interval or switching to webhook-only

3. **ARI Workspace Linkage (v3.3 Carryover)**
   - Should be fixed before v3.4 starts
   - If not fixed, Phase 4 E2E testing will fail
   - Recommend: include as Phase 0 (15-minute fix)

4. **Message Delivery Status (Read Receipts)**
   - Kapso Cloud API sends events; Convex receives but doesn't persist consistently
   - Deferred to post-v3.4
   - Won't block inbox replacement

---

## Success Criteria for v3.4

**Inbox Replacement:**
- [ ] Kapso inbox renders all conversations
- [ ] Real-time updates work (new messages appear without refresh)
- [ ] Status filtering displays hot/warm/cold correctly
- [ ] Dev mode (mock data) and production both functional

**Your Intern Fix:**
- [ ] Page loads in production without errors
- [ ] All 5 tabs (Persona, Flow, Database, Scoring, Slots) functional
- [ ] Admins can configure ARI bot settings

**Integration:**
- [ ] E2E: WhatsApp message → Kapso inbox → Your Intern updates → bot responds
- [ ] No duplicate message re-renders
- [ ] Latency <2 seconds for inbox updates

---

## Sources & References

**Authoritative Sources:**
- [Kapso whatsapp-cloud-inbox (GitHub)](https://github.com/gokapso/whatsapp-cloud-inbox) — Official open-source implementation
- [Kapso Documentation](https://docs.kapso.ai/docs/whatsapp/flows/kapso-integration) — Official integration guide

**Internal Documentation:**
- [my21staff PROJECT.md](file:///home/jfransisco/Desktop/21/my21staff/planning/PROJECT.md) — Project scope + known issues
- [my21staff ROADMAP.md](file:///home/jfransisco/Desktop/21/my21staff/planning/ROADMAP.md) — Phase structure + progress
- [v3.3 Milestone Audit](file:///home/jfransisco/Desktop/21/my21staff/planning/v3.3-MILESTONE-AUDIT.md) — Gap analysis (ARI linkage blocker documented)
- [Convex Schema](file:///home/jfransisco/Desktop/21/my21staff/convex/schema.ts) — Data structure (conversations, messages, contacts, ariConfig)
- [Knowledge Base Client](file:///home/jfransisco/Desktop/21/my21staff/src/app/(dashboard)/[workspace]/knowledge-base/knowledge-base-client.tsx) — Your Intern implementation

---

*Research complete. Proceeding to roadmap creation.*
