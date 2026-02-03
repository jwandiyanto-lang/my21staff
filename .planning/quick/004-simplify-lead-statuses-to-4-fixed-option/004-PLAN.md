---
phase: quick-004
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/lead-status.ts
  - src/app/(dashboard)/[workspace]/settings/settings-client.tsx
  - src/lib/queries/use-status-config.ts
  - convex/workspaces.ts
  - src/app/api/workspaces/[id]/status-config/route.ts
  - src/lib/mock-data.ts
  - src/app/(dashboard)/[workspace]/leads/columns.tsx
  - src/app/(dashboard)/[workspace]/leads/leads-client.tsx
autonomous: true

must_haves:
  truths:
    - "Lead status dropdown shows exactly 4 options: New, Cold, Hot, Client"
    - "Settings page has no status configuration UI"
    - "Leads page filter shows exactly 4 status options"
  artifacts:
    - path: "src/lib/lead-status.ts"
      provides: "Fixed 4-status configuration"
      contains: "DEFAULT_LEAD_STATUSES"
    - path: "src/app/(dashboard)/[workspace]/settings/settings-client.tsx"
      provides: "Settings without status management"
  key_links:
    - from: "src/lib/lead-status.ts"
      to: "all status consumers"
      via: "DEFAULT_LEAD_STATUSES export"
---

<objective>
Simplify lead statuses to 4 fixed options (New, Cold, Hot, Client)

Purpose: Remove unnecessary complexity - users don't need configurable statuses. Fixed options are simpler and sufficient.

Output:
- 4 hardcoded statuses everywhere
- No status configuration in Settings
- No enabled/disabled filtering logic
</objective>

<execution_context>
@/home/jfransisco/.claude/get-shit-done/workflows/execute-plan.md
@/home/jfransisco/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/lib/lead-status.ts
@src/app/(dashboard)/[workspace]/settings/settings-client.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update lead-status.ts to 4 fixed statuses</name>
  <files>src/lib/lead-status.ts</files>
  <action>
Update DEFAULT_LEAD_STATUSES to exactly 4 options:
```typescript
export const DEFAULT_LEAD_STATUSES: LeadStatusConfig[] = [
  { key: "new", label: "New", color: "#6B7280", bgColor: "#F3F4F6" },
  { key: "cold", label: "Cold Lead", color: "#3B82F6", bgColor: "#DBEAFE" },
  { key: "hot", label: "Hot Lead", color: "#DC2626", bgColor: "#FEE2E2" },
  { key: "client", label: "Client", color: "#10B981", bgColor: "#D1FAE5" },
];
```

Remove from LeadStatusConfig interface:
- `temperature` field (no longer needed)
- `enabled` field (all are always enabled)

Keep: key, label, color, bgColor
  </action>
  <verify>TypeScript compiles without errors: `npx tsc --noEmit`</verify>
  <done>DEFAULT_LEAD_STATUSES has exactly 4 entries, no temperature/enabled fields</done>
</task>

<task type="auto">
  <name>Task 2: Remove status configuration from Settings UI</name>
  <files>src/app/(dashboard)/[workspace]/settings/settings-client.tsx</files>
  <action>
Remove the entire "Lead Statuses" Card component (lines ~233-332):
- Delete the Card with CardTitle "Lead Statuses"
- Delete all status-related state: `statuses`, `editingStatusId`, `savingStatuses`
- Delete `handleSaveStatuses` function
- Delete status loading logic in useEffect (lines fetching status-config)
- Remove BarChart3 icon import if no longer used

Keep:
- Tags configuration Card
- Activity Tracking Card
- AI Assistant tab (bot names)
  </action>
  <verify>Settings page renders without the Lead Statuses card</verify>
  <done>Settings page has no status management UI</done>
</task>

<task type="auto">
  <name>Task 3: Simplify use-status-config hook and supporting files</name>
  <files>
    src/lib/queries/use-status-config.ts
    convex/workspaces.ts
    src/app/api/workspaces/[id]/status-config/route.ts
    src/lib/mock-data.ts
    src/app/(dashboard)/[workspace]/leads/columns.tsx
    src/app/(dashboard)/[workspace]/leads/leads-client.tsx
  </files>
  <action>
1. **use-status-config.ts**: Simplify to always return fixed statuses
   - Remove Convex query call (no longer checking workspace config)
   - Always return DEFAULT_LEAD_STATUSES
   - Remove mock settings listener logic
   - Keep the hook interface (statuses, statusMap, statusKeys, isLoading)

2. **convex/workspaces.ts**: Update getStatusConfig to return 4 fixed statuses
   - Remove workspace lookup for custom config
   - Return hardcoded 4 statuses
   - Keep updateStatusConfig for backward compat but it's now no-op

3. **status-config/route.ts**:
   - GET: Return fixed 4 statuses (ignore workspace)
   - PUT: Can be simplified to no-op or kept for backward compat

4. **mock-data.ts**: Update MOCK_CONVEX_WORKSPACE.settings.lead_statuses to 4 entries
   - Remove 'warm' and 'lost' entries
   - Remove 'enabled' field from entries

5. **columns.tsx**: Remove `.filter(s => s.enabled !== false)` from status dropdown (line ~128)
   - Just use `statusConfig.map(...)` directly

6. **leads-client.tsx**: Remove `.filter(status => status.enabled !== false)` from status filter (line ~323)
   - Just use `statusConfig.map(...)` directly
  </action>
  <verify>
- `npm run dev` starts without errors
- Navigate to /demo/leads - status filter shows 4 options
- Status dropdown in table shows 4 options
  </verify>
  <done>All files use fixed 4 statuses, no enabled filtering anywhere</done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit`
2. Dev server runs: `npm run dev`
3. /demo/settings - No "Lead Statuses" section visible
4. /demo/leads - Status filter dropdown shows exactly: New, Cold Lead, Hot Lead, Client
5. /demo/leads - Click any lead, status dropdown shows same 4 options
</verification>

<success_criteria>
- Lead statuses simplified to 4 fixed options (New, Cold, Hot, Client)
- Settings page has no status configuration section
- No enabled/disabled filtering logic in codebase
- TypeScript compiles without errors
- Dev mode works at localhost:3000/demo
</success_criteria>

<output>
After completion, create `.planning/quick/004-simplify-lead-statuses-to-4-fixed-option/004-SUMMARY.md`
</output>
