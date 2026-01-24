# Phase 2: Inbox (WhatsApp) - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

WhatsApp messaging via Kapso API with custom UI. Users can view conversation list, read message threads, and send messages (text + attachments). Real-time updates via Convex subscriptions. CRM-integrated filtering by contact tags and status.

**Not in scope:** ARI/AI responses, advanced search, message scheduling, bulk messaging — separate phases.

</domain>

<decisions>
## Implementation Decisions

### Architecture
- Custom UI (not Kapso embed) — required for CRM-integrated filtering
- Kapso API for fetching conversations/messages and sending
- Convex for storage and real-time subscriptions
- Conversations linked to contacts for CRM field filtering

### Conversation List
- WhatsApp-style layout and aesthetic (light gray background)
- Sorted by most recent message (newest activity at top)
- Preview shows: name, last message preview, timestamp, unread badge, CRM tags
- Quick filter chips for Status and Tags (not dropdown)
- Status filters: New, Hot, Warm, Cold, Converted, Lost

### Message Thread
- Brand colors for bubbles (not WhatsApp green)
- Read receipts shown (sent/delivered/read checkmarks)
- Media: images inline, documents as download cards (WhatsApp style)

### Compose & Send
- Enter sends message, Shift+Enter for new line
- Attachments: images and documents supported
- Quick reply templates (saved replies, insert with one click)

### Claude's Discretion
- Timestamp display approach (WhatsApp convention)
- Compose input sizing and expansion behavior
- Empty state messaging
- Loading states and error handling
- Template management UI

</decisions>

<specifics>
## Specific Ideas

- "Mimic how WhatsApp does their style, even to the background style"
- CRM tags visible directly in conversation list for at-a-glance lead status
- Filter by profile data, tags, and status — core requirement for CRM integration

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-inbox*
*Context gathered: 2026-01-24*
