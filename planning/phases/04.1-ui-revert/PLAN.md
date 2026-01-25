# Phase 4.1: UI Revert to v2.0 Style

**Goal:** Restore original v2.0 UI designs while keeping Convex backend

**Decision:** User requested reverting to v2.0 UI designs (2026-01-25)

---

## Plans Overview

| Plan | Focus | Tasks | Est. Time |
|------|-------|-------|-----------|
| 01 | Contact Detail Sheet structure | 3 tasks | ~5 min |
| 02 | Inbox filter revert | 5 tasks | ~8 min |
| 03 | Inbox message thread | 4 tasks | ~10 min |
| 04 | Contact Messages & Activity tabs | 3 tasks | ~8 min |

**Total estimated:** ~31 min

---

## Plan 01: Contact Detail Sheet - Basic Structure
See: `01-PLAN.md`

- [x] Task 1: Replace Dialog with Sheet
- [ ] Task 2: Change 4 tabs to 3 tabs (Details, Messages, Activity)
- [ ] Task 3: Update tab content placeholders

## Plan 02: Inbox Filters - Revert to Popover Style
See: `02-PLAN.md`

- [ ] Task 1: Update inbox-client imports
- [ ] Task 2: Add filter header with popover
- [ ] Task 3: Build status filter popover content
- [ ] Task 4: Simplify ConversationList component
- [ ] Task 5: Delete unused filter-chips.tsx

## Plan 03: Inbox Message Thread
See: `03-PLAN.md`

- [ ] Task 1: Create message-thread.tsx shell
- [ ] Task 2: Add MessageBubble component
- [ ] Task 3: Add compose input with send
- [ ] Task 4: Wire into inbox-client

## Plan 04: Contact Messages & Activity Tabs
See: `04-PLAN.md`

- [ ] Task 1: Add Messages tab with conversation history
- [ ] Task 2: Enhance Activity tab with timeline
- [ ] Task 3: Add getByContactId query (if needed)

---

## Execution Notes

**Model usage:**
- `haiku` for simple edits (imports, renames, deletes)
- `sonnet` for new component creation
- Each task = 1 atomic commit

**Verification after each plan:**
```bash
npm run build
```

---

## Success Criteria

- [ ] Contact detail slides from right (Sheet not Dialog)
- [ ] 3 tabs visible: Details, Messages, Activity
- [ ] Inbox filters use popover with checkboxes
- [ ] Message thread displays in inbox
- [ ] Send message works via Kapso
- [ ] Activity tab shows notes timeline
