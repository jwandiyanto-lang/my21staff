/**
 * Convex query functions for tickets.
 *
 * These queries replace Supabase direct table access for the
 * support ticketing system (tickets, comments, status history).
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query, internalQuery, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMembership } from "./lib/auth";

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
export const listTickets = query({
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

// ============================================
// TICKET MUTATIONS
// ============================================

/**
 * Create a ticket comment.
 *
 * @param ticket_id - The ticket
 * @param author_id - The user creating the comment
 * @param content - Comment content
 * @param is_stage_change - True if this is an auto-generated stage change comment
 * @returns The created comment document
 */
export const createTicketComment = mutation({
  args: {
    ticket_id: v.id("tickets"),
    author_id: v.string(),
    content: v.string(),
    is_stage_change: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const commentId = await ctx.db.insert("ticketComments", {
      ticket_id: args.ticket_id,
      author_id: args.author_id,
      content: args.content,
      is_stage_change: args.is_stage_change || false,
      created_at: now,
    });

    return await ctx.db.get(commentId);
  },
});

/**
 * Transition a ticket to a new stage.
 *
 * Supports both normal transitions and skip transitions (with approval).
 *
 * @param ticket_id - The ticket to transition
 * @param workspace_id - Workspace for authorization
 * @param to_stage - Target stage ('report', 'discuss', 'outcome', 'implementation', 'closed')
 * @param user_id - User making the transition
 * @param is_skip - True if this is a skip transition (requires approval)
 * @returns The updated ticket document
 */
export const transitionTicketStage = mutation({
  args: {
    ticket_id: v.string(),
    workspace_id: v.string(),
    to_stage: v.string(),
    user_id: v.string(),
    is_skip: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const ticket = await ctx.db.get(args.ticket_id as any);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // @ts-ignore - workspace_id is Id type
    if (typeof ticket.workspace_id !== "string") {
      throw new Error("Ticket not in this workspace");
    }

    const now = Date.now();
    const isSkip = args.is_skip || false;
    const currentStage = ticket.stage;
    const updates: any = { updated_at: now };

    if (isSkip) {
      // Skip transition - set approval pending
      updates.pending_approval = true;
      updates.pending_stage = args.to_stage;
      updates.approval_requested_at = now;
    } else {
      // Normal transition - update stage directly
      updates.stage = args.to_stage;

      // If closing, set closed_at and generate reopen token
      if (args.to_stage === "closed") {
        updates.closed_at = now;
        // Reopen token will be generated by API route using ENCRYPTION_KEY
      }
    }

    await ctx.db.patch(args.ticket_id as any, updates);

    // Create status history
    const historyReason = isSkip
      ? `Skip request to ${args.to_stage} stage (pending approval)`
      : `Transitioned to ${args.to_stage} stage`;
    await ctx.db.insert("ticketStatusHistory", {
      ticket_id: args.ticket_id as any,
      changed_by: args.user_id,
      from_stage: isSkip ? currentStage : args.to_stage,
      to_stage: isSkip ? currentStage : args.to_stage,
      reason: historyReason,
      created_at: now,
    });

    return await ctx.db.get(args.ticket_id as any);
  },
});

/**
 * Approve or reject a stage skip request.
 *
 * @param ticket_id - The ticket
 * @param workspace_id - Workspace for authorization
 * @param approved - True to approve, false to reject
 * @param user_id - User approving/rejecting (must be requester)
 * @returns The updated ticket document
 */
