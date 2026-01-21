/**
 * Conversation query functions for Convex.
 *
 * These functions provide workspace-scoped conversation access,
 * used for dashboard listing and conversation lookup by contact.
 */

import { query } from "./_generated/server";
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
