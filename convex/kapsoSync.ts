import { v } from "convex/values";
import { mutation, internalMutation, query } from "./_generated/server";

/**
 * Sync Kapso conversation ID to a conversation record
 * Called from webhook or background sync job
 */
export const syncKapsoConversationId = internalMutation({
  args: {
    conversation_id: v.id("conversations"),
    kapso_conversation_id: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.conversation_id);
    if (!existing) {
      throw new Error(`Conversation ${args.conversation_id} not found`);
    }

    // Only update if different (avoid unnecessary writes)
    if (existing.kapso_conversation_id !== args.kapso_conversation_id) {
      await ctx.db.patch(args.conversation_id, {
        kapso_conversation_id: args.kapso_conversation_id,
        updated_at: Date.now(),
      });

      console.log(`[Kapso Sync] Linked conversation ${args.conversation_id} to Kapso conversation ${args.kapso_conversation_id}`);
    }
  },
});

/**
 * Find Kapso conversation ID by phone number using Kapso API
 * This is called from the webhook to link conversations
 */
export const findKapsoConversationByPhone = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    // This will be implemented to call Kapso API
    // For now, we'll return null and implement the API call
    // using the Kapso MCP tools or HTTP client

    // TODO: Call Kapso API to search for conversation by phone
    // For now, return null
    return null;
  },
});

/**
 * Get conversation with Kapso conversation ID
 */
export const getConversationWithKapsoId = query({
  args: {
    conversation_id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversation_id);
    if (!conversation) return null;

    const contact = await ctx.db.get(conversation.contact_id);

    return {
      ...conversation,
      contact: contact ? {
        name: contact.name,
        phone: contact.phone,
        leadTemperature: contact.leadTemperature,
      } : null,
    };
  },
});
