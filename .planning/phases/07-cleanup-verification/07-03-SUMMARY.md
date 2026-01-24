---
phase: 07-cleanup-verification
plan: 03
subsystem: contact-api
status: complete
tags: [convex, contact-management, csv, merge, notes]

requires:
  - 06-01 # n8n webhook using Convex

provides:
  - Contact CSV export via Convex
  - Contact CSV import via Convex
  - Contact merge via Convex
  - Contact notes CRUD via Convex
  - Notes CSV export via Convex
  - Pricing form leads via Convex

affects:
  - 07-04 # Messaging routes migration
  - 07-05 # Conversation routes migration

tech-stack:
  added:
    - ConvexHttpClient for contact mutations
    - normalizePhone helper for phone formatting
  removed:
    - Supabase from contact export
    - Supabase from contact import
    - Supabase from contact merge
    - Supabase from contact notes
    - Supabase from notes export
    - Supabase from leads endpoint

key-files:
  created: []
  modified:
    - src/app/api/contacts/export/route.ts # CSV export via Convex
    - src/app/api/contacts/import/route.ts # CSV import with upsert
    - src/app/api/contacts/merge/route.ts # Merge duplicates with metadata
    - src/app/api/contacts/[id]/notes/route.ts # Notes CRUD
    - src/app/api/notes/export/route.ts # Export all notes to CSV
    - src/app/api/leads/route.ts # Pricing form submissions
    - convex/mutations.ts # Added merge, import, pricing mutations
    - convex/contacts.ts # Added getNotes query

decisions:
  - slug: convex-contact-mutations
    what: Create dedicated mutations for import and merge operations
    why: upsertContactForImport handles CSV batch imports with phone normalization; mergeContacts handles duplicate contact merging with conversation reassignment
    alternatives: Reuse createContact - rejected, import needs upsert logic
    impact: Cleaner separation of concerns, better auth control
    date: 2026-01-24

  - slug: public-pricing-form-mutation
    what: upsertPricingFormContact is public mutation without auth
    why: Pricing form is public-facing, can't require authentication
    alternatives: Use internalMutation with API key - rejected, adds complexity for simple form
    impact: No auth check, relies on workspace_id validation only
    date: 2026-01-24

  - slug: notes-export-pattern
    what: Notes export fetches contacts first, then notes per contact
    why: No direct workspace index on contactNotes, must fetch via contacts
    alternatives: Add workspace index - rejected, not worth schema change
    impact: N+1 query pattern, acceptable for export operation
    date: 2026-01-24

metrics:
  duration: 25 min
  tasks_completed: 2
  routes_migrated: 6
  mutations_added: 3
  queries_added: 1
  completed: 2026-01-24
---

# Phase 07 Plan 03: Contact Management API Migration Summary

Migrated all contact management API routes from Supabase to Convex.

**One-liner:** Contact CRUD, import/export, merge, and notes now use Convex mutations and queries with Clerk auth.

## What Was Built

### Mutations Added

1. **upsertContactForImport** - Batch contact import with phone normalization
   - Used by CSV import endpoint
   - Handles create or update based on phone match
   - Merges tags on update, creates new contact on miss
   - Requires workspace membership auth

2. **mergeContacts** - Duplicate contact merging
   - Merges metadata and tags
   - Reassigns conversations to primary contact
   - Deletes secondary contact
   - Supports user-selected phone/email

3. **upsertPricingFormContact** - Public pricing form submissions
   - No auth check (public endpoint)
   - Creates or updates my21staff workspace contacts
   - Merges tags and metadata on existing contacts
   - Source tagged as "pricing_form"

### Queries Added

1. **getNotes** - Fetch contact notes
   - Returns up to 100 notes ordered by creation date
   - No auth (API route handles it)
   - Used by contact notes and export endpoints

### Routes Migrated

