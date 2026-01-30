# Phase 4: Inbox UI & Filtering - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace existing inbox with Kapso's WhatsApp-first UI components and add status/tag filtering capabilities. This is EXPERIMENTAL - we're testing Kapso components to see if they work well with our stack. Conversation archiving, search, bulk actions, and advanced features are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Kapso component integration approach
- Clone whatsapp-cloud-inbox repo as reference (not npm package, not copying components directly)
- Study their **component architecture** (how they structure conversation list, message bubbles, input area)
- Claude decides: wrapper vs custom components based on what's found in repo
- **Philosophy: Try Kapso's out-of-the-box messaging features first, see if good enough, only customize if needed**
- Fallback if Kapso doesn't work: Keep current inbox, just improve styling

### Filter UI placement & behavior
- Status filter appears as **tabs above conversation list** (All | New | Hot | Warm | Cold | Client | Lost)
- Each tab shows **conversation count** in real-time: "Hot (5)", "Warm (12)"
- Tag filter appears as **secondary filter below status tabs** (multi-select dropdown)
- Multiple tag selection uses **AND logic** (show conversations with ALL selected tags, not ANY)
- Filters stack: status tab first, then tag filter narrows within that status

### Message thread interaction patterns
- **Enter to send** (Shift+Enter for new line) - standard WhatsApp Web behavior
- **Optimistic UI**: Message appears immediately with 'sending' indicator, error/retry if fails
- **Auto-scroll if at bottom**: When new messages arrive, scroll to show them only if user is already at bottom; otherwise show 'new messages' indicator
- **Message editing/deletion**: Support both if Kapso API technically allows; otherwise no editing (matches WhatsApp Business API limitations)

### Claude's Discretion
- Exact wrapper implementation vs custom components (based on repo analysis)
- Loading skeleton designs
- Error state messaging
- Tag multi-select component choice (shadcn vs custom)
- Real-time update optimization

</decisions>

<specifics>
## Specific Ideas

- "We will focus on trying Kapso messaging features first, then add ours if it can but I want to see kapso and if its good enough, we will keep it like that so the feature can work smoothly in the crm"
- Status tabs match lead_statuses config from workspace settings
- Conversation counts update via Convex subscriptions (real-time)
- This is a TEST - might abandon Kapso integration if it doesn't work smoothly

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 04-inbox-ui-filtering*
*Context gathered: 2026-01-27*
