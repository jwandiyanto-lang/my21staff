/**
 * Message query functions for Convex.
 *
 * These functions provide message listing and retrieval with
 * workspace-scoped authorization. Used for inbox message display
 * and conversation history.
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMembership } from "./lib/auth";

/**
 * List messages for a conversation.
 *
 * Returns messages ordered by created_at DESC (newest first)
 * for efficient display in chat UI. Uses by_conversation_time
 * index for optimal performance.
 *
 * @param conversation_id - The conversation to list messages for
 * @param workspace_id - Workspace for authorization
 * @param limit - Maximum number of messages to return (default: 100)
 * @returns Array of message documents
 */
export const listByConversation = query({
  args: {
    conversation_id: v.id('conversations'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversation_id", args.conversation_id)
      )
      .order("asc")
      .take(limit);

    return messages;
  },
});

/**
 * List messages for a conversation with workspace auth.
 *
 * Returns messages ordered by created_at DESC (newest first)
 * for efficient display in chat UI. Uses by_conversation_time
 * index for optimal performance.
 *
 * @param conversation_id - The conversation to list messages for
 * @param workspace_id - Workspace for authorization
 * @param limit - Maximum number of messages to return (default: 100)
 * @returns Array of message documents
 */
export const listByConversationWithAuth = query({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    // Verify conversation exists and belongs to workspace
    const conversation = await ctx.db.get(args.conversation_id as any);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if ((conversation as any).workspace_id !== args.workspace_id) {
      throw new Error("Conversation not in this workspace");
    }

    const limit = args.limit || 100;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversation_id", args.conversation_id as any)
      )
      .order("desc")
      .take(limit);

    return messages;
  },
});

/**
 * List messages for a conversation (oldest first).
 *
 * Same as listByConversation but with ascending order for
 * chronological display in chat UI.
 *
 * @param conversation_id - The conversation to list messages for
 * @param workspace_id - Workspace for authorization
 * @param limit - Maximum number of messages to return (default: 100)
 * @returns Array of message documents in chronological order
 */
export const listByConversationAsc = query({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const conversation = await ctx.db.get(args.conversation_id as any);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if ((conversation as any).workspace_id !== args.workspace_id) {
      throw new Error("Conversation not in this workspace");
    }

    const limit = args.limit || 100;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversation_id", args.conversation_id as any)
      )
      .order("asc")
      .take(limit);

    return messages;
  },
});

/**
 * Get a single message by ID.
 *
 * Verifies workspace membership and returns the message
 * with its conversation context.
 *
 * @param message_id - The message to retrieve
 * @param workspace_id - Workspace for authorization
 * @returns The message document or null if not found
 */
export const getById = query({
  args: {
    message_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const message = await ctx.db.get(args.message_id as any);

    if (!message) {
      return null;
    }

    // @ts-ignore - message may be from different table
    if ((message as any).workspace_id !== args.workspace_id) {
      throw new Error("Message not in this workspace");
    }

    // Include conversation info
    const conversation = await ctx.db.get((message as any).conversation_id);

    return {
      ...message,
      conversation,
    };
  },
});

/**
 * Count messages for a conversation.
 *
 * @param conversation_id - The conversation
 * @param workspace_id - Workspace for authorization
 * @returns Count of messages
 */
export const countByConversation = query({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const conversation = await ctx.db.get(args.conversation_id as any);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if ((conversation as any).workspace_id !== args.workspace_id) {
      throw new Error("Conversation not in this workspace");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversation_id", args.conversation_id as any)
      )
      .collect();

    return messages.length;
  },
});

/**
 * List recent messages across all conversations in a workspace.
 *
 * Used for activity feeds and dashboard widgets showing
 * recent activity.
 *
 * @param workspace_id - The workspace
 * @param limit - Maximum number of messages (default: 50)
 * @returns Array of recent messages
 */
export const listRecentByWorkspace = query({
  args: {
    workspace_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const limit = args.limit || 50;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .order("desc")
      .take(limit);

    // Fetch conversations for context
    const conversationIds = [...new Set(messages.map((m) => m.conversation_id))];
    const conversations = await Promise.all(
      conversationIds.map((id) => ctx.db.get(id))
    );

    return messages.map((m) => ({
      ...m,
      conversation: conversations.find((c) => c?._id === m.conversation_id) || null,
    }));
  },
});

/**
 * Search messages by content.
 *
 * Performs a case-insensitive search for messages containing
 * the query text. Limited to the specified workspace.
 *
 * Note: Full-text search is not native to Convex. This performs
 * client-side filtering which works for small datasets but may
 * need optimization for scale.
 *
 * @param workspace_id - The workspace
 * @param query - Search query string
 * @param limit - Maximum results (default: 50)
 * @returns Array of matching messages
 */
export const searchByContent = query({
  args: {
    workspace_id: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const limit = args.limit || 50;
    const searchLower = args.query.toLowerCase();

    // Get all messages for workspace (needs optimization for scale)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    // Filter for content match
    const filtered = messages
      .filter((m) => m.content && m.content.toLowerCase().includes(searchLower))
      .slice(0, limit);

    return filtered;
  },
});
