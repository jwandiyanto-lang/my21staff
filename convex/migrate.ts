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