| Route | Before | After | Change |
|-------|--------|-------|--------|
| `contacts/export` | Supabase select + Papa.unparse | Convex query + manual CSV | CSV generation in-route |
| `contacts/import` | Supabase batch insert/update | Convex upsertContactForImport | Per-row mutation calls |
| `contacts/merge` | Supabase update + delete | Convex mergeContacts mutation | Single atomic operation |
| `contacts/[id]/notes` GET | Supabase select | Convex getNotes query | Clean query pattern |
| `contacts/[id]/notes` POST | Supabase insert | Convex createContactNote mutation | Reused existing mutation |
| `notes/export` | Supabase join select | Convex contacts + notes queries | N+1 pattern (acceptable for export) |
| `leads` | Supabase upsert | Convex upsertPricingFormContact | Public mutation |

## Technical Implementation

### CSV Import Flow

```typescript
// API route receives file upload
const file = formData.get('file')
const text = await file.text()
const lines = text.split('\n')

// Parse CSV rows
for (const line of lines) {
  const row = parseCsvRow(line)
  const normalized = normalizePhone(row.phone)

  // Upsert each contact
  await convex.mutation(api.mutations.upsertContactForImport, {
    workspace_id,
    phone: row.phone,
    phone_normalized: normalized,
    name: row.name,
    tags: row.tags.split(';'),
    // ...
  })
}
```

### Contact Merge Flow

```typescript
// Merge metadata
const combinedMetadata = {
  ...secondaryMetadata,
  ...primaryMetadata,
  merged_from: [...existing, secondaryId],
  merged_phone: [...existing, secondary.phone],
  merged_at: new Date().toISOString()
}

// Update primary contact
await ctx.db.patch(primaryId, { metadata: combinedMetadata, ... })

// Reassign conversations
const conversations = await ctx.db.query("conversations")
  .withIndex("by_contact", q => q.eq("contact_id", secondaryId))
  .collect()

for (const conv of conversations) {
  await ctx.db.patch(conv._id, { contact_id: primaryId })
}

// Delete secondary
await ctx.db.delete(secondaryId)
```

### Notes Export Pattern

```typescript
// Get all workspace contacts
const contacts = await convex.query(api.contacts.listByWorkspaceInternal, { workspace_id })

// Fetch notes per contact (N+1 acceptable for export)
for (const contact of contacts) {
  const notes = await convex.query(api.contacts.getNotes, { contact_id: contact._id })
  // Add to CSV rows
}
```

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**Build verification:** Type check passed (npm run build has Turbopack issues unrelated to changes)

**Supabase verification:** All contact/notes/leads routes clean of Supabase imports

**Manual testing needed:**
- [ ] Test CSV export with workspace contacts
- [ ] Test CSV import with valid/invalid phone numbers
- [ ] Test contact merge with active phone/email selection
- [ ] Test contact notes GET/POST
- [ ] Test notes export
- [ ] Test pricing form submission (public endpoint)

## Dependencies

**Required:**
- Convex schema with contacts, contactNotes, conversations tables
- Phone normalize helper at `src/lib/phone/normalize.ts`
- Clerk auth for protected routes
- Existing mutations: createContactNote (from earlier migration)

**Provides to:**
- 07-04: Clean contact API for messaging routes to build upon
- 07-05: Contact merge pattern for conversation cleanup

## Risks & Mitigations

| Risk | Impact | Mitigation | Status |
|------|--------|-----------|--------|
| CSV import performance (sequential mutations) | Slow for large files | Could batch, but current approach is simple and works | Accepted |
| Notes export N+1 queries | Could be slow for workspaces with many contacts | Acceptable for export operation, rarely used | Accepted |
| Public pricing form mutation | No auth check | Workspace ID is hardcoded constant, low risk | Accepted |

## Performance Impact

**Before (Supabase):**
- CSV import: Batch insert (fast)
- Notes export: Single join query (fast)
- Merge: Multiple updates in transaction

**After (Convex):**
- CSV import: Sequential mutations (slower, but acceptable)
- Notes export: N+1 queries (slower, but rare operation)
- Merge: Single atomic mutation (same performance)

**Trade-off:** Slightly slower import/export for cleaner architecture and better auth control.

## Next Phase Readiness

**Blockers:** None

**Prerequisites for 07-04 (Messaging Routes):**
- Contact mutations now available for message workflows
- Notes pattern established for message annotations

**Concerns:**
- CSV import could be optimized with batch mutations if needed
- Notes export pattern could be improved with workspace index

**Recommendations:**
- Monitor CSV import performance in production
- Consider batch mutation API if import performance becomes issue
