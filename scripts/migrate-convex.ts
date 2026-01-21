/**
 * Data migration script: Supabase to Convex
 *
 * This script fetches all data from Supabase and migrates it to Convex
 * for performance benchmarking. It respects foreign key dependencies and
 * processes data in batches to avoid payload size limits.
 *
 * Usage:
 *   tsx scripts/migrate-convex.ts
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../convex/_generated/dataModel";

// Type helpers for migration mappings
interface Mapping {
  supabaseId: string;
  convexId: string;
}

// ============================================================================
// Supabase Client Setup
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Convex Client Setup
// ============================================================================

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_CONVEX_URL");
}

const convex = new ConvexHttpClient(convexUrl);

// ============================================================================
// Timestamp Conversion Helper
// ============================================================================

function toTimestamp(dateStr: string | null | undefined): number {
  if (!dateStr) return Date.now();
  return new Date(dateStr).getTime();
}

// ============================================================================
// Batch Processing Helper
// ============================================================================

const BATCH_SIZE = 100;

async function processBatch<T, R>(
  items: T[],
  processFn: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await processFn(batch);
    results.push(...batchResults);
    console.log(
      `  Processed batch ${Math.floor(i / BATCH_SIZE) + 1}: ${
        Math.min(i + BATCH_SIZE, items.length)
      }/${items.length}`
    );
  }
  return results;
}

// ============================================================================
// Migrate Workspaces
// ============================================================================

async function migrateWorkspaces(): Promise<Mapping[]> {
  console.log("Fetching workspaces from Supabase...");

  const { data, error } = await supabase.from("workspaces").select("*");
  if (error) throw new Error(`Failed to fetch workspaces: ${error.message}`);

  console.log(`Found ${data.length} workspaces`);

  const workspaces = data.map((ws) => ({
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    owner_id: ws.owner_id,
    kapso_phone_id: ws.kapso_phone_id,
    settings: ws.settings,
    created_at: toTimestamp(ws.created_at),
    updated_at: toTimestamp(ws.updated_at),
  }));

  console.log("Migrating workspaces to Convex...");
  const results = await convex.mutation("migrate/migrateWorkspaces", {
    workspaces,
  });

  console.log(`Migrated ${results.length} workspaces\n`);
  return results;
}

// ============================================================================
// Migrate Workspace Members
// ============================================================================

async function migrateWorkspaceMembers(
  workspaceMapping: Map<string, string>
): Promise<Mapping[]> {
  console.log("Fetching workspace members from Supabase...");

  const { data, error } = await supabase
    .from("workspace_members")
    .select("*");
  if (error) throw new Error(`Failed to fetch workspace members: ${error.message}`);

  console.log(`Found ${data.length} workspace members`);

  const members = data
    .map((member) => {
      const convexWorkspaceId = workspaceMapping.get(member.workspace_id);
      if (!convexWorkspaceId) {
        console.warn(
          `Skipping workspace member ${member.id}: workspace ${member.workspace_id} not found in mapping`
        );
        return null;
      }
      return {
        id: member.id,
        workspace_id: convexWorkspaceId,
        user_id: member.user_id,
        role: member.role,
        created_at: toTimestamp(member.created_at),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  console.log("Migrating workspace members to Convex...");
  const results = await processBatch(members, async (batch) => {
    return await convex.mutation("migrate/migrateWorkspaceMembers", {
      members: batch,
    });
  });

  console.log(`Migrated ${results.length} workspace members\n`);
  return results;
}

// ============================================================================
// Migrate Contacts
// ============================================================================

async function migrateContacts(
  workspaceMapping: Map<string, string>
): Promise<Mapping[]> {
  console.log("Fetching contacts from Supabase...");

  const { data, error } = await supabase.from("contacts").select("*");
  if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);

  console.log(`Found ${data.length} contacts`);

  const contacts = data
    .map((contact) => {
      const convexWorkspaceId = workspaceMapping.get(contact.workspace_id);
      if (!convexWorkspaceId) {
        console.warn(
          `Skipping contact ${contact.id}: workspace ${contact.workspace_id} not found in mapping`
        );
        return null;
      }
      return {
        id: contact.id,
        workspace_id: convexWorkspaceId,
        phone: contact.phone,
        name: contact.name,
        email: contact.email,
        lead_score: contact.lead_score,
        lead_status: contact.lead_status,
        tags: contact.tags,
        metadata: contact.metadata,
        created_at: toTimestamp(contact.created_at),
        updated_at: toTimestamp(contact.updated_at),
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  console.log("Migrating contacts to Convex...");
  const results = await processBatch(contacts, async (batch) => {
    return await convex.mutation("migrate/migrateContacts", {
      contacts: batch,
    });
  });

  console.log(`Migrated ${results.length} contacts\n`);
  return results;
}

// ============================================================================
// Migrate Conversations
// ============================================================================

async function migrateConversations(
  workspaceMapping: Map<string, string>,
  contactMapping: Map<string, string>
): Promise<Mapping[]> {
  console.log("Fetching conversations from Supabase...");

  const { data, error } = await supabase.from("conversations").select("*");
  if (error) throw new Error(`Failed to fetch conversations: ${error.message}`);

  console.log(`Found ${data.length} conversations`);

  const conversations = data
    .map((conv) => {
      const convexWorkspaceId = workspaceMapping.get(conv.workspace_id);
      const convexContactId = contactMapping.get(conv.contact_id);
      if (!convexWorkspaceId) {
        console.warn(
          `Skipping conversation ${conv.id}: workspace ${conv.workspace_id} not found in mapping`
        );
        return null;
      }
      if (!convexContactId) {
        console.warn(
          `Skipping conversation ${conv.id}: contact ${conv.contact_id} not found in mapping`
        );
        return null;
      }
      return {
        id: conv.id,
        workspace_id: convexWorkspaceId,
        contact_id: convexContactId,
        status: conv.status,
        assigned_to: conv.assigned_to,
        unread_count: conv.unread_count,
        last_message_at: conv.last_message_at
          ? toTimestamp(conv.last_message_at)
          : undefined,
        last_message_preview: conv.last_message_preview,
        created_at: toTimestamp(conv.created_at),
        updated_at: toTimestamp(conv.updated_at),
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  console.log("Migrating conversations to Convex...");
  const results = await processBatch(conversations, async (batch) => {
    return await convex.mutation("migrate/migrateConversations", {
      conversations: batch,
    });
  });

  console.log(`Migrated ${results.length} conversations\n`);
  return results;
}

// ============================================================================
// Migrate Messages
// ============================================================================

async function migrateMessages(
  workspaceMapping: Map<string, string>,
  conversationMapping: Map<string, string>
): Promise<Mapping[]> {
  console.log("Fetching messages from Supabase...");

  const { data, error } = await supabase.from("messages").select("*");
  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);

  console.log(`Found ${data.length} messages`);

  const messages = data
    .map((msg) => {
      const convexWorkspaceId = workspaceMapping.get(msg.workspace_id);
      const convexConversationId = conversationMapping.get(msg.conversation_id);
      if (!convexWorkspaceId) {
        console.warn(
          `Skipping message ${msg.id}: workspace ${msg.workspace_id} not found in mapping`
        );
        return null;
      }
      if (!convexConversationId) {
        console.warn(
          `Skipping message ${msg.id}: conversation ${msg.conversation_id} not found in mapping`
        );
        return null;
      }
      return {
        id: msg.id,
        conversation_id: convexConversationId,
        workspace_id: convexWorkspaceId,
        direction: msg.direction,
        sender_type: msg.sender_type,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type,
        media_url: msg.media_url,
        kapso_message_id: msg.kapso_message_id,
        metadata: msg.metadata,
        created_at: toTimestamp(msg.created_at),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  console.log("Migrating messages to Convex...");
  const results = await processBatch(messages, async (batch) => {
    return await convex.mutation("migrate/migrateMessages", {
      messages: batch,
    });
  });

  console.log(`Migrated ${results.length} messages\n`);
  return results;
}

// ============================================================================
// Migrate Contact Notes
// ============================================================================

async function migrateContactNotes(
  workspaceMapping: Map<string, string>,
  contactMapping: Map<string, string>
): Promise<Mapping[]> {
  console.log("Fetching contact notes from Supabase...");

  const { data, error } = await supabase.from("contact_notes").select("*");
  if (error) throw new Error(`Failed to fetch contact notes: ${error.message}`);

  console.log(`Found ${data.length} contact notes`);

  const notes = data
    .map((note) => {
      const convexWorkspaceId = workspaceMapping.get(note.workspace_id);
      const convexContactId = contactMapping.get(note.contact_id);
      if (!convexWorkspaceId) {
        console.warn(
          `Skipping note ${note.id}: workspace ${note.workspace_id} not found in mapping`
        );
        return null;
      }
      if (!convexContactId) {
        console.warn(
          `Skipping note ${note.id}: contact ${note.contact_id} not found in mapping`
        );
        return null;
      }
      return {
        id: note.id,
        workspace_id: convexWorkspaceId,
        contact_id: convexContactId,
        user_id: note.user_id,
        content: note.content,
        created_at: toTimestamp(note.created_at),
      };
    })
    .filter((n): n is NonNullable<typeof n> => n !== null);

  console.log("Migrating contact notes to Convex...");
  const results = await processBatch(notes, async (batch) => {
    return await convex.mutation("migrate/migrateContactNotes", {
      notes: batch,
    });
  });

  console.log(`Migrated ${results.length} contact notes\n`);
  return results;
}

// ============================================================================
// Main Migration Orchestration
// ============================================================================

interface MigrationResult {
  workspaces: Mapping[];
  workspaceMembers: Mapping[];
  contacts: Mapping[];
  conversations: Mapping[];
  messages: Mapping[];
  contactNotes: Mapping[];
  skipped: number;
}

export async function runMigration(): Promise<MigrationResult> {
  const startTime = Date.now();
  let skipped = 0;

  console.log("========================================");
  console.log("Starting Supabase to Convex Migration");
  console.log("========================================\n");

  // Step 1: Migrate workspaces (no dependencies)
  const workspaces = await migrateWorkspaces();
  const workspaceMapping = new Map(workspaces.map((m) => [m.supabaseId, m.convexId]));

  // Step 2: Migrate workspace members (depends on workspaces)
  const workspaceMembers = await migrateWorkspaceMembers(workspaceMapping);

  // Step 3: Migrate contacts (depends on workspaces)
  const contacts = await migrateContacts(workspaceMapping);
  const contactMapping = new Map(contacts.map((m) => [m.supabaseId, m.convexId]));

  // Step 4: Migrate conversations (depends on workspaces + contacts)
  const conversations = await migrateConversations(
    workspaceMapping,
    contactMapping
  );

  // Step 5: Migrate messages (depends on workspaces + conversations)
  const conversationMapping = new Map(
    conversations.map((m) => [m.supabaseId, m.convexId])
  );
  const messages = await migrateMessages(workspaceMapping, conversationMapping);

  // Step 6: Migrate contact notes (depends on workspaces + contacts)
  const contactNotes = await migrateContactNotes(
    workspaceMapping,
    contactMapping
  );

  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log("========================================");
  console.log("Migration Complete!");
  console.log("========================================");
  console.log(`Workspaces:      ${workspaces.length}`);
  console.log(`Workspace Members: ${workspaceMembers.length}`);
  console.log(`Contacts:        ${contacts.length}`);
  console.log(`Conversations:   ${conversations.length}`);
  console.log(`Messages:        ${messages.length}`);
  console.log(`Contact Notes:   ${contactNotes.length}`);
  console.log(`Skipped records: ${skipped}`);
  console.log(`Duration:        ${duration}s`);
  console.log("========================================\n");

  return {
    workspaces,
    workspaceMembers,
    contacts,
    conversations,
    messages,
    contactNotes,
    skipped,
  };
}

// Run migration if executed directly
if (require.main === module) {
  runMigration().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}
