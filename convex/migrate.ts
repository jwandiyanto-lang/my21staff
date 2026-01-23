/**
 * Migration mutations for copying Supabase data to Convex.
 *
 * These mutations are designed to be called by the migration script
 * (scripts/migrate-convex.ts) to populate Convex with data from
 * Supabase for performance benchmarking.
 *
 * All mutations store the original Supabase UUID in a supabaseId field
 * for reference and potential dual-write implementation later.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migrate workspaces from Supabase to Convex.
 *
 * @param workspaces - Array of workspace objects from Supabase
 * @returns Array of { supabaseId, convexId } mappings
 */
export const migrateWorkspaces = mutation({
  args: {
    workspaces: v.array(
      v.object({
        id: v.string(), // Supabase UUID
        name: v.string(),
        slug: v.string(),
        owner_id: v.string(),
        kapso_phone_id: v.optional(v.string()),
        settings: v.optional(v.any()),
        created_at: v.number(),
        updated_at: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const ws of args.workspaces) {
      const id = await ctx.db.insert("workspaces", {
        name: ws.name,
        slug: ws.slug,
        owner_id: ws.owner_id,
        kapso_phone_id: ws.kapso_phone_id,
        settings: ws.settings,
        created_at: ws.created_at,
        updated_at: ws.updated_at,
      });
      results.push({ supabaseId: ws.id, convexId: id });
    }
    return results;
  },
});

/**
 * Migrate workspace members from Supabase to Convex.
 *
 * Note: workspace_id in args is the Convex ID (not Supabase UUID)
 * after it has been mapped by the migration script.
 *
 * @param members - Array of workspace member objects
 * @returns Array of { supabaseId, convexId } mappings
 */
export const migrateWorkspaceMembers = mutation({
  args: {
    members: v.array(
      v.object({
        id: v.string(), // Supabase UUID (for reference)
        workspace_id: v.id("workspaces"), // Convex workspace ID
        user_id: v.string(), // Supabase user UUID
        role: v.string(),
        created_at: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const member of args.members) {
      const id = await ctx.db.insert("workspaceMembers", {
        workspace_id: member.workspace_id,
        user_id: member.user_id,
        role: member.role,
        created_at: member.created_at,
      });
      results.push({ supabaseId: member.id, convexId: id });
    }
    return results;
  },
});

/**
 * Migrate contacts from Supabase to Convex.
 *
 * Note: workspace_id in args is the Convex ID (not Supabase UUID)
 * after it has been mapped by the migration script.
 *
 * @param contacts - Array of contact objects
 * @returns Array of { supabaseId, convexId } mappings
 */
export const migrateContacts = mutation({
  args: {
    contacts: v.array(
      v.object({
        id: v.string(), // Supabase UUID
        workspace_id: v.id("workspaces"), // Convex workspace ID
        phone: v.string(),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        lead_score: v.number(),
        lead_status: v.string(),
        tags: v.optional(v.array(v.string())),
        metadata: v.optional(v.any()),
        created_at: v.number(),
        updated_at: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const contact of args.contacts) {
      const id = await ctx.db.insert("contacts", {
        workspace_id: contact.workspace_id,
        phone: contact.phone,
        name: contact.name,
        email: contact.email,
        lead_score: contact.lead_score,
        lead_status: contact.lead_status,
        tags: contact.tags,
        metadata: contact.metadata,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
        supabaseId: contact.id,
      });
      results.push({ supabaseId: contact.id, convexId: id });
    }
    return results;
  },
});

/**
 * Migrate conversations from Supabase to Convex.
 *
 * Note: workspace_id and contact_id in args are Convex IDs
 * after they have been mapped by the migration script.
 *
 * @param conversations - Array of conversation objects
 * @returns Array of { supabaseId, convexId } mappings
 */
export const migrateConversations = mutation({
  args: {
    conversations: v.array(
      v.object({
        id: v.string(), // Supabase UUID
        workspace_id: v.id("workspaces"), // Convex workspace ID
        contact_id: v.id("contacts"), // Convex contact ID
        status: v.string(),
        assigned_to: v.optional(v.string()), // Supabase user UUID
        unread_count: v.number(),
        last_message_at: v.optional(v.number()),
        last_message_preview: v.optional(v.string()),
        created_at: v.number(),
        updated_at: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const conv of args.conversations) {
      const id = await ctx.db.insert("conversations", {
        workspace_id: conv.workspace_id,
        contact_id: conv.contact_id,
        status: conv.status,
        assigned_to: conv.assigned_to,
        unread_count: conv.unread_count,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        supabaseId: conv.id,
      });
      results.push({ supabaseId: conv.id, convexId: id });
    }
    return results;
  },
});

/**
 * Migrate messages from Supabase to Convex.
 *
 * Note: conversation_id and workspace_id in args are Convex IDs
 * after they have been mapped by the migration script.
 *
 * @param messages - Array of message objects
 * @returns Array of { supabaseId, convexId } mappings
 */
export const migrateMessages = mutation({
  args: {
    messages: v.array(
      v.object({
        id: v.string(), // Supabase UUID
        conversation_id: v.id("conversations"), // Convex conversation ID
        workspace_id: v.id("workspaces"), // Convex workspace ID
        direction: v.string(),
        sender_type: v.string(),
        sender_id: v.optional(v.string()), // Supabase user UUID
        content: v.optional(v.string()),
        message_type: v.string(),
        media_url: v.optional(v.string()),
        kapso_message_id: v.optional(v.string()),
        metadata: v.optional(v.any()),
        created_at: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const msg of args.messages) {
      const id = await ctx.db.insert("messages", {
        conversation_id: msg.conversation_id,
        workspace_id: msg.workspace_id,
        direction: msg.direction,
        sender_type: msg.sender_type,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type,
        media_url: msg.media_url,
        kapso_message_id: msg.kapso_message_id,
        metadata: msg.metadata,
        created_at: msg.created_at,
        supabaseId: msg.id,
      });
      results.push({ supabaseId: msg.id, convexId: id });
    }
    return results;
  },
});

/**
 * Migrate contact notes from Supabase to Convex.
 *
 * Note: workspace_id and contact_id in args are Convex IDs
 * after they have been mapped by the migration script.
 *
 * @param notes - Array of contact note objects
 * @returns Array of { supabaseId, convexId } mappings
 */
export const migrateContactNotes = mutation({
  args: {
    notes: v.array(
      v.object({
        id: v.string(), // Supabase UUID
        workspace_id: v.id("workspaces"), // Convex workspace ID
        contact_id: v.id("contacts"), // Convex contact ID
        user_id: v.string(), // Supabase user UUID
        content: v.string(),
        created_at: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const note of args.notes) {
      const id = await ctx.db.insert("contactNotes", {
        workspace_id: note.workspace_id,
        contact_id: note.contact_id,
        user_id: note.user_id,
        content: note.content,
        created_at: note.created_at,
        supabaseId: note.id,
      });
      results.push({ supabaseId: note.id, convexId: id });
    }
    return results;
  },
});

// ============================================
// CORE TABLE USER ID MIGRATION QUERIES
// List records for user ID migration
// ============================================

/**
 * List all workspaces for user ID migration.
 * Returns workspaces with their current owner_id field.
 */
export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    return workspaces.map((w) => ({
      _id: w._id,
      name: w.name,
      owner_id: w.owner_id,
    }));
  },
});

/**
 * List all workspace members for user ID migration.
 * Returns members with their current user_id field.
 */
export const listWorkspaceMembers = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("workspaceMembers").collect();
    return members.map((m) => ({
      _id: m._id,
      workspace_id: m.workspace_id,
      user_id: m.user_id,
      role: m.role,
    }));
  },
});

/**
 * List all contacts for user ID migration.
 * Returns contacts with their current assigned_to field.
 */
export const listContacts = query({
  args: {},
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();
    return contacts.map((c) => ({
      _id: c._id,
      workspace_id: c.workspace_id,
      assigned_to: c.assigned_to,
    }));
  },
});

/**
 * List all conversations for user ID migration.
 * Returns conversations with their current assigned_to field.
 */
export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db.query("conversations").collect();
    return conversations.map((c) => ({
      _id: c._id,
      workspace_id: c.workspace_id,
      assigned_to: c.assigned_to,
    }));
  },
});

/**
 * List all messages for user ID migration.
 * Returns messages with their current sender_id field.
 */
export const listMessages = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    return messages.map((m) => ({
      _id: m._id,
      workspace_id: m.workspace_id,
      sender_id: m.sender_id,
      sender_type: m.sender_type,
    }));
  },
});

