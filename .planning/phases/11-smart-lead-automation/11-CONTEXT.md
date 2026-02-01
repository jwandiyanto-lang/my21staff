# Phase 11: Smart Lead Automation - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Automatic lead creation and update from WhatsApp conversations - first message creates lead in database, subsequent messages update activity without duplicates. Includes dashboard UI redesign to display lead data (Universal + Niche fields) and activity timeline.

</domain>

<decisions>
## Implementation Decisions

### Lead Creation Trigger
- **Trigger:** First inbound message from any phone number automatically creates a lead
- Simple, clean approach - already partially implemented in webhook code
- Test messages will create leads (acceptable - can filter later by lead_score or tags)
- No manual approval required - instant lead creation

### Duplicate Prevention Strategy
- **CRITICAL FIX REQUIRED:** Use `phone_normalized` (E.164 format) for contact matching instead of raw phone
- Current bug: Code normalizes phone but queries by raw phone string, creating duplicates
- Normalization makes 0813, 62813, +62813 all resolve to same lead (+6281234567890)
- Use `libphonenumber-js` library for E.164 conversion (already implemented in `/src/lib/phone/normalize.ts`)
- Query by `phone_normalized` field in `findOrCreateContactWebhook` mutation

**Edge cases:**
- Number changes: Creates new lead (phone is primary key) - acceptable behavior
- Shared phones: Each number = one lead - acceptable for SME context
- Merge leads: Manual process, not automated

### Update Behavior
- **Update on every inbound message:**
  - `lastActivityAt` timestamp (new field - add to schema)
  - `last_message_preview` (already exists at conversation level)
  - `unread_count` (already exists at conversation level)
  - `kapso_name` if new/empty (already implemented)

- **DO NOT overwrite manual edits:**
  - If user manually edits lead data (name, business_type, etc.), don't replace from WhatsApp
  - Only update activity-related fields and empty fields
  - Manual CRM data takes priority over automated updates

### Dashboard UI - Right Panel
- **Purpose:** Display lead data + activity timeline (no quick actions in panel)
- **Start simple:** Data + Activity sections only (defer complex features)

**Structure (sections with headers):**
1. **Contact Vitals** - name, phone, email, location, timezone
2. **Source Intelligence** - traffic_source, campaign_id, ad_id, landing_page_url, device_type
3. **Engagement Signals** - lead_status, response_latency, message_count, flow_completion_rate
4. **Lead Profile** - summary, temperature_reason, lead_volume, current_stack, main_pain_point, urgency_timeline, recommended_pitch
5. **Niche Data** - Industry-specific fields (conditional based on business_type)
6. **Activity** - Timeline of events

**Editability:**
- Inline editing - click any field to edit directly
- Auto-save on blur (no explicit save button)
- Quick, frictionless updates

**Activity Section:**
- **Daily summaries** with AI-generated notes
  - Example: "📅 Feb 1, 2026 - 5 messages: Lead asked about pricing, requested demo"
- **Dropdown menu** to expand and see individual message details
  - Shows timestamps and full message content when expanded
- **Other events** in timeline:
  - Status changes ("Status changed: WARM → HOT")
  - Manual notes ("Note added by Jon: Hot lead, follow up tomorrow")
  - System events (lead created, score updated)
- Chronological order (newest first or oldest first - Claude decides)

**Quick Actions:**
- Use main dashboard toolbar only (not in panel)
- Keep panel focused on data display

### Claude's Discretion
- Exact UI spacing, typography, colors, shadows
- Activity timeline icon choices (message icon, note icon, etc.)
- AI summary generation algorithm for daily message notes
- Error state handling for failed webhooks
- Chronological order direction (newest first vs oldest first)
- Loading states and skeleton designs
- Empty state messages

</decisions>

<specifics>
## Specific Ideas

- **Data structure reference:** `/home/jfransisco/Desktop/21/my21staff/business_21/03_bots/universal-data.md`
  - Universal Data: Contact vitals, source intelligence, engagement signals, lead profile
  - Niche Data: Industry-specific fields (real estate, med spa, solar, SaaS/CRM)

- **Activity summary example:** "5 messages - Lead asked about pricing, requested demo"
  - AI should extract key themes/intents from messages
  - Dropdown pattern to show/hide message details

- **Current webhook implementation:** `/src/app/api/webhook/kapso/route.ts`
  - Already has signature verification
  - Already has message deduplication via `kapso_message_id`
  - Already calls `findOrCreateContactWebhook` mutation
  - **BUG TO FIX:** Mutation queries by raw phone instead of phone_normalized (lines 1770-1823 in `/convex/mutations.ts`)

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 11-smart-lead-automation*
*Context gathered: 2026-02-01*
