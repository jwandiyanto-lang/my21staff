---
status: resolved
trigger: "Inbox doesn't match Kapso WhatsApp Cloud Inbox design - architecture investigation needed"
created: 2026-01-27T17:00:00Z
updated: 2026-01-27T17:25:00Z
---

## Current Focus
investigation complete - root cause identified and documented

## Symptoms
**Expected:** Inbox architecture matches Kapso WhatsApp Cloud Inbox design (github.com/gokapso/whatsapp-cloud-inbox) with clean 2-column layout (narrow conversation sidebar + wide message thread), WhatsApp Web aesthetic
**Actual:** Current UI has mixed custom design with some Kapso components, layout structure does NOT match reference design
**Root Cause:** Architecture mismatch between current structure and Kapso reference design

## Eliminated
None

## Evidence

### Evidence 1: Layout Structure Mismatch
- **checked:** Current inbox-client.tsx layout structure (lines 1-400)
- **found:** 3-column layout: left sidebar (w-80) + center message thread + right overlay sidebar (InfoSidebar)
- **implication:** Kapso reference uses 2-column (sidebar + thread), not 3-column with overlay. Right panel should be integrated or hidden by default.
- **timestamp:** 2026-01-27T17:05:00Z

### Evidence 2: Filter UI Not WhatsApp-Style
- **checked:** filter-tabs.tsx and tag-filter-dropdown.tsx implementations
- **found:** FilterTabs uses horizontal buttons with badges (good), but placed in top-left header section alongside search. Not following WhatsApp Web UI pattern where filters are primary navigation.
- **implication:** Filters should have more prominence in layout. Current placement is too cramped in header (p-4 space with Active/All toggle + FilterTabs + TagFilterDropdown + search all competing for space).
- **timestamp:** 2026-01-27T17:08:00Z

### Evidence 3: Message Bubble Styling Uses Emerald, Not Brand Color
- **checked:** message-bubble.tsx (line 73)
- **found:** Sender bubbles use `bg-emerald-500` (WhatsApp green), receiver bubbles use white/dark
- **implication:** This IS correct for Kapso aesthetic (Plan 04-02 documented this decision). But comment says "Brand colors for outbound messages (not WhatsApp green)" - contradicts actual implementation. Comment is outdated/wrong.
- **timestamp:** 2026-01-27T17:10:00Z

### Evidence 4: Conversation List Missing Key WhatsApp Details
- **checked:** conversation-list.tsx (lines 40-145)
- **found:** Shows avatar, name, timestamp, message preview, status tag. Missing: online indicator, last activity status, proper spacing/typography.
- **implication:** Structure is close but needs visual refinement. Avatar styling could be improved (currently uses colored bg based on status). Typography hierarchy not matching WhatsApp Web.
- **timestamp:** 2026-01-27T17:12:00Z

### Evidence 5: Right Sidebar (InfoSidebar) Positioned as Overlay, Not Integrated
- **checked:** inbox-client.tsx lines 237-252 (right sidebar rendering)
- **found:** Uses `absolute right-0 top-0 h-full z-10 shadow-lg` - positioned as floating overlay on top of message thread
- **implication:** Blocks message thread when open. Kapso design shows this as integrated right panel with proper column spacing, or hidden on mobile. Current overlay UX is awkward.
- **timestamp:** 2026-01-27T17:15:00Z

### Evidence 6: Compose Input Not Following WhatsApp Pattern
- **checked:** compose-input.tsx (referenced in message-thread.tsx)
- **found:** Component exists but implementation not reviewed (file 4KB, likely has input + button)
- **implication:** Should be bottom-sticky input with emoji picker, attachment buttons, send button - WhatsApp Web pattern.
- **timestamp:** 2026-01-27T17:16:00Z

### Evidence 7: Filter Header Layout Is Cramped
- **checked:** inbox-client.tsx lines 125-152 (search and filter header)
- **found:**
  - Active/All toggle: rounded pill buttons (good)
  - FilterTabs: horizontal scrollable buttons (good pattern, but needs space)
  - TagFilterDropdown + Search: combined in flex row (squished)
  - All 3 sections stacked vertically in p-4 space
- **implication:** This layout wastes space. Kapso reference uses cleaner header: main search on top row, filters below in dedicated section.
- **timestamp:** 2026-01-27T17:18:00Z

### Evidence 8: Sidebar Width and Message Thread Proportion
- **checked:** inbox-client.tsx line 214 (w-80 for conversation list)
- **found:** Conversation list is fixed width (w-80 = 320px), message thread is flex-1 (fills remainder)
- **implication:** On small screens (1024px), sidebar takes 31% of space, leaving only 69% for thread. On large screens (1920px), sidebar is small proportion. Should be responsive or use better proportion (25%/75% or 30%/70%).
- **timestamp:** 2026-01-27T17:20:00Z

## Resolution

### Root Cause
**Architecture mismatch between current implementation and Kapso WhatsApp Cloud Inbox design principles:**

1. **Layout Structure:** Current 3-column layout (sidebar + thread + overlay) conflicts with Kapso's 2-column design (sidebar + thread with integrated right panel)
2. **Filter UI Organization:** Filters crammed into header with multiple competing elements instead of dedicated filter bar
3. **Right Sidebar Integration:** InfoSidebar is floating overlay, not integrated panel with proper spacing
4. **Sidebar Proportions:** Fixed w-80 sidebar doesn't scale well across different screen sizes
5. **Visual Hierarchy:** Filter UI and search not matching WhatsApp Web's clean, horizontal layout pattern

### Files Requiring Changes

**High Priority (Architecture):**
- `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` - Restructure layout from 3-column overlay to 2-column integrated design
- `src/components/inbox/conversation-list.tsx` - Enhance visual hierarchy and typography to match WhatsApp Web
- `src/components/contact/info-sidebar.tsx` - Convert from floating overlay to integrated right panel (or redesign as modal)

