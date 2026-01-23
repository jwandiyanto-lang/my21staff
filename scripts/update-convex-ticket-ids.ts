/**
 * Ticket User ID Migration Script
 *
 * Updates user references in Convex ticket tables from Supabase UUIDs to Clerk IDs.
 *
 * Tables updated:
 *   - tickets: requester_id (required), assigned_to (optional)
 *   - ticketComments: author_id
 *   - ticketStatusHistory: changed_by
 *
 * Usage:
 *   npx tsx scripts/update-convex-ticket-ids.ts           # Full migration
 *   npx tsx scripts/update-convex-ticket-ids.ts --dry-run # Preview only
 *
 * Requirements:
 *   - CONVEX_URL in .env.local (e.g., https://xxx.convex.cloud)
 *   - .planning/migrations/user-id-mapping.json must exist (from 04-01)
 */

import { ConvexHttpClient } from "convex/browser";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

// Configuration
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// Parse command line arguments
const isDryRun = process.argv.includes("--dry-run");

// Types
interface UserIdMapping {
  [supabaseId: string]: string; // clerkId
}

interface TicketRecord {
  _id: Id<"tickets">;
  requester_id: string;
  assigned_to?: string;
}

interface CommentRecord {
  _id: Id<"ticketComments">;
  author_id: string;
}

interface HistoryRecord {
  _id: Id<"ticketStatusHistory">;
  changed_by: string;
}

interface MigrationReport {
  timestamp: string;
  dryRun: boolean;
  tables: {
    tickets: {
      total: number;
      updated: number;
      skipped: number;
      unmapped: string[];
    };
    ticketComments: {
      total: number;
      updated: number;
      skipped: number;
      unmapped: string[];
    };
    ticketStatusHistory: {
      total: number;
      updated: number;
      skipped: number;
      unmapped: string[];
    };
  };
  summary: {
    totalRecords: number;
    totalUpdated: number;
    totalSkipped: number;
    totalUnmapped: number;
  };
}

// Validate environment
function validateEnvironment(): void {
  const missing: string[] = [];

  if (!CONVEX_URL) missing.push("NEXT_PUBLIC_CONVEX_URL");

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  }
}

// Load user ID mapping
function loadUserIdMapping(): UserIdMapping {
  const mappingPath = ".planning/migrations/user-id-mapping.json";

  if (!existsSync(mappingPath)) {
    console.error(`Error: Mapping file not found: ${mappingPath}`);
    console.error("Run 04-01 user migration first to generate this file.");
    process.exit(1);
  }

  const content = readFileSync(mappingPath, "utf-8");
  return JSON.parse(content);
}