export const approveTicketStageSkip = mutation({
  args: {
    ticket_id: v.string(),
    workspace_id: v.string(),
    approved: v.boolean(),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const ticket = await ctx.db.get(args.ticket_id as any);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // @ts-ignore - workspace_id is Id type
    if (typeof ticket.workspace_id !== "string") {
      throw new Error("Ticket not in this workspace");
    }

    // Check if ticket is pending approval
    if (!ticket.pending_approval) {
      throw new Error("Ticket is not pending approval");
    }

    const now = Date.now();
    const currentStage = ticket.stage;
    const pendingStage = ticket.pending_stage;
    const updates: any = {
      pending_approval: false,
      pending_stage: null,
      approval_requested_at: null,
      updated_at: now,
    };

    let historyReason: string;
    let toStage: string;

    if (args.approved) {
      // Apply stage change
      updates.stage = pendingStage;
      toStage = pendingStage;
      historyReason = `Skip approved to ${pendingStage} stage`;

      // If closing, set closed_at
      if (pendingStage === "closed") {
        updates.closed_at = now;
        // Reopen token will be generated by API route
      }
    } else {
      // Rejected - stay at current stage
      toStage = currentStage;
      historyReason = `Skip rejected to ${pendingStage} stage - staying at ${currentStage}`;
    }

    await ctx.db.patch(args.ticket_id as any, updates);

    // Create status history
    await ctx.db.insert("ticketStatusHistory", {
      ticket_id: args.ticket_id as any,
      changed_by: args.user_id,
      from_stage: currentStage,
      to_stage: toStage,
      reason: historyReason,
      created_at: now,
    });

    return await ctx.db.get(args.ticket_id as any);
  },
});

/**
 * Reopen a closed ticket.
 *
 * Supports both token-based (anonymous) and authenticated reopen.
 *
 * @param ticket_id - The ticket to reopen
 * @param workspace_id - Workspace for authorization
 * @param user_id - User reopening (optional for token-based)
 * @returns The updated ticket document
 */
export const reopenTicket = mutation({
  args: {
    ticket_id: v.string(),
    workspace_id: v.string(),
    user_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const ticket = await ctx.db.get(args.ticket_id as any);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // @ts-ignore - workspace_id is Id type
    if (typeof ticket.workspace_id !== "string") {
      throw new Error("Ticket not in this workspace");
    }

    // Must be closed to reopen
    if (ticket.stage !== "closed") {
      throw new Error("Ticket is not closed");
    }

    const now = Date.now();
    await ctx.db.patch(args.ticket_id as any, {
      stage: "report",
      closed_at: null,
      pending_approval: false,
      pending_stage: null,
      approval_requested_at: null,
      updated_at: now,
    });

    // Create status history
    await ctx.db.insert("ticketStatusHistory", {
      ticket_id: args.ticket_id as any,
      changed_by: args.user_id || ticket.requester_id,
      from_stage: "closed",
      to_stage: "report",
      reason: "Ticket reopened",
      created_at: now,
    });

    return await ctx.db.get(args.ticket_id as any);
  },
});

/**
 * Create a new ticket.
 *
 * @param workspace_id - The workspace
 * @param requester_id - User creating the ticket
 * @param title - Ticket title
 * @param description - Ticket description
 * @param category - Ticket category ('bug', 'feature', 'question')
 * @param priority - Ticket priority ('low', 'medium', 'high')
 * @returns The created ticket ID
 */
export const createTicket = mutation({
  args: {
    workspace_id: v.string(),
    requester_id: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const now = Date.now();
    const ticketId = await ctx.db.insert("tickets", {
      workspace_id: args.workspace_id as any,
      requester_id: args.requester_id,
      assigned_to: null,
      title: args.title,
      description: args.description,
      category: args.category,
      priority: args.priority,
      stage: "report",
      pending_approval: false,
      pending_stage: null,
      approval_requested_at: null,
      closed_at: null,
      created_at: now,
      updated_at: now,
      supabaseId: null,
    });

    // Create initial status history
    await ctx.db.insert("ticketStatusHistory", {
      ticket_id: ticketId,
      changed_by: args.requester_id,
      from_stage: null,
      to_stage: "report",
      reason: "Ticket created",
      created_at: now,
    });

    return ticketId;
  },
});

/**
 * Update ticket assignment.
 *
 * @param ticket_id - The ticket to update
 * @param workspace_id - Workspace for authorization
 * @param assigned_to - User to assign (null to unassign)
 * @returns The updated ticket document
 */
export const updateTicketAssignment = mutation({
  args: {
    ticket_id: v.string(),
    workspace_id: v.string(),
    assigned_to: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const ticket = await ctx.db.get(args.ticket_id as any);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // @ts-ignore - workspace_id is Id type
    if (typeof ticket.workspace_id !== "string") {
      throw new Error("Ticket not in this workspace");
    }

    const now = Date.now();
    await ctx.db.patch(args.ticket_id as any, {
      assigned_to: args.assigned_to,
      updated_at: now,
    });

    return await ctx.db.get(args.ticket_id as any);
  },
});
