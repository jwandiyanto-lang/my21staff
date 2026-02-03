---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - convex/workspaces.ts
  - src/app/api/workspaces/[id]/status-config/route.ts
  - src/app/(dashboard)/[workspace]/settings/settings-client.tsx
  - src/lib/lead-status.ts
autonomous: true

must_haves:
  truths:
    - "Lead status changes persist after tab switch"
    - "Tags changes persist after tab switch"
    - "Status enabled/disabled state is saved to database"
  artifacts:
    - path: "convex/workspaces.ts"
      provides: "updateStatusConfig mutation with enabled field support"
    - path: "src/lib/lead-status.ts"
      provides: "LeadStatusConfig type with enabled field"
  key_links:
    - from: "settings-client.tsx"
      to: "/api/workspaces/[id]/status-config"
      via: "fetch PUT with leadStatuses including enabled field"
    - from: "status-config/route.ts"
      to: "api.workspaces.updateStatusConfig"
      via: "convex.mutation call"
---

<objective>
Fix settings tags and lead status persistence on leads page.

Purpose: When user edits tags or lead statuses in Settings, changes should persist when switching to Leads tab. Currently changes revert because of a schema mismatch between frontend StatusConfig (has `enabled` field) and Convex mutation (expects `temperature` field but not `enabled`).

Output: Settings changes persist correctly across tab switches.
</objective>

<execution_context>
@/home/jfransisco/.claude/get-shit-done/workflows/execute-plan.md
@/home/jfransisco/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update Convex updateStatusConfig mutation to accept enabled field</name>
  <files>convex/workspaces.ts, src/lib/lead-status.ts</files>
  <action>
    1. In src/lib/lead-status.ts, update LeadStatusConfig interface to include `enabled` field:
       ```typescript
       export interface LeadStatusConfig {
         key: string
         label: string
         color: string
         bgColor: string
         temperature?: 'hot' | 'warm' | 'cold' | null
         enabled?: boolean  // Add this field
       }
       ```

    2. In convex/workspaces.ts, update the `updateStatusConfig` mutation args to include `enabled`:
       - Change leadStatuses validator from:
         ```typescript
         leadStatuses: v.array(v.object({
           key: v.string(),
           label: v.string(),
           color: v.string(),
           bgColor: v.string(),
           temperature: v.union(v.literal("hot"), v.literal("warm"), v.literal("cold"), v.null()),
         }))
         ```
       - To:
         ```typescript
         leadStatuses: v.array(v.object({
           key: v.string(),
           label: v.string(),
           color: v.string(),
           bgColor: v.string(),
           temperature: v.optional(v.union(v.literal("hot"), v.literal("warm"), v.literal("cold"), v.null())),
           enabled: v.optional(v.boolean()),
         }))
         ```
       - Make temperature optional since UI doesn't always provide it
  </action>
  <verify>Run `npx convex dev --once` to verify schema compiles without errors</verify>
  <done>Convex mutation accepts both temperature and enabled fields</done>
</task>

<task type="auto">
  <name>Task 2: Update settings-client.tsx to send complete status data</name>
  <files>src/app/(dashboard)/[workspace]/settings/settings-client.tsx</files>
  <action>
    1. Update the StatusConfig interface to include optional temperature:
       ```typescript
       interface StatusConfig {
         key: string
         label: string
         color: string
         bgColor: string
         enabled: boolean
         temperature?: 'hot' | 'warm' | 'cold' | null
       }
       ```

    2. Update the default statuses array to include temperature mappings:
       ```typescript
       const [statuses, setStatuses] = useState<StatusConfig[]>([
         { key: 'new', label: 'New', color: '#6B7280', bgColor: '#F3F4F6', enabled: true, temperature: null },
         { key: 'cold', label: 'Cold Lead', color: '#3B82F6', bgColor: '#DBEAFE', enabled: true, temperature: 'cold' },
         { key: 'warm', label: 'Warm Lead', color: '#F59E0B', bgColor: '#FEF3C7', enabled: true, temperature: 'warm' },
         { key: 'hot', label: 'Hot Lead', color: '#DC2626', bgColor: '#FEE2E2', enabled: true, temperature: 'hot' },
         { key: 'client', label: 'Client', color: '#10B981', bgColor: '#D1FAE5', enabled: true, temperature: null },
         { key: 'lost', label: 'Lost', color: '#4B5563', bgColor: '#E5E7EB', enabled: true, temperature: null },
       ])
       ```

    3. When loading statuses from API response (lines 91-99), preserve the temperature field:
       ```typescript
       if (statusRes.ok) {
         const statusData = await statusRes.json()
         if (Array.isArray(statusData)) {
           setStatuses(statusData.map((s: any) => ({
             ...s,
             enabled: s.enabled !== false,
           })))
         }
       }
       ```
       This already spreads ...s so temperature will be preserved. No change needed here.

    4. Verify handleSaveStatuses sends the full status object (it does via `statuses` state).
  </action>
  <verify>
    1. Start dev server: `npm run dev`
    2. Navigate to /eagle-overseas/settings (or /demo/settings for dev mode)
    3. Toggle a status enabled/disabled
    4. Check browser Network tab - PUT to /api/workspaces/.../status-config should return 200
    5. Switch to Leads tab and back - status should remain toggled
  </verify>
  <done>Status changes with enabled field persist correctly</done>
</task>

<task type="auto">
  <name>Task 3: Test tags persistence and fix if needed</name>
  <files>src/app/api/workspaces/[id]/tags/route.ts</files>
  <action>
    Test tags persistence:
    1. In Settings, add a new tag
    2. Switch to Leads tab
    3. Check if tag appears in tags filter dropdown

    If tags don't persist, verify:
    - The tags API at /api/workspaces/[id]/tags correctly calls setContactTags mutation
    - The useWorkspaceSettings hook reads from workspace.settings.contact_tags

    The tags API looks correct - it uses workspace._id (not slug) to call setContactTags.
    The useWorkspaceSettings reads contactTags from workspace.settings.contact_tags.

    If issue persists, check if the Convex workspace query in useWorkspaceSettings is using the correct workspace ID format.

    NOTE: In production, the real-time Convex subscription should auto-update. If it doesn't, the issue might be that the HTTP client mutation doesn't trigger the reactive query update (different clients).

    Potential fix if needed: After saving tags in settings-client.tsx, manually trigger a refetch or use the Convex useMutation hook instead of fetch().
  </action>
  <verify>
    1. Add a tag in Settings
    2. Immediately switch to Leads tab
    3. Verify new tag appears in Tags filter dropdown
    4. Remove the tag in Settings
    5. Verify tag is gone from Leads filter
  </verify>
  <done>Tags persist correctly between Settings and Leads pages</done>
</task>

</tasks>

<verification>
1. Build check: `npm run build` passes without TypeScript errors
2. Lead status persistence: Toggle status enabled/disabled in Settings, switch tabs, verify it persists
3. Tags persistence: Add/remove tags in Settings, switch tabs, verify they appear/disappear in Leads filter
</verification>

<success_criteria>
- Convex mutation accepts status config with enabled field
- Settings changes persist across tab switches
- No TypeScript compilation errors
- Both dev mode and production mode work correctly
</success_criteria>

<output>
After completion, create `.planning/quick/002-fix-settings-tags-and-lead-status-persis/002-SUMMARY.md`
</output>
