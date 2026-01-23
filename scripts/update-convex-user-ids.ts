/**
 * User ID Update Script: Supabase UUIDs to Clerk IDs in Convex
 *
 * This script updates user ID fields in Convex core tables to use Clerk IDs
 * instead of Supabase UUIDs, using the mapping from user-id-mapping.json.
 *
 * Core Tables Updated:
 * - workspaces.owner_id
 * - workspaceMembers.user_id
 * - contacts.assigned_to (optional field - skip null values)
 * - conversations.assigned_to (optional field - skip null values)
 * - messages.sender_id (optional field - skip null values)
 * - contactNotes.user_id
 *
 * Usage:
 *   npx tsx scripts/update-convex-user-ids.ts           # Full migration
 *   npx tsx scripts/update-convex-user-ids.ts --dry-run # Preview only
 *
 * Requirements:
 *   - CONVEX_DEPLOYMENT in .env.local
 *   - .planning/migrations/user-id-mapping.json must exist
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { Id } from "../convex/_generated/dataModel";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

// Configuration
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// Types
interface UserIdMapping {
  [supabaseId: string]: string; // supabaseId -> clerkId
}

interface TableUpdateResult {
  table: string;
  field: string;
  total: number;
  updated: number;
  skipped: number;
  noMapping: number;
  alreadyClerk: number;
}

interface MigrationReport {
  timestamp: string;
  dryRun: boolean;
  mapping: {
    supabaseIds: number;
    clerkIds: number;
  };
  tables: TableUpdateResult[];
  summary: {
    totalRecords: number;
    totalUpdated: number;
    totalSkipped: number;
    totalNoMapping: number;
    totalAlreadyClerk: number;
  };
}

// Parse command line arguments
const isDryRun = process.argv.includes("--dry-run");

// Validate environment
function validateEnvironment(): void {
  if (!CONVEX_URL) {
    console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
    process.exit(1);
  }
}

// Load user ID mapping
function loadUserIdMapping(): UserIdMapping {
  const mappingPath = ".planning/migrations/user-id-mapping.json";

  if (!existsSync(mappingPath)) {
    console.error(`Mapping file not found: ${mappingPath}`);
    console.error("Run 04-01 plan first to generate user-id-mapping.json");
    process.exit(1);
  }

  const content = readFileSync(mappingPath, "utf-8");
  return JSON.parse(content);
}

// Check if a value is a Supabase UUID (vs Clerk ID which starts with user_)
function isSupabaseUUID(value: string | null | undefined): boolean {
  if (!value) return false;
  // Supabase UUIDs are in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}

// Check if a value is already a Clerk ID
function isClerkId(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith("user_");
}

// Main migration function
async function runMigration(): Promise<void> {
  console.log("\n========================================");
  console.log("  Convex User ID Migration (Core Tables)");
  console.log("========================================\n");

  if (isDryRun) {
    console.log("DRY RUN MODE - No changes will be made\n");
  }

  validateEnvironment();

  // Initialize Convex client
  const client = new ConvexHttpClient(CONVEX_URL!);

  // Load mapping
  const mapping = loadUserIdMapping();
  const supabaseIds = Object.keys(mapping);
  console.log(`Loaded mapping: ${supabaseIds.length} Supabase UUIDs -> Clerk IDs\n`);

  // Display mapping
  console.log("User ID Mapping:");
  console.log("-".repeat(80));
  for (const [supabaseId, clerkId] of Object.entries(mapping)) {
    console.log(`  ${supabaseId} -> ${clerkId}`);
  }
  console.log("-".repeat(80));
  console.log();

  const results: TableUpdateResult[] = [];

  // ============================================
  // 1. Workspaces (owner_id)
  // ============================================
  console.log("Processing: workspaces.owner_id");
  const workspaces = await client.query(api.migrate.listWorkspaces, {});
  console.log(`  Found ${workspaces.length} workspaces`);

  const workspaceUpdates: { recordId: Id<"workspaces">; newOwnerId: string }[] = [];
  let wsSkipped = 0;
  let wsNoMapping = 0;
  let wsAlreadyClerk = 0;

  for (const ws of workspaces) {
    if (isClerkId(ws.owner_id)) {
      wsAlreadyClerk++;
      continue;
    }
    if (!isSupabaseUUID(ws.owner_id)) {
      wsSkipped++;
      continue;
    }
    const clerkId = mapping[ws.owner_id];
    if (!clerkId) {
      wsNoMapping++;
      console.log(`    [NO MAPPING] ${ws.name}: owner_id ${ws.owner_id}`);
      continue;
    }
    workspaceUpdates.push({ recordId: ws._id, newOwnerId: clerkId });
  }

  console.log(`  To update: ${workspaceUpdates.length}, Already Clerk: ${wsAlreadyClerk}, No mapping: ${wsNoMapping}`);

  if (!isDryRun && workspaceUpdates.length > 0) {
    const result = await client.mutation(api.migrate.updateWorkspaceOwnerIds, {
      updates: workspaceUpdates,
    });
    console.log(`  Updated: ${result.updated}`);
  }

  results.push({
    table: "workspaces",
    field: "owner_id",
    total: workspaces.length,
    updated: isDryRun ? 0 : workspaceUpdates.length,
    skipped: wsSkipped,
    noMapping: wsNoMapping,
    alreadyClerk: wsAlreadyClerk,
  });

  // ============================================
  // 2. Workspace Members (user_id)
  // ============================================
  console.log("\nProcessing: workspaceMembers.user_id");
  const members = await client.query(api.migrate.listWorkspaceMembers, {});
  console.log(`  Found ${members.length} workspace members`);

  const memberUpdates: { recordId: Id<"workspaceMembers">; newUserId: string }[] = [];
  let memSkipped = 0;
  let memNoMapping = 0;
  let memAlreadyClerk = 0;

  for (const member of members) {
    if (isClerkId(member.user_id)) {
      memAlreadyClerk++;
      continue;
    }
    if (!isSupabaseUUID(member.user_id)) {
      memSkipped++;
      continue;
    }
    const clerkId = mapping[member.user_id];
    if (!clerkId) {
      memNoMapping++;
      console.log(`    [NO MAPPING] member: user_id ${member.user_id}`);
      continue;
    }
    memberUpdates.push({ recordId: member._id, newUserId: clerkId });
  }

  console.log(`  To update: ${memberUpdates.length}, Already Clerk: ${memAlreadyClerk}, No mapping: ${memNoMapping}`);

  if (!isDryRun && memberUpdates.length > 0) {
    const result = await client.mutation(api.migrate.updateWorkspaceMemberUserIds, {
      updates: memberUpdates,
    });
    console.log(`  Updated: ${result.updated}`);
  }

  results.push({
    table: "workspaceMembers",
    field: "user_id",
    total: members.length,
    updated: isDryRun ? 0 : memberUpdates.length,
    skipped: memSkipped,
    noMapping: memNoMapping,
    alreadyClerk: memAlreadyClerk,
  });

  // ============================================
  // 3. Contacts (assigned_to - optional)
  // ============================================
  console.log("\nProcessing: contacts.assigned_to");
  const contacts = await client.query(api.migrate.listContacts, {});
  console.log(`  Found ${contacts.length} contacts`);

  const contactUpdates: { recordId: Id<"contacts">; newAssignedTo: string }[] = [];
  let ctSkipped = 0;
  let ctNoMapping = 0;
  let ctAlreadyClerk = 0;
  let ctNull = 0;

  for (const contact of contacts) {
    if (!contact.assigned_to) {
      ctNull++;
      continue;
    }
    if (isClerkId(contact.assigned_to)) {
      ctAlreadyClerk++;
      continue;
    }
    if (!isSupabaseUUID(contact.assigned_to)) {
      ctSkipped++;
      continue;
    }
    const clerkId = mapping[contact.assigned_to];
    if (!clerkId) {
      ctNoMapping++;
      continue;
    }
    contactUpdates.push({ recordId: contact._id, newAssignedTo: clerkId });
  }

  console.log(`  To update: ${contactUpdates.length}, Already Clerk: ${ctAlreadyClerk}, Null: ${ctNull}, No mapping: ${ctNoMapping}`);

  if (!isDryRun && contactUpdates.length > 0) {
    const result = await client.mutation(api.migrate.updateContactAssignedTo, {
      updates: contactUpdates,
    });
    console.log(`  Updated: ${result.updated}`);
  }

  results.push({
    table: "contacts",
    field: "assigned_to",
    total: contacts.length,
    updated: isDryRun ? 0 : contactUpdates.length,
    skipped: ctSkipped + ctNull,
    noMapping: ctNoMapping,
    alreadyClerk: ctAlreadyClerk,
  });

  // ============================================
  // 4. Conversations (assigned_to - optional)
  // ============================================
  console.log("\nProcessing: conversations.assigned_to");
  const conversations = await client.query(api.migrate.listConversations, {});
  console.log(`  Found ${conversations.length} conversations`);

  const convUpdates: { recordId: Id<"conversations">; newAssignedTo: string }[] = [];
  let cvSkipped = 0;
  let cvNoMapping = 0;
  let cvAlreadyClerk = 0;
  let cvNull = 0;

  for (const conv of conversations) {
    if (!conv.assigned_to) {
      cvNull++;
      continue;
    }
    if (isClerkId(conv.assigned_to)) {
      cvAlreadyClerk++;
      continue;
    }
    if (!isSupabaseUUID(conv.assigned_to)) {
      cvSkipped++;
      continue;
    }
    const clerkId = mapping[conv.assigned_to];
    if (!clerkId) {
      cvNoMapping++;
      continue;
    }
    convUpdates.push({ recordId: conv._id, newAssignedTo: clerkId });
  }

  console.log(`  To update: ${convUpdates.length}, Already Clerk: ${cvAlreadyClerk}, Null: ${cvNull}, No mapping: ${cvNoMapping}`);

  if (!isDryRun && convUpdates.length > 0) {
    const result = await client.mutation(api.migrate.updateConversationAssignedTo, {
      updates: convUpdates,
    });
    console.log(`  Updated: ${result.updated}`);
  }

  results.push({
    table: "conversations",
    field: "assigned_to",
    total: conversations.length,
    updated: isDryRun ? 0 : convUpdates.length,
    skipped: cvSkipped + cvNull,
    noMapping: cvNoMapping,
    alreadyClerk: cvAlreadyClerk,
  });

  // ============================================
  // 5. Messages (sender_id - optional)
  // ============================================
  console.log("\nProcessing: messages.sender_id");
  const messages = await client.query(api.migrate.listMessages, {});
  console.log(`  Found ${messages.length} messages`);

  const msgUpdates: { recordId: Id<"messages">; newSenderId: string }[] = [];
  let msgSkipped = 0;
  let msgNoMapping = 0;
  let msgAlreadyClerk = 0;
  let msgNull = 0;

  for (const msg of messages) {
    // Only update messages sent by users (not contacts/bots)
    if (msg.sender_type !== "user") {
      msgSkipped++;
      continue;
    }
    if (!msg.sender_id) {
      msgNull++;
      continue;
    }
    if (isClerkId(msg.sender_id)) {
      msgAlreadyClerk++;
      continue;
    }
    if (!isSupabaseUUID(msg.sender_id)) {
      msgSkipped++;
      continue;
    }
    const clerkId = mapping[msg.sender_id];
    if (!clerkId) {
      msgNoMapping++;
      continue;
    }
    msgUpdates.push({ recordId: msg._id, newSenderId: clerkId });
  }

  console.log(`  To update: ${msgUpdates.length}, Already Clerk: ${msgAlreadyClerk}, Non-user/Null: ${msgSkipped + msgNull}, No mapping: ${msgNoMapping}`);

  if (!isDryRun && msgUpdates.length > 0) {
    // Batch updates in chunks of 100 to avoid payload limits
    const batchSize = 100;
    let totalUpdated = 0;
    for (let i = 0; i < msgUpdates.length; i += batchSize) {
      const batch = msgUpdates.slice(i, i + batchSize);
      const result = await client.mutation(api.migrate.updateMessageSenderId, {
        updates: batch,
      });
      totalUpdated += result.updated;
    }
    console.log(`  Updated: ${totalUpdated}`);
  }

  results.push({
    table: "messages",
    field: "sender_id",
    total: messages.length,
    updated: isDryRun ? 0 : msgUpdates.length,
    skipped: msgSkipped + msgNull,
    noMapping: msgNoMapping,
    alreadyClerk: msgAlreadyClerk,
  });

  // ============================================
  // 6. Contact Notes (user_id)
  // ============================================
  console.log("\nProcessing: contactNotes.user_id");
  const notes = await client.query(api.migrate.listContactNotes, {});
  console.log(`  Found ${notes.length} contact notes`);

  const noteUpdates: { recordId: Id<"contactNotes">; newUserId: string }[] = [];
  let noteSkipped = 0;
  let noteNoMapping = 0;
  let noteAlreadyClerk = 0;

  for (const note of notes) {
    if (isClerkId(note.user_id)) {
      noteAlreadyClerk++;
      continue;
    }
    if (!isSupabaseUUID(note.user_id)) {
      noteSkipped++;
      continue;
    }
    const clerkId = mapping[note.user_id];
    if (!clerkId) {
      noteNoMapping++;
      continue;
    }
    noteUpdates.push({ recordId: note._id, newUserId: clerkId });
  }

  console.log(`  To update: ${noteUpdates.length}, Already Clerk: ${noteAlreadyClerk}, No mapping: ${noteNoMapping}`);

  if (!isDryRun && noteUpdates.length > 0) {
    const result = await client.mutation(api.migrate.updateContactNoteUserIds, {
      updates: noteUpdates,
    });
    console.log(`  Updated: ${result.updated}`);
  }

  results.push({
    table: "contactNotes",
    field: "user_id",
    total: notes.length,
    updated: isDryRun ? 0 : noteUpdates.length,
    skipped: noteSkipped,
    noMapping: noteNoMapping,
    alreadyClerk: noteAlreadyClerk,
  });

  // ============================================
  // Generate Report
  // ============================================
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    dryRun: isDryRun,
    mapping: {
      supabaseIds: supabaseIds.length,
      clerkIds: Object.values(mapping).length,
    },
    tables: results,
    summary: {
      totalRecords: results.reduce((sum, r) => sum + r.total, 0),
      totalUpdated: results.reduce((sum, r) => sum + r.updated, 0),
      totalSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
      totalNoMapping: results.reduce((sum, r) => sum + r.noMapping, 0),
      totalAlreadyClerk: results.reduce((sum, r) => sum + r.alreadyClerk, 0),
    },
  };

  // Save report
  const reportPath = ".planning/migrations/user-id-update-report-core.json";
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Summary
  console.log("\n========================================");
  console.log("  Migration Summary");
  console.log("========================================");
  console.log("\nPer-table results:");
  console.log("-".repeat(80));
  for (const r of results) {
    console.log(`  ${r.table}.${r.field}:`);
    console.log(`    Total: ${r.total}, Updated: ${r.updated}, Already Clerk: ${r.alreadyClerk}, No mapping: ${r.noMapping}`);
  }
  console.log("-".repeat(80));
  console.log(`\n  Total records: ${report.summary.totalRecords}`);
  console.log(`  Total updated: ${report.summary.totalUpdated}`);
  console.log(`  Already Clerk IDs: ${report.summary.totalAlreadyClerk}`);
  console.log(`  No mapping found: ${report.summary.totalNoMapping}`);
  console.log(`  Skipped (null/other): ${report.summary.totalSkipped}`);
  console.log(`\n  Report saved to: ${reportPath}`);

  if (isDryRun) {
    console.log("\nDRY RUN COMPLETE - No records were updated.");
    console.log("To run the actual migration, run without --dry-run flag.");
  }

  console.log("\n========================================\n");
}

// Run the migration
runMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