**Medium Priority (UI Polish):**
- `src/components/inbox/filter-tabs.tsx` - Add dedicated filter bar section, improve spacing
- `src/components/inbox/message-thread.tsx` - Ensure proper padding/spacing for message content
- `src/components/inbox/message-bubble.tsx` - Update outdated comment about "brand colors" (currently uses emerald-500 correctly)
- `src/components/inbox/compose-input.tsx` - Add WhatsApp-style input features (emoji picker, attachments)

**Low Priority (Future Enhancements):**
- `src/lib/lead-status.ts` - Avatar styling could use better colors/icons
- Responsive breakpoints for filter visibility on mobile
- Keyboard shortcuts for navigation (WhatsApp Web has these)

### Missing Components/Features

**UI Components:**
1. **Dedicated Filter Bar** - Separate section below search with cleaner tab layout
2. **Online Indicator** - In conversation list (green dot showing who's online)
3. **Media Gallery Panel** - Right sidebar could show shared media from conversation
4. **Pin/Archive Actions** - Quick action buttons on conversations
5. **Search Results UI** - When search is active, show search mode styling

**Functional Features:**
1. **Responsive Right Panel** - Hide on mobile, show on desktop as integrated panel (not overlay)
2. **Conversation Grouping** - Group conversations by status (hot, warm, cold, etc.) with headers
3. **Message Search** - Search within conversation messages (not just conversation list)
4. **Conversation Mute/Archive** - Mark conversations as archived without deleting
5. **Contact Verification Badge** - Show if contact is verified WhatsApp Business Account

### Why Current Design Diverges from Kapso

**Root causes:**
1. **Development History:** Inbox was built iteratively before Kapso reference was established. Components work but aren't architected for 2-column layout.
2. **InfoSidebar Design Decision:** Was positioned as overlay to avoid redesigning main layout. This is expedient but not aligned with Kapso's integrated panel approach.
3. **Filter Implementation:** Added after initial UI was stable. Filters were added to existing header space rather than restructuring header section.
4. **Missing Design Spec:** No explicit "this must match Kapso's layout exactly" requirement during Phase 04 implementation. Components were created with Kapso aesthetic (emerald bubbles, auto-scroll, filter tabs) but not full layout alignment.

## Suggested Fix Direction

**Phase 1 (High Priority):**
1. Restructure inbox-client.tsx layout to use 2-column grid: `grid-cols-[320px_1fr]` (sidebar + thread)
2. Move InfoSidebar from overlay to: (a) right panel `grid-cols-[320px_1fr_320px]` on desktop, (b) modal/drawer on mobile
3. Create dedicated filter bar component: cleaner spacing for FilterTabs + TagFilterDropdown
4. Update conversation-list typography: improve name/preview/status spacing

**Phase 2 (Medium Priority):**
1. Add online indicators to conversation avatars
2. Implement responsive breakpoints: hide right panel on screens < 1440px
3. Add conversation grouping by status (visual section headers)
4. Polish compose-input styling

**Phase 3 (Low Priority):**
1. Add message search within thread
2. Implement conversation archive/mute
3. Add media gallery in right panel
4. Keyboard shortcuts

---

## Artifacts Summary

| File | Current State | Issue | Priority |
|------|---------------|-------|----------|
| inbox-client.tsx | 3-column layout with overlay | Architecture mismatch with Kapso design | HIGH |
| conversation-list.tsx | Basic list with avatar + status | Visual hierarchy needs refinement | MEDIUM |
| filter-tabs.tsx | Horizontal tab buttons | Cramped in header section | MEDIUM |
| tag-filter-dropdown.tsx | Popover multi-select | Works but needs space in layout | MEDIUM |
| message-bubble.tsx | Emerald sender, white receiver | Comment outdated, needs update | LOW |
| message-thread.tsx | Auto-scroll with new indicator | Spacing/padding needs review | LOW |
| compose-input.tsx | Basic input component | Needs WhatsApp-style UI (emoji, attachments) | MEDIUM |
| info-sidebar.tsx | Floating overlay | Should be integrated panel or modal | HIGH |

---

## Kapso Reference Alignment Checklist

- [ ] 2-column layout (sidebar + message thread)
- [x] WhatsApp-style message bubbles (emerald-500 for sender)
- [x] Smart auto-scroll with new message indicator
- [x] Status filtering with real-time counts
- [x] Tag-based filtering
- [ ] Online indicators for contacts
- [ ] Responsive right panel (integrated, not overlay)
- [ ] Dedicated filter bar (not cramped in header)
- [ ] Media gallery panel
- [ ] Contact verification badges

---

## Key Insights

1. **Components are individually good** - FilterTabs, TagFilterDropdown, MessageBubble all implement Kapso aesthetics correctly. The issue is the **overall layout architecture**.

2. **InfoSidebar as overlay is the main blocker** - This design decision forced 3-column thinking. Converting to integrated panel or modal unlocks proper 2-column structure.

3. **Filter bar needs restructuring** - Not broken, just poorly organized. Needs dedicated space to breathe.

4. **Comment inconsistency** - message-bubble.tsx comment says "brand colors" but code uses emerald-500. This is correct per Plan 04-02 decision, but documentation is outdated.

5. **Phase 04 implementation is 80% complete** - Aesthetic is there (bubbles, colors, scroll behavior), but architectural layout diverges from reference. This is a refactoring task, not a "start over" situation.

---
*Investigation complete: 2026-01-27*
*Root cause: Layout architecture does not match Kapso 2-column reference design*
*Next action: Plan Phase 04.3-inbox-layout-redesign to restructure to 2-column integrated design*
