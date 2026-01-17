# Phase 21 Research: Lead Polish + Performance

## Summary

The codebase has strong foundational systems but needs polish in UI/UX and critical performance fixes. Key issues: no pagination on main queries (risk for 1000+ records), code duplication between ContactDetailSheet and InfoSidebar, inconsistent date formatting without timezone handling, and inefficient webhook processing loops.

## 1. Notes/Activity System

### Current Implementation
- **Files:** `contact-detail-sheet.tsx` (lines 145-578), `/api/contacts/[id]/notes/route.ts`
- **Table:** `contact_notes` with `id`, `contact_id`, `workspace_id`, `author_id`, `content`, `note_type`, `metadata`, `due_date`, `created_at`, `updated_at`
- **Note types:** `'note'`, `'form_submission'`, `'status_change'`, `'score_change'`, `'merge'`, `'message'`, `'message_summary'`

### Date Formatting
- Uses `date-fns`: `format(new Date(date), 'MMM d, HH:mm')`
- No timezone awareness - all dates assumed local
- Inconsistent patterns: `hh:mm a` vs `HH:mm`

### What Needs Change
- Add WIB (UTC+7) timezone utilities
- Standardize date formats across app
- Add midnight refresh mechanism for activity timestamps

## 2. Assignment System

### Current Implementation
- **Files:** `/api/conversations/[id]/assign/route.ts`, `/api/contacts/[id]/route.ts`, `contact-detail-sheet.tsx` (lines 1107-1135), `inbox-client.tsx` (lines 299-323)
- **Data:** `contacts.assigned_to` and `conversations.assigned_to` (nullable user_id)
- **Team members:** Fetched via workspace_members with profile join

### Assignment UI Locations
1. Database View - Column in data table
2. Contact Detail Sheet - Select dropdown
3. Info Sidebar (Inbox) - Select dropdown
4. Message Thread - Secondary header
5. Inbox Filter - "Assigned to" filter dropdown

### What Needs Change
- Add per-row inline dropdown in database table
- Auto-include new team members (already works via query)
- Default to workspace owner for new leads

## 3. Tags System

### Current Implementation
- **Data:** `contacts.tags` (string array), predefined in `settings?.contact_tags`
- **Default tags:** `['Community', '1on1']`
- **UI:** Checkbox list with badges in Contact Detail Sheet and Info Sidebar

### What Needs Change
- Add per-row inline tag editing in database table
- Add debouncing on tag updates (rapid clicks = multiple API calls)
- Consider tooltip for truncated tag display

## 4. Info Panel

### Current Implementation
- **File:** `inbox-client.tsx` lines 627-1274 (InfoSidebar inline function)
- **Displays:** Contact info, conversation status, lead status/score, assignment, tags, form responses

### Issues Found
1. **Code duplication:** Duplicates nearly all logic from ContactDetailSheet (300+ lines)
2. **Missing features:** No notes panel, no activity timeline
3. **Data consistency:** Updates don't sync back to contact list

### What Needs Change
- Extract InfoSidebar to reusable component
- Add notes display to info panel
- Ensure state sync with table updates

## 5. Performance Analysis

### Critical Bottlenecks

| Issue | Location | Severity |
|-------|----------|----------|
| No pagination on contacts | database/page.tsx:49-53 | **HIGH** |
| No pagination on conversations | inbox/page.tsx:47-54 | **HIGH** |
| Activity timeline built in memory | contact-detail-sheet.tsx:424-568 | MEDIUM |
| Webhook loops not batched | webhook/kapso/route.ts:118-256 | MEDIUM |
| No memoization of metadata parsing | inbox-client.tsx:858-876 | LOW |

### Webhook Processing
```typescript
// Current: loops per entry → per change → per message
// Each message triggers:
// - getOrCreateContact() - potential duplicate work
// - getOrCreateConversation() - potential duplicate work
// - Insert message query
// - Update conversation metadata query
```

### Quick Wins
- Add `.limit(50)` with pagination to main queries
- Memoize contact metadata parsing
- Add debouncing to tag/status/score updates
- Batch webhook message processing

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx` | 1580 | Contact detail UI + notes + activity |
| `src/app/(dashboard)/[workspace]/database/columns.tsx` | ~150 | Table column definitions |
| `src/app/(dashboard)/[workspace]/database/database-client.tsx` | ~150 | Database table + filtering |
| `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` | 1275 | Inbox list + info sidebar |
| `src/app/(dashboard)/[workspace]/inbox/message-thread.tsx` | 1233 | Message display + notes |
| `src/app/api/webhook/kapso/route.ts` | 340+ | Message ingestion |
| `src/app/api/contacts/[id]/route.ts` | ~100 | Contact CRUD |
| `src/app/api/contacts/[id]/notes/route.ts` | 165 | Notes API |

## Dependencies

- **Schema changes:** None required
- **New utilities:** Timezone helper functions (use existing `date-fns` and `date-fns-tz`)
- **Database indexes:** Consider adding if not present:
  - `contacts(workspace_id, created_at)`
  - `conversations(workspace_id, last_message_at)`

## RESEARCH COMPLETE