// Check if a value is a Supabase UUID
function isSupabaseUuid(value: string): boolean {
  // Supabase UUIDs are standard UUIDs (36 chars with dashes)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Check if already a Clerk ID
function isClerkId(value: string): boolean {
  return value.startsWith("user_");
}

// Main migration function
async function runMigration(): Promise<void> {
  console.log("\n========================================");
  console.log("  Ticket User ID Migration (Convex)");
  console.log("========================================\n");

  if (isDryRun) {
    console.log("DRY RUN MODE - No changes will be made\n");
  }

  validateEnvironment();

  // Initialize Convex client
  const client = new ConvexHttpClient(CONVEX_URL!);

  // Load mapping
  const mapping = loadUserIdMapping();
  console.log(`Loaded ${Object.keys(mapping).length} user ID mappings\n`);

  // Initialize report
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    dryRun: isDryRun,
    tables: {
      tickets: { total: 0, updated: 0, skipped: 0, unmapped: [] },
      ticketComments: { total: 0, updated: 0, skipped: 0, unmapped: [] },
      ticketStatusHistory: { total: 0, updated: 0, skipped: 0, unmapped: [] },
    },
    summary: { totalRecords: 0, totalUpdated: 0, totalSkipped: 0, totalUnmapped: 0 },
  };

  // ============================================
  // 1. Migrate tickets table
  // ============================================
  console.log("1. Processing tickets table...");

  const tickets = (await client.query(api.migrate.listTickets)) as TicketRecord[];
  report.tables.tickets.total = tickets.length;
  console.log(`   Found ${tickets.length} tickets`);

  const ticketUpdates: Array<{
    _id: Id<"tickets">;
    requester_id: string;
    assigned_to?: string;
  }> = [];

  for (const ticket of tickets) {
    let needsUpdate = false;
    let newRequesterId = ticket.requester_id;
    let newAssignedTo = ticket.assigned_to;

    // Check requester_id
    if (isSupabaseUuid(ticket.requester_id)) {
      const clerkId = mapping[ticket.requester_id];
      if (clerkId) {
        newRequesterId = clerkId;
        needsUpdate = true;
      } else {
        report.tables.tickets.unmapped.push(ticket.requester_id);
      }
    } else if (isClerkId(ticket.requester_id)) {
      // Already migrated
    }

    // Check assigned_to (optional)
    if (ticket.assigned_to && isSupabaseUuid(ticket.assigned_to)) {
      const clerkId = mapping[ticket.assigned_to];
      if (clerkId) {
        newAssignedTo = clerkId;
        needsUpdate = true;
      } else if (!report.tables.tickets.unmapped.includes(ticket.assigned_to)) {
        report.tables.tickets.unmapped.push(ticket.assigned_to);
      }
    }

    if (needsUpdate) {
      ticketUpdates.push({
        _id: ticket._id,
        requester_id: newRequesterId,
        assigned_to: newAssignedTo,
      });
    } else {
      report.tables.tickets.skipped++;
    }
  }

  console.log(`   Updates needed: ${ticketUpdates.length}`);

  if (!isDryRun && ticketUpdates.length > 0) {
    const result = await client.mutation(api.migrate.updateTicketUserIds, {
      updates: ticketUpdates,
    });
    report.tables.tickets.updated = result.updated;
    console.log(`   Updated: ${result.updated} tickets`);
  } else {
    report.tables.tickets.updated = ticketUpdates.length;
  }

  // ============================================
  // 2. Migrate ticketComments table
  // ============================================
  console.log("\n2. Processing ticketComments table...");

  const comments = (await client.query(api.migrate.listTicketComments)) as CommentRecord[];
  report.tables.ticketComments.total = comments.length;
  console.log(`   Found ${comments.length} comments`);

  const commentUpdates: Array<{
    _id: Id<"ticketComments">;
    author_id: string;
  }> = [];

  for (const comment of comments) {
    if (isSupabaseUuid(comment.author_id)) {
      const clerkId = mapping[comment.author_id];
      if (clerkId) {
        commentUpdates.push({
          _id: comment._id,
          author_id: clerkId,
        });
      } else if (!report.tables.ticketComments.unmapped.includes(comment.author_id)) {
        report.tables.ticketComments.unmapped.push(comment.author_id);
      }
    } else {
      report.tables.ticketComments.skipped++;
    }
  }

  console.log(`   Updates needed: ${commentUpdates.length}`);

  if (!isDryRun && commentUpdates.length > 0) {
    const result = await client.mutation(api.migrate.updateTicketCommentAuthorIds, {
      updates: commentUpdates,
    });
    report.tables.ticketComments.updated = result.updated;
    console.log(`   Updated: ${result.updated} comments`);
  } else {
    report.tables.ticketComments.updated = commentUpdates.length;
  }

  // ============================================
  // 3. Migrate ticketStatusHistory table
  // ============================================
  console.log("\n3. Processing ticketStatusHistory table...");

  const history = (await client.query(api.migrate.listTicketStatusHistory)) as HistoryRecord[];
  report.tables.ticketStatusHistory.total = history.length;
  console.log(`   Found ${history.length} history entries`);

  const historyUpdates: Array<{
    _id: Id<"ticketStatusHistory">;
    changed_by: string;
  }> = [];

  for (const entry of history) {
    if (isSupabaseUuid(entry.changed_by)) {
      const clerkId = mapping[entry.changed_by];
      if (clerkId) {
        historyUpdates.push({
          _id: entry._id,
          changed_by: clerkId,
        });
      } else if (!report.tables.ticketStatusHistory.unmapped.includes(entry.changed_by)) {
        report.tables.ticketStatusHistory.unmapped.push(entry.changed_by);
      }
    } else {
      report.tables.ticketStatusHistory.skipped++;
    }
  }

  console.log(`   Updates needed: ${historyUpdates.length}`);

  if (!isDryRun && historyUpdates.length > 0) {
    const result = await client.mutation(api.migrate.updateTicketStatusHistoryUserIds, {
      updates: historyUpdates,
    });
    report.tables.ticketStatusHistory.updated = result.updated;
    console.log(`   Updated: ${result.updated} history entries`);
  } else {
    report.tables.ticketStatusHistory.updated = historyUpdates.length;
  }

  // ============================================
  // 4. Calculate summary
  // ============================================
  report.summary.totalRecords =
    report.tables.tickets.total +
    report.tables.ticketComments.total +
    report.tables.ticketStatusHistory.total;

  report.summary.totalUpdated =
    report.tables.tickets.updated +
    report.tables.ticketComments.updated +
    report.tables.ticketStatusHistory.updated;

  report.summary.totalSkipped =
    report.tables.tickets.skipped +
    report.tables.ticketComments.skipped +
    report.tables.ticketStatusHistory.skipped;

  // Deduplicate unmapped IDs across tables
  const allUnmapped = new Set([
    ...report.tables.tickets.unmapped,
    ...report.tables.ticketComments.unmapped,
    ...report.tables.ticketStatusHistory.unmapped,
  ]);
  report.summary.totalUnmapped = allUnmapped.size;

  // ============================================
  // 5. Save report
  // ============================================
  const reportPath = ".planning/migrations/user-id-update-report-tickets.json";
  const reportDir = ".planning/migrations";

  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // ============================================
  // 6. Print summary
  // ============================================
  console.log("\n========================================");
  console.log("  Migration Summary");
  console.log("========================================");
  console.log(`  Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log("");
  console.log("  By Table:");
  console.log(`    tickets:             ${report.tables.tickets.updated}/${report.tables.tickets.total} updated`);
  console.log(`    ticketComments:      ${report.tables.ticketComments.updated}/${report.tables.ticketComments.total} updated`);
  console.log(`    ticketStatusHistory: ${report.tables.ticketStatusHistory.updated}/${report.tables.ticketStatusHistory.total} updated`);
  console.log("");
  console.log("  Totals:");
  console.log(`    Records processed: ${report.summary.totalRecords}`);
  console.log(`    Records updated:   ${report.summary.totalUpdated}`);
  console.log(`    Records skipped:   ${report.summary.totalSkipped} (already Clerk IDs)`);

  if (report.summary.totalUnmapped > 0) {
    console.log(`\n  Warning: ${report.summary.totalUnmapped} unmapped Supabase UUIDs found:`);
    allUnmapped.forEach((id) => console.log(`    - ${id}`));
  }

  console.log(`\n  Report saved to: ${reportPath}`);
  console.log("========================================\n");

  if (isDryRun) {
    console.log("DRY RUN COMPLETE - No changes were made.");
    console.log("To run the actual migration, run without --dry-run flag.\n");
  }
}

// Run the migration
runMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
