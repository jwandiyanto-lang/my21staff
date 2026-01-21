/**
 * Conversation query functions for Convex.
 *
 * These functions provide workspace-scoped conversation access,
 * used for dashboard listing and conversation lookup by contact.
 */

import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMembership } from "./lib/auth";

/**
 * List conversations for a workspace.
 *
 * Returns conversations ordered by last_message_at (most recent first),
 * optionally filtered by status, assignment, and limited to a specific count.
 * Fetches contact details in parallel for efficient rendering.
 *
 * @param workspace_id - The workspace to list conversations for
 * @param limit - Maximum number of conversations to return (default: 50)
 * @param status - Optional status filter ('open', 'closed', 'handover')
 * @param assignedTo - Optional assignment filter (user_id or 'unassigned')
 * @returns Array of conversations with contact details
 */
export const listByWorkspace = query({
  args: {
    workspace_id: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    let q = ctx.db
      .query("conversations")
      .withIndex("by_workspace_time", (q) =>
        q.eq("workspace_id", args.workspace_id)
      )
      .order("desc");

    if (args.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.assignedTo) {
      q = q.filter((q) => {
        if (args.assignedTo === "unassigned") {
          // Filter for unassigned conversations
          return q.eq(q.field("assigned_to"), undefined);
        } else {
          // Filter for conversations assigned to specific user
          return q.eq(q.field("assigned_to"), args.assignedTo);
        }
      });
    }

    const limit = args.limit || 50;
    const conversations = await q.take(limit);

    // Fetch contacts in parallel for efficiency
    const contactIds = conversations.map((c) => c.contact_id);
    const contacts = await Promise.all(
      contactIds.map((id) => ctx.db.get(id))
    );

    return conversations.map((conv) => ({
      ...conv,
      contact: contacts.find((c) => c?._id === conv.contact_id) || null,
    }));
  },
});

/**
 * Get a conversation by contact ID.
 *
 * Returns the conversation for a specific contact within a workspace.
 * Used to check if an active conversation exists when a message arrives.
 *
 * @param contact_id - The contact ID to look up
 * @param workspace_id - The workspace for authorization
 * @returns The conversation document or null if not found
 */
export const getByContact = query({
  args: {
    contact_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contact_id))
      .first();

    return conversation;
  },
});

/**
 * Count conversations with unread messages.
 *
 * Used for active count badge in inbox UI.
 * Queries by workspace and filters for unread_count > 0.
 *
 * @param workspace_id - The workspace to count unread conversations for
 * @returns Number of conversations with unread messages
 */
export const countUnread = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const unreadConversations = await ctx.db
      .query("conversations")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .filter((q) => q.gt(q.field("unread_count"), 0))
      .collect();

    return unreadConversations.length;
  },
});

/**
 * Count all conversations in a workspace.
 *
 * Used for pagination and total count display.
 *
 * @param workspace_id - The workspace to count conversations for
 * @returns Total number of conversations
 */
export const countAll = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();

    return allConversations.length;
  },
});

/**
 * Get a single conversation by ID.
 *
 * Returns the conversation with associated contact information.
 * Used for conversation detail view and message loading.
 *
 * @param conversation_id - The conversation ID to look up
 * @param workspace_id - The workspace for authorization
 * @returns The conversation with contact details, or null if not found
 */
export const getById = query({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const conversation = await ctx.db.get(args.conversation_id);
    if (!conversation) {
      return null;
    }

    // Verify conversation belongs to the workspace
    if (conversation.workspace_id !== args.workspace_id) {
      return null;
    }

    // Fetch associated contact
    const contact = await ctx.db.get(conversation.contact_id);

    return {
      ...conversation,
      contact,
    };
  },
});

/**
 * List all workspace members with their roles.
 *
 * Used for inbox filter dropdowns (assigned to filter) and team member display.
 * Returns members without full profile data (profile data comes from auth context).
 *
 * @param workspace_id - The workspace to list members for
 * @returns Array of workspace members with user_id and role
 */
export const listMembers = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();

    return members.map((m) => ({
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
    }));
  },
});

