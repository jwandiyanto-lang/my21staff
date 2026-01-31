---
status: diagnosed
trigger: "business type is not able to be filter, only name stage and score"
created: 2026-01-31T00:00:00Z
updated: 2026-01-31T00:00:01Z
---

## Current Focus

hypothesis: CONFIRMED - Business Type column missing sortable header configuration
test: Code review complete, mock data verified
expecting: Fix requires changing header from string to Button component with toggleSorting
next_action: provide diagnosis to user

## Symptoms

expected: All columns (Name, Stage, Score, Business Type, Last Active) should be sortable when clicking column headers
actual: Only Name, Stage, and Score columns are sortable. Business Type and Last Active don't respond to clicks
errors: None - UI renders but sorting doesn't work for Business Type
reproduction: Click on Business Type column header - no sorting occurs
started: Unknown - existing issue

## Eliminated

## Evidence

- timestamp: 2026-01-31T00:00:01Z
  checked: lead-columns.tsx lines 94-105 (Business Type column)
  found: Business Type header is plain string 'Business Type' (line 96), not a Button with onClick handler
  implication: Column cannot be sorted because it lacks the sorting UI and handler

- timestamp: 2026-01-31T00:00:02Z
  checked: lead-columns.tsx lines 117-146 (Last Active column)
  found: Last Active HAS sortable Button header (lines 118-128) and custom sortingFn (lines 141-145)
  implication: Last Active should work - need to verify if sorting is actually broken or just appears broken

- timestamp: 2026-01-31T00:00:03Z
  checked: Comparison of sortable vs non-sortable columns
  found: Name (lines 24-34), Stage (49-59), Score (72-82), Last Active (118-128) all have Button headers with column.toggleSorting. Business Type (line 96) is only plain string.
  implication: Business Type is definitely missing sortable configuration

- timestamp: 2026-01-31T00:00:04Z
  checked: mock-data.ts for businessType values
  found: businessType field has proper string values ('Restaurant', 'Salon & Spa', etc.)
  implication: Data is present, only UI configuration is missing

## Resolution

root_cause: Business Type column definition (line 96 of lead-columns.tsx) uses plain string header instead of sortable Button component with column.toggleSorting handler
fix: Replace `header: 'Business Type'` with Button component matching pattern used in Name, Stage, Score, and Last Active columns
verification: Click Business Type header should sort table alphabetically by business type
files_changed:
  - src/components/leads/lead-columns.tsx (lines 94-105)
