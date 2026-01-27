---
phase: 04-user-migration-organizations
plan: 03b
type: execute
wave: 3
depends_on: ["04-01", "04-02"]
files_modified:
  - scripts/update-convex-ticket-ids.ts
  - convex/migrate.ts
autonomous: true

must_haves:
  truths:
    - "All user_id fields in ticket tables updated to Clerk IDs"
    - "Ticket requester_id fields updated to Clerk IDs"
    - "No Supabase UUIDs remain in user reference fields for ticket tables"
  artifacts:
    - path: "scripts/update-convex-ticket-ids.ts"
      provides: "Batch update script for Convex ticket user ID migration"
      min_lines: 60
    - path: "convex/migrate.ts"
      provides: "Migration queries and mutations for ticket tables"
      exports: ["listTickets", "updateTicketUserIds", "listTicketComments", "updateTicketCommentAuthorIds"]
  key_links:
    - from: "scripts/update-convex-ticket-ids.ts"
      to: ".planning/migrations/user-id-mapping.json"
      via: "JSON file read"
      pattern: "user-id-mapping\\.json"
    - from: "scripts/update-convex-ticket-ids.ts"
      to: "convex/migrate.ts"
      via: "Convex mutations"
      pattern: "api\\.migrate\\."
---

<objective>
Update ticket-related Convex tables to use Clerk user IDs instead of Supabase UUIDs.

Purpose: Complete the user ID migration for ticketing system tables
Output: All user references in ticket tables (tickets, comments, status history) point to Clerk IDs
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/04-user-migration-organizations/04-01-SUMMARY.md
@.planning/phases/04-user-migration-organizations/04-02-SUMMARY.md
@convex/schema.ts
@convex/migrate.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add ticket table queries and mutations to migrate.ts</name>
  <files>convex/migrate.ts</files>
  <action>
Extend the existing migrate.ts with queries and mutations for ticket tables.

**Add to existing file:**

```typescript
// ============================================
// TICKET TABLE QUERIES
// ============================================

export const listTickets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tickets").collect();
  },
});

export const listTicketComments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ticketComments").collect();
  },
});

export const listTicketStatusHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ticketStatusHistory").collect();
  },
});

// ============================================
// TICKET TABLE MUTATIONS
// ============================================

/**
 * Update requester_id and assigned_to in tickets table.
 */
export const updateTicketUserIds = mutation({
  args: {
    updates: v.array(v.object({
      ticketId: v.id("tickets"),
      newRequesterId: v.optional(v.string()),
      newAssignedTo: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const patch: any = { updated_at: Date.now() };
      if (update.newRequesterId) patch.requester_id = update.newRequesterId;
      if (update.newAssignedTo) patch.assigned_to = update.newAssignedTo;
      await ctx.db.patch(update.ticketId, patch);
    }
    return { updated: args.updates.length };
  },
});

/**
 * Update author_id in ticketComments table.
 */
export const updateTicketCommentAuthorIds = mutation({
  args: {
    updates: v.array(v.object({
      commentId: v.id("ticketComments"),
      newAuthorId: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.commentId, {
        author_id: update.newAuthorId,
      });
    }
    return { updated: args.updates.length };
  },
});

/**
 * Update changed_by in ticketStatusHistory table.
 */
export const updateTicketStatusHistoryUserIds = mutation({
  args: {
    updates: v.array(v.object({
      historyId: v.id("ticketStatusHistory"),
      newChangedBy: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.historyId, {
        changed_by: update.newChangedBy,
      });
    }
    return { updated: args.updates.length };
  },
});
```
  </action>
  <verify>
Run `npx convex dev` - no TypeScript errors, new queries and mutations appear
  </verify>
  <done>Ticket table queries and mutations added to migrate.ts</done>
</task>

<task type="auto">
  <name>Task 2: Create ticket user ID update script</name>
  <files>scripts/update-convex-ticket-ids.ts</files>
  <action>
Create a TypeScript script specifically for ticket tables:

