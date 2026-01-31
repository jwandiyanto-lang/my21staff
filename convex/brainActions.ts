import { mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * internalMutation: createActionRecommendation - Store action item
 */
export const createActionRecommendation = internalMutation({
  args: {
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
    action_type: v.string(),
    priority: v.number(),
    urgency: v.string(),
    reason: v.string(),
    suggested_message: v.optional(v.string()),
    expires_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actionId = await ctx.db.insert("brainActions", {
      ...args,
      status: "pending",
      created_at: Date.now(),
      expires_at: args.expires_at || Date.now() + 24 * 60 * 60 * 1000, // 24h default
    });
    return actionId;
  },
});

/**
 * query: getActionsByWorkspace - Get pending actions
 */
export const getActionsByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workspaceId, status = "pending", limit = 20 } = args;

    const actions = await ctx.db
      .query("brainActions")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspace_id", workspaceId).eq("status", status)
      )
      .order("desc")
      .take(limit);

    // Sort by priority (highest first)
    return actions.sort((a, b) => b.priority - a.priority);
  },
});

/**
 * query: getActionsByPriority - Get top priority actions
 */
export const getActionsByPriority = query({
  args: {
    workspaceId: v.id("workspaces"),
    urgency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { workspaceId, urgency } = args;

    let actions = await ctx.db
      .query("brainActions")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspace_id", workspaceId).eq("status", "pending")
      )
      .collect();

    if (urgency) {
      actions = actions.filter((a) => a.urgency === urgency);
    }

    // Sort by priority (highest first)
    return actions.sort((a, b) => b.priority - a.priority);
  },
});

/**
 * mutation: markActionActioned - Update action status
 */
export const markActionActioned = mutation({
  args: {
    actionId: v.id("brainActions"),
    actionedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.actionId, {
      status: "actioned",
      actioned_at: Date.now(),
      actioned_by: args.actionedBy,
    });
    return { success: true };
  },
});

/**
 * mutation: dismissAction - Dismiss an action
 */
export const dismissAction = mutation({
  args: {
    actionId: v.id("brainActions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.actionId, {
      status: "dismissed",
    });
    return { success: true };
  },
});

/**
 * internalMutation: cleanupExpiredActions - Remove old actions
 * Called by cron job every 6 hours
 */
export const cleanupExpiredActions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired pending actions
    const expiredActions = await ctx.db
      .query("brainActions")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.lt(q.field("expires_at"), now)
        )
      )
      .collect();

    // Mark as expired (or delete - marking is safer for audit)
    for (const action of expiredActions) {
      await ctx.db.patch(action._id, { status: "dismissed" });
    }

    console.log(`[Brain] Cleaned up ${expiredActions.length} expired actions`);
    return { cleanedUp: expiredActions.length };
  },
});
