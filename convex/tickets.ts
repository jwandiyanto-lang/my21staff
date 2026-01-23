/**
 * Convex query functions for tickets.
 *
 * These queries replace Supabase direct table access for the
 * support ticketing system (tickets, comments, status history).
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// TICKET QUERIES
// ============================================

/**
 * Get a ticket by ID.
 *
 * @param ticket_id - The ticket ID to fetch
 * @returns The ticket document or null
 */
export const getTicketById = query({
  args: {
    ticket_id: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticket_id);
  },
});

/**
 * List tickets for a workspace.
 *
 * @param workspace_id - The workspace
 * @param stage - Optional stage filter
 * @param assigned_to - Optional assigned user ID filter
 * @returns Array of ticket documents
 */
export const listTickets = internalQuery({
  args: {
    workspace_id: v.string(),
    stage: v.optional(v.string()),
    assigned_to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("tickets").withIndex("by_workspace", (q) =>
      q.eq("workspace_id", args.workspace_id as any)
    );

    if (args.stage) {
      q = q.withIndex("by_workspace_stage", (q) =>
        q.eq("workspace_id", args.workspace_id as any)
          .eq("stage", args.stage)
      );
    }

    if (args.assigned_to) {
      q = q.filter((q) =>
        q.eq("assigned_to", args.assigned_to)
      );
    }

    return await q.order("desc").collect();
  },
});

/**
 * Get requester's tickets (for portal view).
 *
 * @param requester_id - The user ID
 * @returns Array of ticket documents for this requester
 */
export const listTicketsByRequester = query({
  args: {
    requester_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_requester", (q) =>
        q.eq("requester_id", args.requester_id)
      )
      .order("desc")
      .collect();
  },
});

// ============================================
// TICKET COMMENTS QUERIES
// ============================================

/**
 * List comments for a ticket.
 *
 * @param ticket_id - The ticket
 * @returns Array of comment documents
 */
export const listTicketComments = query({
  args: {
    ticket_id: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketComments")
      .withIndex("by_ticket_time", (q) =>
        q.eq("ticket_id", args.ticket_id)
      )
      .order("desc")
      .collect();
  },
});

// ============================================
// TICKET STATUS HISTORY QUERIES
// ============================================

/**
 * Get status history for a ticket.
 *
 * @param ticket_id - The ticket
 * @returns Array of history documents
 */
export const getTicketStatusHistory = query({
  args: {
    ticket_id: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketStatusHistory")
      .withIndex("by_ticket_time", (q) =>
        q.eq("ticket_id", args.ticket_id)
      )
      .order("desc")
      .collect();
  },
});
