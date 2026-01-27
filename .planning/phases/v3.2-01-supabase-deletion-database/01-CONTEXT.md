# Phase 1: Supabase Deletion + Database Foundation - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Delete all Supabase code and page files. Rebuild Contact Database fresh with Convex. Restore n8n sync from Google Sheets. Foundation for the rest of v3.2.

**Merged scope:** Original Phase 1 (cleanup) + Phase 2 (database) combined per user decision.

</domain>

<decisions>
## Implementation Decisions

### Contact Detail View
- Modal dialog (centered popup, dismissible) — not sheet or full page
- **4 tabs in modal:**
  1. **Profile** — All fields from Google Sheets, inline editable
  2. **Documents** — Attachments they've sent
  3. **Conversations** — WhatsApp thread via Kapso
  4. **Notes** — Activity log + manual notes with due dates
- Fields are inline editable (click to edit, changes sync)

### Merge Functionality
- Merge button available for duplicate contacts
- Popup shows both profiles side-by-side
- User picks each field (always ask, no auto-selection)
- After merge: delete duplicate, log action in Notes as history

### n8n Sync Behavior
- Hourly trigger (existing schedule maintained)
- Incremental sync — only add new leads not already in database
- Always create new records (merge feature handles duplicates later)
- All columns from Google Sheets sync to contact fields

### Navigation Cleanup
- DELETE page files that use Supabase (not just hide)
- Start fresh — keep only what works with Convex
- Claude decides what remains based on working functionality
- 404 handling not a concern (single user, no public access yet)

### Claude's Discretion
- Which specific pages to keep vs delete (based on Convex compatibility)
- Exact tab component implementation
- Note activity formatting
- Sync tracking mechanism (how to detect "new" leads)

</decisions>

<specifics>
## Specific Ideas

- "The database should show all the leads from Google Sheets — currently hundreds in Sheets but only 25 in database"
- Notes should include: form submissions, daily conversation summaries, manual notes with due dates
- Merge history preserved as note entry
- Deploy at end of all v3.2 phases to verify

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: v3.2-01-supabase-deletion-database*
*Context gathered: 2026-01-24*
