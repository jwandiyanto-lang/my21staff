/**
 * Contact query functions for Convex.
 *
 * These functions provide fast contact lookup by phone number,
 * which is a critical hot path for the application (contact lookup
 * from Kapso webhooks).
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMembership } from "./lib/auth";

/**
 * Internal version of getContextByPhone for API routes that handle their own auth.
 *
 * This is used by /api/contacts/by-phone which authenticates via CRM_API_KEY header.
 * No workspace membership check here - the API route handles authorization.
 */
export const getContextByPhoneInternal = query({
  args: {
    phone: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Get contact first
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", args.workspace_id as any).eq("phone", args.phone)
      )
      .first();

    if (!contact) {
      return { found: false, context: null };
    }

    // Get conversation and notes in parallel
    const [conversation, notes] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_contact", (q) => q.eq("contact_id", contact._id as any))
        .first(),
      ctx.db
        .query("contactNotes")
        .withIndex("by_contact", (q) => q.eq("contact_id", contact._id))
        .take(5),
    ]);

    // Get recent messages if conversation exists
    let recentMessages: any[] = [];
    if (conversation) {
      recentMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation_time", (q) =>
          q.eq("conversation_id", conversation._id)
        )
        .order("desc")
        .take(10);
    }

    return {
      found: true,
      contact: {
        name: contact.name,
        kapso_name: contact.kapso_name,
        lead_status: contact.lead_status,
        lead_score: contact.lead_score,
        tags: contact.tags,
        is_returning: !!conversation?.last_message_at,
        first_contact_date: contact.created_at,
      },
      notes: notes.map((n) => n.content),
      last_interaction: conversation?.last_message_at || null,
      recent_messages: recentMessages.map((m) => ({
        content: m.content,
        direction: m.direction,
        created_at: m.created_at,
      })),
    };
  },
});

/**
 * Get a contact by phone number within a workspace.
 *
 * This is a hot path function - called whenever a message arrives
 * from Kapso to identify the contact. Uses by_workspace_phone index
 * for fast lookup.
 *
 * @param phone - The phone number to look up
 * @param workspace_id - The workspace to search within
 * @returns The contact document or null if not found
 */
export const getByPhone = query({
  args: {
    phone: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", args.workspace_id as any).eq("phone", args.phone)
      )
      .first();

    return contact;
  },
});

/**
 * Get full CRM context for a contact by phone number.
 *
 * Returns aggregated data for AI personalization:
 * - Contact info (name, lead status, lead score, tags)
 * - Recent notes
 * - Conversation history
 * - Last interaction timestamp
 *
 * This replaces /api/contacts/by-phone in Supabase implementation.
 * Uses parallel queries for optimal performance.
 *
 * @param phone - The phone number to look up
 * @param workspace_id - The workspace to search within
 * @returns CRM context object with found status and data
 */
export const getContextByPhone = query({
  args: {
    phone: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    // Get contact first
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", args.workspace_id as any).eq("phone", args.phone)
      )
      .first();

    if (!contact) {
      return { found: false, context: null };
    }

    // Get conversation and notes in parallel
    const [conversation, notes] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_contact", (q) => q.eq("contact_id", contact._id))
        .first(),
      ctx.db
        .query("contactNotes")
        .withIndex("by_contact", (q) => q.eq("contact_id", contact._id))
        .take(5),
    ]);

    // Get recent messages if conversation exists
    let recentMessages: any[] = [];
    if (conversation) {
      recentMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation_time", (q) =>
          q.eq("conversation_id", conversation._id)
        )
        .order("desc")
        .take(10);
    }

    return {
      found: true,
      contact: {
        name: contact.name,
        kapso_name: contact.kapso_name,
        lead_status: contact.lead_status,
        lead_score: contact.lead_score,
        tags: contact.tags,
        is_returning: !!conversation?.last_message_at,
        first_contact_date: contact.created_at,
      },
      notes: notes.map((n) => n.content),
      last_interaction: conversation?.last_message_at || null,
      recent_messages: recentMessages.map((m) => ({
        content: m.content,
        direction: m.direction,
        created_at: m.created_at,
      })),
    };
  },
});