```typescript
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Load ID mappings
const idMapping: Record<string, string> = JSON.parse(
  fs.readFileSync(".planning/migrations/user-id-mapping.json", "utf-8")
);

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(dryRun ? "DRY RUN MODE - Ticket Tables" : "LIVE MODE - Ticket Tables");

  const report: Record<string, { total: number; updated: number }> = {};

  // 1. Tickets (requester_id, assigned_to)
  console.log("\n--- tickets ---");
  const tickets = await convex.query(api.migrate.listTickets, {});
  const ticketUpdates = tickets
    .filter(t => idMapping[t.requester_id] || (t.assigned_to && idMapping[t.assigned_to]))
    .map(t => ({
      ticketId: t._id,
      newRequesterId: idMapping[t.requester_id],
      newAssignedTo: t.assigned_to ? idMapping[t.assigned_to] : undefined,
    }));

  console.log(`  Found: ${tickets.length} tickets`);
  console.log(`  To update: ${ticketUpdates.length} tickets`);

  if (!dryRun && ticketUpdates.length > 0) {
    for (let i = 0; i < ticketUpdates.length; i += 100) {
      const batch = ticketUpdates.slice(i, i + 100);
      await convex.mutation(api.migrate.updateTicketUserIds, { updates: batch });
      console.log(`  Updated batch: ${batch.length}`);
    }
  }
  report.tickets = { total: tickets.length, updated: ticketUpdates.length };

  // 2. TicketComments (author_id)
  console.log("\n--- ticketComments ---");
  const comments = await convex.query(api.migrate.listTicketComments, {});
  const commentUpdates = comments
    .filter(c => idMapping[c.author_id])
    .map(c => ({
      commentId: c._id,
      newAuthorId: idMapping[c.author_id],
    }));

  console.log(`  Found: ${comments.length} comments`);
  console.log(`  To update: ${commentUpdates.length} comments`);

  if (!dryRun && commentUpdates.length > 0) {
    for (let i = 0; i < commentUpdates.length; i += 100) {
      const batch = commentUpdates.slice(i, i + 100);
      await convex.mutation(api.migrate.updateTicketCommentAuthorIds, { updates: batch });
      console.log(`  Updated batch: ${batch.length}`);
    }
  }
  report.ticketComments = { total: comments.length, updated: commentUpdates.length };

  // 3. TicketStatusHistory (changed_by)
  console.log("\n--- ticketStatusHistory ---");
  const history = await convex.query(api.migrate.listTicketStatusHistory, {});
  const historyUpdates = history
    .filter(h => idMapping[h.changed_by])
    .map(h => ({
      historyId: h._id,
      newChangedBy: idMapping[h.changed_by],
    }));

  console.log(`  Found: ${history.length} history entries`);
  console.log(`  To update: ${historyUpdates.length} entries`);

  if (!dryRun && historyUpdates.length > 0) {
    for (let i = 0; i < historyUpdates.length; i += 100) {
      const batch = historyUpdates.slice(i, i + 100);
      await convex.mutation(api.migrate.updateTicketStatusHistoryUserIds, { updates: batch });
      console.log(`  Updated batch: ${batch.length}`);
    }
  }
  report.ticketStatusHistory = { total: history.length, updated: historyUpdates.length };

  // Save report
  if (!dryRun) {
    fs.writeFileSync(
      ".planning/migrations/user-id-update-report-tickets.json",
      JSON.stringify(report, null, 2)
    );
    console.log("\nReport saved to .planning/migrations/user-id-update-report-tickets.json");
  }

  console.log("\n=== TICKET MIGRATION SUMMARY ===");
  Object.entries(report).forEach(([table, { total, updated }]) => {
    console.log(`${table}: ${updated}/${total} records updated`);
  });
}

main().catch(console.error);
```

**Tables processed:**
1. tickets.requester_id (required)
2. tickets.assigned_to (optional)
3. ticketComments.author_id
4. ticketStatusHistory.changed_by
  </action>
  <verify>
Run `npx tsx scripts/update-convex-ticket-ids.ts --dry-run` shows update counts
  </verify>
  <done>Script exists and dry-run shows correct update counts for ticket tables</done>
</task>

<task type="auto">
  <name>Task 3: Run ticket user ID migration</name>
  <files>.planning/migrations/user-id-update-report-tickets.json</files>
  <action>
Execute the ticket migration script:

```bash
npx tsx scripts/update-convex-ticket-ids.ts
```

Expected output:
- Records updated in each ticket table
- Summary report at .planning/migrations/user-id-update-report-tickets.json

After script completes, verify in Convex Dashboard:
- Query a ticket -> requester_id is Clerk ID format
- Query a ticketComment -> author_id is Clerk ID format
  </action>
  <verify>
1. Check .planning/migrations/user-id-update-report-tickets.json exists
2. Verify update counts match expected
3. Spot-check Convex data: tickets table shows Clerk IDs
  </verify>
  <done>All user references in ticket Convex tables use Clerk IDs</done>
</task>

</tasks>

<verification>
1. No Supabase UUIDs remain in ticket table user fields
2. Spot check confirms Clerk ID format (user_xxx)
3. Update report shows all 3 ticket tables processed
4. Ticket system still functions (no broken references)
</verification>

<success_criteria>
- USER-04: User ID mapping preserves data relationships for ticket tables
- Ticket tables (tickets, ticketComments, ticketStatusHistory) use Clerk IDs
- Error isolation: ticket migration separate from core migration
</success_criteria>

<output>
After completion, create `.planning/phases/04-user-migration-organizations/04-03b-SUMMARY.md`
</output>