/**
 * List all contact notes for user ID migration.
 * Returns notes with their current user_id field.
 */
export const listContactNotes = query({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db.query("contactNotes").collect();
    return notes.map((n) => ({
      _id: n._id,
      workspace_id: n.workspace_id,
      user_id: n.user_id,
    }));
  },
});

// ============================================
// CORE TABLE USER ID MIGRATION MUTATIONS
// Update user IDs from Supabase UUIDs to Clerk IDs
// ============================================

/**
 * Update owner_id in workspaces table.
 * @param updates - Array of { recordId, newOwnerId } to update
 */
export const updateWorkspaceOwnerIds = mutation({
  args: {
    updates: v.array(
      v.object({
        recordId: v.id("workspaces"),
        newOwnerId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const workspace = await ctx.db.get(update.recordId);
      if (workspace) {
        await ctx.db.patch(update.recordId, { owner_id: update.newOwnerId });
        updated++;
      }
    }
    return { updated };
  },
});

/**
 * Update user_id in workspaceMembers table.
 * @param updates - Array of { recordId, newUserId } to update
 */
export const updateWorkspaceMemberUserIds = mutation({
  args: {
    updates: v.array(
      v.object({
        recordId: v.id("workspaceMembers"),
        newUserId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const member = await ctx.db.get(update.recordId);
      if (member) {
        await ctx.db.patch(update.recordId, { user_id: update.newUserId });
        updated++;
      }
    }
    return { updated };
  },
});

/**
 * Update assigned_to in contacts table.
 * Only updates records where assigned_to has a value.
 * @param updates - Array of { recordId, newAssignedTo } to update
 */
export const updateContactAssignedTo = mutation({
  args: {
    updates: v.array(
      v.object({
        recordId: v.id("contacts"),
        newAssignedTo: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const contact = await ctx.db.get(update.recordId);
      if (contact) {
        await ctx.db.patch(update.recordId, { assigned_to: update.newAssignedTo });
        updated++;
      }
    }
    return { updated };
  },
});

/**
 * Update assigned_to in conversations table.
 * Only updates records where assigned_to has a value.
 * @param updates - Array of { recordId, newAssignedTo } to update
 */
export const updateConversationAssignedTo = mutation({
  args: {
    updates: v.array(
      v.object({
        recordId: v.id("conversations"),
        newAssignedTo: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const conversation = await ctx.db.get(update.recordId);
      if (conversation) {
        await ctx.db.patch(update.recordId, { assigned_to: update.newAssignedTo });
        updated++;
      }
    }
    return { updated };
  },
});

/**
 * Update sender_id in messages table.
 * Only updates records where sender_id has a value.
 * @param updates - Array of { recordId, newSenderId } to update
 */
export const updateMessageSenderId = mutation({
  args: {
    updates: v.array(
      v.object({
        recordId: v.id("messages"),
        newSenderId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const message = await ctx.db.get(update.recordId);
      if (message) {
        await ctx.db.patch(update.recordId, { sender_id: update.newSenderId });
        updated++;
      }
    }
    return { updated };
  },
});

/**
 * Update user_id in contactNotes table.
 * @param updates - Array of { recordId, newUserId } to update
 */
export const updateContactNoteUserIds = mutation({
  args: {
    updates: v.array(
      v.object({
        recordId: v.id("contactNotes"),
        newUserId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const note = await ctx.db.get(update.recordId);
      if (note) {
        await ctx.db.patch(update.recordId, { user_id: update.newUserId });
        updated++;
      }
    }
    return { updated };
  },
});

// ============================================
// TICKET USER ID MIGRATION
// ============================================

/**
 * List all tickets for user ID migration.
 * Returns tickets with their current requester_id and assigned_to fields.
 */
export const listTickets = query({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").collect();
    return tickets.map((t) => ({
      _id: t._id,
      requester_id: t.requester_id,
      assigned_to: t.assigned_to,
    }));
  },
});

/**
 * List all ticket comments for user ID migration.
 * Returns comments with their current author_id field.
 */
export const listTicketComments = query({
  args: {},
  handler: async (ctx) => {
    const comments = await ctx.db.query("ticketComments").collect();
    return comments.map((c) => ({
      _id: c._id,
      author_id: c.author_id,
    }));
  },
});

/**
 * List all ticket status history entries for user ID migration.
 * Returns history entries with their current changed_by field.
 */
export const listTicketStatusHistory = query({
  args: {},
  handler: async (ctx) => {
    const history = await ctx.db.query("ticketStatusHistory").collect();
    return history.map((h) => ({
      _id: h._id,
      changed_by: h.changed_by,
    }));
  },
});

/**
 * Update ticket user IDs (requester_id and assigned_to) from Supabase UUIDs to Clerk IDs.
 *
 * @param updates - Array of { _id, requester_id, assigned_to } with new Clerk IDs
 * @returns Count of updated tickets
 */
export const updateTicketUserIds = mutation({
  args: {
    updates: v.array(
      v.object({
        _id: v.id("tickets"),
        requester_id: v.string(),
        assigned_to: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const ticket = await ctx.db.get(update._id);
      if (ticket) {
        await ctx.db.patch(update._id, {
          requester_id: update.requester_id,
          assigned_to: update.assigned_to,
        });
        updated++;
      }
    }
    return { updated };
  },
});

/**
 * Update ticket comment author IDs from Supabase UUIDs to Clerk IDs.
 *
 * @param updates - Array of { _id, author_id } with new Clerk IDs
 * @returns Count of updated comments
 */
export const updateTicketCommentAuthorIds = mutation({
  args: {
    updates: v.array(
      v.object({
        _id: v.id("ticketComments"),
        author_id: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const comment = await ctx.db.get(update._id);
      if (comment) {
        await ctx.db.patch(update._id, {
          author_id: update.author_id,
        });
        updated++;
      }
    }
    return { updated };
  },
});

/**
 * Update ticket status history changed_by IDs from Supabase UUIDs to Clerk IDs.
 *
 * @param updates - Array of { _id, changed_by } with new Clerk IDs
 * @returns Count of updated history entries
 */
export const updateTicketStatusHistoryUserIds = mutation({
  args: {
    updates: v.array(
      v.object({
        _id: v.id("ticketStatusHistory"),
        changed_by: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const history = await ctx.db.get(update._id);
      if (history) {
        await ctx.db.patch(update._id, {
          changed_by: update.changed_by,
        });
        updated++;
      }
    }
    return { updated };
  },
});

// ============================================
// BULK DATA MIGRATION MUTATIONS
// One-time data migration from Supabase to Convex
// ============================================

/**
 * Bulk insert ARI destinations from Supabase.
 * @param records - Array of destination records with workspace_slug for lookup
 */
export const bulkInsertAriDestinations = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        country: v.string(),
        city: v.optional(v.string()),
        university_name: v.string(),
        requirements: v.optional(v.any()),
        programs: v.optional(v.array(v.string())),
        is_promoted: v.boolean(),
        priority: v.number(),
        notes: v.optional(v.string()),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }
      await ctx.db.insert("ariDestinations", {
        workspace_id: workspace._id,
        country: record.country,
        city: record.city,
        university_name: record.university_name,
        requirements: record.requirements,
        programs: record.programs,
        is_promoted: record.is_promoted,
        priority: record.priority,
        notes: record.notes,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

/**
 * Bulk insert ARI payments from Supabase.
 * @param records - Array of payment records with conversation lookup data
 */
export const bulkInsertAriPayments = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        contact_phone: v.string(),
        amount: v.number(),
        currency: v.string(),
        payment_method: v.optional(v.string()),
        gateway: v.string(),
        gateway_transaction_id: v.optional(v.string()),
        gateway_response: v.optional(v.any()),
        status: v.string(),
        expires_at: v.optional(v.number()),
        paid_at: v.optional(v.number()),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      // Look up workspace
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      // Look up contact by phone
      const contact = await ctx.db
        .query("contacts")
        .withIndex("by_workspace_phone", (q) =>
          q.eq("workspace_id", workspace._id).eq("phone", record.contact_phone)
        )
        .first();
      if (!contact) {
        skipped++;
        continue;
      }

      // Look up ARI conversation
      const ariConversation = await ctx.db
        .query("ariConversations")
        .withIndex("by_workspace_contact", (q) =>
          q.eq("workspace_id", workspace._id).eq("contact_id", contact._id)
        )
        .first();
      if (!ariConversation) {
        skipped++;
        continue;
      }

      await ctx.db.insert("ariPayments", {
        ari_conversation_id: ariConversation._id,
        workspace_id: workspace._id,
        amount: record.amount,
        currency: record.currency,
        payment_method: record.payment_method,
        gateway: record.gateway,
        gateway_transaction_id: record.gateway_transaction_id,
        gateway_response: record.gateway_response,
        status: record.status,
        expires_at: record.expires_at,
        paid_at: record.paid_at,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

/**
 * Bulk insert ARI appointments from Supabase.
 * @param records - Array of appointment records with conversation lookup data
 */
export const bulkInsertAriAppointments = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        contact_phone: v.string(),
        payment_supabase_id: v.optional(v.string()),
        consultant_id: v.optional(v.string()),
        scheduled_at: v.number(),
        duration_minutes: v.number(),
        meeting_link: v.optional(v.string()),
        status: v.string(),
        reminder_sent_at: v.optional(v.number()),
        notes: v.optional(v.string()),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      // Look up workspace
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      // Look up contact
      const contact = await ctx.db
        .query("contacts")
        .withIndex("by_workspace_phone", (q) =>
          q.eq("workspace_id", workspace._id).eq("phone", record.contact_phone)
        )
        .first();
      if (!contact) {
        skipped++;
        continue;
      }

      // Look up ARI conversation
      const ariConversation = await ctx.db
        .query("ariConversations")
        .withIndex("by_workspace_contact", (q) =>
          q.eq("workspace_id", workspace._id).eq("contact_id", contact._id)
        )
        .first();
      if (!ariConversation) {
        skipped++;
        continue;
      }

      // Note: payment_id lookup would need additional logic - skipping for now
      await ctx.db.insert("ariAppointments", {
        ari_conversation_id: ariConversation._id,
        workspace_id: workspace._id,
        consultant_id: record.consultant_id,
        scheduled_at: record.scheduled_at,
        duration_minutes: record.duration_minutes,
        meeting_link: record.meeting_link,
        status: record.status,
        reminder_sent_at: record.reminder_sent_at,
        notes: record.notes,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

/**
 * Bulk insert ARI AI comparison metrics from Supabase.
 * @param records - Array of comparison records
 */
export const bulkInsertAriAiComparison = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        ai_model: v.string(),
        conversation_count: v.number(),
        avg_response_time_ms: v.optional(v.number()),
        total_tokens_used: v.number(),
        conversion_count: v.number(),
        satisfaction_score: v.optional(v.number()),
        period_start: v.optional(v.number()),
        period_end: v.optional(v.number()),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      await ctx.db.insert("ariAiComparison", {
        workspace_id: workspace._id,
        ai_model: record.ai_model,
        conversation_count: record.conversation_count,
        avg_response_time_ms: record.avg_response_time_ms,
        total_tokens_used: record.total_tokens_used,
        conversion_count: record.conversion_count,
        satisfaction_score: record.satisfaction_score,
        period_start: record.period_start,
        period_end: record.period_end,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

/**
 * Bulk insert ARI flow stages from Supabase.
 * @param records - Array of flow stage records
 */
export const bulkInsertAriFlowStages = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        name: v.string(),
        goal: v.string(),
        sample_script: v.optional(v.string()),
        exit_criteria: v.optional(v.string()),
        stage_order: v.number(),
        is_active: v.boolean(),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      await ctx.db.insert("ariFlowStages", {
        workspace_id: workspace._id,
        name: record.name,
        goal: record.goal,
        sample_script: record.sample_script,
        exit_criteria: record.exit_criteria,
        stage_order: record.stage_order,
        is_active: record.is_active,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

/**
 * Bulk insert ARI knowledge categories from Supabase.
 * @param records - Array of category records
 */
export const bulkInsertAriKnowledgeCategories = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        display_order: v.number(),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    const mapping: Record<string, string> = {}; // supabaseId -> convexId

    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      const id = await ctx.db.insert("ariKnowledgeCategories", {
        workspace_id: workspace._id,
        name: record.name,
        description: record.description,
        display_order: record.display_order,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      mapping[record.supabaseId] = id;
      inserted++;
    }
    return { inserted, skipped, mapping };
  },
});

/**
 * Bulk insert ARI knowledge entries from Supabase.
 * @param records - Array of entry records
 * @param categoryMapping - Map of Supabase category IDs to Convex IDs
 */
export const bulkInsertAriKnowledgeEntries = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        category_supabase_id: v.optional(v.string()),
        title: v.string(),
        content: v.string(),
        is_active: v.boolean(),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
    categoryMapping: v.any(), // Map of supabaseId -> convexId
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      // Look up category ID
      let categoryId = undefined;
      if (record.category_supabase_id && args.categoryMapping[record.category_supabase_id]) {
        categoryId = args.categoryMapping[record.category_supabase_id];
      }

      await ctx.db.insert("ariKnowledgeEntries", {
        workspace_id: workspace._id,
        category_id: categoryId,
        title: record.title,
        content: record.content,
        is_active: record.is_active,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

/**
 * Bulk insert ARI scoring config from Supabase.
 * @param records - Array of config records
 */
export const bulkInsertAriScoringConfig = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        hot_threshold: v.number(),
        warm_threshold: v.number(),
        weight_basic: v.number(),
        weight_qualification: v.number(),
        weight_document: v.number(),
        weight_engagement: v.number(),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      await ctx.db.insert("ariScoringConfig", {
        workspace_id: workspace._id,
        hot_threshold: record.hot_threshold,
        warm_threshold: record.warm_threshold,
        weight_basic: record.weight_basic,
        weight_qualification: record.weight_qualification,
        weight_document: record.weight_document,
        weight_engagement: record.weight_engagement,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

/**
 * Bulk insert consultant slots from Supabase.
 * @param records - Array of slot records
 */
export const bulkInsertConsultantSlots = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        consultant_id: v.optional(v.string()),
        day_of_week: v.number(),
        start_time: v.string(),
        end_time: v.string(),
        duration_minutes: v.number(),
        booking_window_days: v.number(),
        max_bookings_per_slot: v.number(),
        is_active: v.boolean(),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      await ctx.db.insert("consultantSlots", {
        workspace_id: workspace._id,
        consultant_id: record.consultant_id,
        day_of_week: record.day_of_week,
        start_time: record.start_time,
        end_time: record.end_time,
        duration_minutes: record.duration_minutes,
        booking_window_days: record.booking_window_days,
        max_bookings_per_slot: record.max_bookings_per_slot,
        is_active: record.is_active,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

/**
 * Bulk insert articles from Supabase.
 * @param records - Array of article records
 */
export const bulkInsertArticles = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        title: v.string(),
        slug: v.string(),
        excerpt: v.optional(v.string()),
        content: v.optional(v.string()),
        cover_image_url: v.optional(v.string()),
        status: v.string(),
        published_at: v.optional(v.number()),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      await ctx.db.insert("articles", {
        workspace_id: workspace._id,
        title: record.title,
        slug: record.slug,
        excerpt: record.excerpt,
        content: record.content,
        cover_image_url: record.cover_image_url,
        status: record.status,
        published_at: record.published_at,
        created_at: record.created_at,
        updated_at: record.updated_at,
        supabaseId: record.supabaseId,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

/**
 * Bulk insert webinars from Supabase.
 * @param records - Array of webinar records
 */
export const bulkInsertWebinars = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        title: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        cover_image_url: v.optional(v.string()),
        scheduled_at: v.number(),
        duration_minutes: v.number(),
        meeting_url: v.optional(v.string()),
        max_registrations: v.optional(v.number()),
        status: v.string(),
        published_at: v.optional(v.number()),
        created_at: v.number(),
        updated_at: v.number(),
        supabaseId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    const mapping: Record<string, string> = {}; // supabaseId -> convexId

    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      const id = await ctx.db.insert("webinars", {
        workspace_id: workspace._id,
        title: record.title,
        slug: record.slug,
        description: record.description,
        cover_image_url: record.cover_image_url,
        scheduled_at: record.scheduled_at,
        duration_minutes: record.duration_minutes,
        meeting_url: record.meeting_url,
        max_registrations: record.max_registrations,
        status: record.status,
        published_at: record.published_at,
        created_at: record.created_at,
        updated_at: record.updated_at,
        supabaseId: record.supabaseId,
      });
      mapping[record.supabaseId] = id;
      inserted++;
    }
    return { inserted, skipped, mapping };
  },
});

/**
 * Bulk insert webinar registrations from Supabase.
 * @param records - Array of registration records
 * @param webinarMapping - Map of Supabase webinar IDs to Convex IDs
 */
export const bulkInsertWebinarRegistrations = mutation({
  args: {
    records: v.array(
      v.object({
        workspace_slug: v.string(),
        webinar_supabase_id: v.string(),
        contact_phone: v.string(),
        registered_at: v.number(),
        attended: v.boolean(),
        supabaseId: v.string(),
      })
    ),
    webinarMapping: v.any(), // Map of supabaseId -> convexId
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      const workspace = await ctx.db
        .query("workspaces")
        .filter((q) => q.eq(q.field("slug"), record.workspace_slug))
        .first();
      if (!workspace) {
        skipped++;
        continue;
      }

      // Look up webinar ID
      const webinarId = args.webinarMapping[record.webinar_supabase_id];
      if (!webinarId) {
        skipped++;
        continue;
      }

      // Look up contact
      const contact = await ctx.db
        .query("contacts")
        .withIndex("by_workspace_phone", (q) =>
          q.eq("workspace_id", workspace._id).eq("phone", record.contact_phone)
        )
        .first();
      if (!contact) {
        skipped++;
        continue;
      }

      await ctx.db.insert("webinarRegistrations", {
        webinar_id: webinarId,
        contact_id: contact._id,
        workspace_id: workspace._id,
        registered_at: record.registered_at,
        attended: record.attended,
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});