/**
 * List contacts for a workspace with optional filters.
 *
 * Supports filtering by assigned user and lead status. Uses
 * appropriate indexes based on filters:
 * - by_assigned index when assigned_to is specified
 * - by_workspace index otherwise
 *
 * @param workspace_id - The workspace to list contacts for
 * @param limit - Maximum number of contacts (default: 50)
 * @param assigned_to - Optional user ID to filter by assignment
 * @param lead_status - Optional lead status to filter
 * @returns Array of contact documents
 */
export const listByWorkspace = query({
  args: {
    workspace_id: v.string(),
    limit: v.optional(v.number()),
    assigned_to: v.optional(v.string()),
    lead_status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const limit = args.limit || 50;
    let contacts;

    // Use appropriate index based on filters
    if (args.assigned_to) {
      // Use by_assigned index for assignment filtering
      contacts = await ctx.db
        .query("contacts")
        .withIndex("by_assigned", (q) =>
          q.eq("workspace_id", args.workspace_id as any).eq("assigned_to", args.assigned_to)
        )
        .order("desc")
        .take(limit);
    } else {
      // Use by_workspace index for general listing
      contacts = await ctx.db
        .query("contacts")
        .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
        .order("desc")
        .take(limit);
    }

    // Filter by lead_status if specified
    if (args.lead_status) {
      return contacts.filter((c) => c.lead_status === args.lead_status);
    }

    return contacts;
  },
});

/**
 * List contacts that have a specific tag.
 *
 * Filters contacts array for tag match since there's no
 * dedicated tag index in the schema. Works well for
 * moderate-sized contact lists.
 *
 * @param workspace_id - The workspace
 * @param tag - The tag to filter by
 * @param limit - Maximum results (default: 50)
 * @returns Array of contacts with the specified tag
 */
export const listByTag = query({
  args: {
    workspace_id: v.string(),
    tag: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const limit = args.limit || 50;
    const tagLower = args.tag.toLowerCase();

    // Get all contacts for workspace and filter by tag
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    // Filter for contacts containing the tag
    const filtered = contacts
      .filter((c) =>
        c.tags?.some((t) => t.toLowerCase() === tagLower)
      )
      .slice(0, limit);

    return filtered;
  },
});

/**
 * Get a contact by ID (internal version for API routes).
 *
 * Used by /api/messages/send to get contact phone.
 * No workspace membership check - API route handles authorization.
 */
export const getByIdInternal = query({
  args: {
    contact_id: v.string(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contact_id as any);
    if (!contact) {
      return null;
    }
    return contact;
  },
});

/**
 * Get a contact by ID.
 *
 * @param contact_id - The contact ID
 * @param workspace_id - Workspace for authorization
 * @returns The contact document or null if not found
 */
export const getById = query({
  args: {
    contact_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const contact = await ctx.db.get(args.contact_id as any);

    return contact;
  },
});

/**
 * Search contacts by name or phone.
 *
 * Performs case-insensitive search on contact name and phone.
 *
 * @param workspace_id - The workspace
 * @param query - Search query string
 * @param limit - Maximum results (default: 50)
 * @returns Array of matching contacts
 */
export const searchByPhoneOrName = query({
  args: {
    workspace_id: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const limit = args.limit || 50;
    const searchLower = args.query.toLowerCase();

    // Get all contacts for workspace and filter
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    // Filter for name or phone match
    const filtered = contacts
      .filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(searchLower);
        const phoneMatch = c.phone?.toLowerCase().includes(searchLower);
        return nameMatch || phoneMatch;
      })
      .slice(0, limit);

    return filtered;
  },
});
