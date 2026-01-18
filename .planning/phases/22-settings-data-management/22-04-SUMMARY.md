---
phase: 22-settings-data-management
plan: 04
subsystem: leads
tags: [pricing-form, leads-api, crm-integration, contacts]

# Dependency graph
requires:
  - phase: 22-settings-data-management
    plan: 02
    provides: Phone normalization utilities
provides:
  - /api/leads endpoint for direct lead capture
  - Pricing form to my21staff CRM integration
  - Duplicate detection and tag merging
affects: [lead-management, pricing-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [upsert-by-phone, tag-merging, metadata-storage]

key-files:
  created:
    - src/app/api/leads/route.ts
  modified:
    - src/app/pricing/page.tsx (form submission)

key-decisions:
  - "Workspace targeting: Use NEXT_PUBLIC_PRICING_WORKSPACE_ID for my21staff"
  - "Phone normalization: Reuse normalizePhone() from CSV import"
  - "Duplicate handling: Update existing contact, merge tags"
  - "Metadata storage: Store form fields in contact metadata JSON"

patterns-established:
  - "Lead capture API: Public endpoint, admin client for DB operations"
  - "Tag system: pricing-form + plan name as automatic tags"

# Metrics
duration: 4min
completed: 2026-01-17
---

# Phase 22 Plan 04: Pricing Form → CRM Leads Summary

**Direct lead capture from pricing form to my21staff workspace**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-17
- **Completed:** 2026-01-17
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- POST /api/leads endpoint for direct form submission
- Leads stored in my21staff workspace (0318fda5-22c4-419b-bdd8-04471b818d17)
- Phone normalization to E.164 format
- Automatic tags: pricing-form, selected plan name
- Metadata storage: jenis_bisnis, dari_mana_tahu, lead_sources, etc.
- Duplicate detection: Update existing contact by phone, merge tags

## Files Created/Modified
- `src/app/api/leads/route.ts` - Public API endpoint for lead capture
- `src/app/pricing/page.tsx` - Form submission updated to use /api/leads

## Decisions Made
- Use my21staff workspace ID from env var (NEXT_PUBLIC_PRICING_WORKSPACE_ID)
- Reuse phone normalization from CSV import utilities
- Store all form fields in metadata JSON for flexibility
- Merge tags on duplicate to preserve history

## UAT Status
- Pending user testing
- 4 tests defined: submit form, check lead, check metadata, duplicate handling

---
*Phase: 22-settings-data-management*
*Completed: 2026-01-17*
