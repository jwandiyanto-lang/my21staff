---
phase: quick
plan: 003
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/(dashboard)/[workspace]/leads/leads-client.tsx
autonomous: true

must_haves:
  truths:
    - "Disabled statuses do not appear in the Leads page filter dropdown"
    - "Enabled statuses still appear and are selectable"
    - "All Status option still works correctly"
  artifacts:
    - path: "src/app/(dashboard)/[workspace]/leads/leads-client.tsx"
      provides: "Status filter dropdown with enabled-only filter"
      contains: "statusConfig.filter"
  key_links:
    - from: "leads-client.tsx status dropdown"
      to: "statusConfig array"
      via: "filter(s => s.enabled !== false)"
      pattern: "statusConfig\\.filter.*enabled.*false"
---

<objective>
Filter disabled statuses from the Leads page status filter dropdown.

Purpose: When a status is disabled in Settings, it should not appear as a filter option on the Leads page. Currently the dropdown shows ALL statuses including disabled ones.

Output: Status filter dropdown only shows enabled statuses.
</objective>

<execution_context>
@/home/jfransisco/.claude/get-shit-done/workflows/execute-plan.md
@/home/jfransisco/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
The fix pattern already exists in the codebase. In `columns.tsx` line 128, the same filter is applied:
```tsx
{statusConfig.filter(s => s.enabled !== false).map((s) => { ... })}
```

The issue is in `leads-client.tsx` line 323 where statusConfig.map is used without filtering:
```tsx
{statusConfig.map((status) => { ... })}
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add enabled filter to status dropdown</name>
  <files>src/app/(dashboard)/[workspace]/leads/leads-client.tsx</files>
  <action>
On line 323, change:
```tsx
{statusConfig.map((status) => {
```

To:
```tsx
{statusConfig.filter(status => status.enabled !== false).map((status) => {
```

This matches the existing pattern used in columns.tsx line 128. The filter uses `!== false` (not `=== true`) to handle cases where enabled is undefined (defaults to enabled).
  </action>
  <verify>
1. Run type check: `npm run type-check` - should pass
2. Run dev server: `npm run dev`
3. Navigate to /demo/leads
4. Click the status filter dropdown
5. Verify only enabled statuses appear (disabled ones from settings should be hidden)
  </verify>
  <done>
Status filter dropdown on Leads page only shows statuses where enabled !== false. Disabled statuses are filtered out.
  </done>
</task>

</tasks>

<verification>
- Type check passes: `npm run type-check`
- Leads page loads without errors
- Status filter dropdown shows only enabled statuses
- Filtering by a status still works correctly
</verification>

<success_criteria>
1. Disabled statuses do not appear in the Leads page status filter dropdown
2. Enabled statuses are still visible and functional
3. "All Status" option still works
4. Type check passes
</success_criteria>

<output>
After completion, create `.planning/quick/003-filter-disabled-statuses-from-leads-page/003-SUMMARY.md`
</output>
