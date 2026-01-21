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

import { mutation, v } from "./_generated/server";

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
