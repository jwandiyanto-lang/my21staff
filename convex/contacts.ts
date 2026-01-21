/**
 * Contact query functions for Convex.
 *
 * These functions provide fast contact lookup by phone number,
 * which is a critical hot path for the application (contact lookup
 * from Kapso webhooks).
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMembership } from "./lib/auth";

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
        q.eq("workspace_id", args.workspace_id).eq("phone", args.phone)
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
        q.eq("workspace_id", args.workspace_id).eq("phone", args.phone)
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