/**
 * List all unique tags from contacts in a workspace.
 *
 * Used for inbox filter dropdowns (tag filter).
 * Collects unique tags from all contacts and returns as array.
 *
 * @param workspace_id - The workspace to collect tags from
 * @returns Array of unique tag strings
 */
export const listTags = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();

    // Collect all tags and deduplicate
    const tagSet = new Set<string>();
    for (const contact of contacts) {
      if (contact.tags) {
        for (const tag of contact.tags) {
          tagSet.add(tag);
        }
      }
    }

    return Array.from(tagSet).sort();
  },
});

/**
 * Comprehensive inbox query with all filters.
 *
 * Returns conversations with filters, counts, members, and tags in a single call.
 * Matches the structure used by /api/conversations route for easy API migration.
 *
 * @param workspace_id - The workspace to query
 * @param active - Filter for only unread conversations (optional)
 * @param statusFilters - Array of statuses to filter by (optional)
 * @param tagFilters - Array of tags to filter by (optional)
 * @param assignedTo - Filter by assignment: user_id, 'unassigned', or 'all' (default: 'all')
 * @param limit - Maximum conversations per page (default: 50)
 * @param page - Page number for pagination (0-based, default: 0)
 * @returns Object with conversations, totalCount, activeCount, members, tags
 */
export const listWithFilters = query({
  args: {
    workspace_id: v.string(),
    active: v.optional(v.boolean()),
    statusFilters: v.optional(v.array(v.string())),
    tagFilters: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.string()),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const limit = args.limit || 50;
    const page = args.page || 0;
    const offset = page * limit;

    // Build conversation query with filters
    let q = ctx.db
      .query("conversations")
      .withIndex("by_workspace_time", (q) =>
        q.eq("workspace_id", args.workspace_id)
      )
      .order("desc");

    // Apply active filter (unread_count > 0)
    if (args.active) {
      q = q.filter((q) => q.gt(q.field("unread_count"), 0));
    }

    // Apply status filters
    if (args.statusFilters && args.statusFilters.length > 0) {
      q = q.filter((q) => {
        const status = q.field("status");
        return args.statusFilters!.some((s) => status.value === s);
      });
    }

    // Apply assignment filter
    if (args.assignedTo && args.assignedTo !== "all") {
      q = q.filter((q) => {
        const assignedTo = q.field("assigned_to");
        if (args.assignedTo === "unassigned") {
          return assignedTo === undefined;
        } else {
          return assignedTo === args.assignedTo;
        }
      });
    }

    // Get total count before pagination
    const allConversations = await q.collect();
    const totalCount = allConversations.length;

    // Apply pagination
    const conversations = allConversations.slice(offset, offset + limit);

    // Fetch contacts in parallel
    const contactIds = conversations.map((c) => c.contact_id);
    const contacts = await Promise.all(
      contactIds.map((id) => ctx.db.get(id))
    );

    // Filter by tags client-side (since tags are on contacts, not conversations)
    let filteredConversations = conversations;
    if (args.tagFilters && args.tagFilters.length > 0) {
      filteredConversations = conversations.filter((conv) => {
        const contact = contacts.find((c) => c?._id === conv.contact_id);
        if (!contact || !contact.tags) return false;
        // Include if contact has any of the requested tags
        return args.tagFilters!.some((tag) => contact.tags!.includes(tag));
      });
    }

    // Build result with contact data
    const conversationsWithContacts = filteredConversations.map((conv) => ({
      ...conv,
      contact: contacts.find((c) => c?._id === conv.contact_id) || null,
    }));

    // Get members in parallel
    const [members, allContacts] = await Promise.all([
      ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
        .collect(),
      ctx.db
        .query("contacts")
        .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
        .collect(),
    ]);

    // Calculate active count (unread conversations)
    const activeCount = allConversations.filter((c) => c.unread_count > 0).length;

    // Collect unique tags
    const tagSet = new Set<string>();
    for (const contact of allContacts) {
      if (contact.tags) {
        for (const tag of contact.tags) {
          tagSet.add(tag);
        }
      }
    }

    return {
      conversations: conversationsWithContacts,
      totalCount,
      activeCount,
      members: members.map((m) => ({
        user_id: m.user_id,
        role: m.role,
        created_at: m.created_at,
      })),
      tags: Array.from(tagSet).sort(),
    };
  },
});
