import { internalMutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * internalMutation: createSummary - Create a new summary record
 * Used by Brain cron jobs and manual triggers
 */
export const createSummary = internalMutation({
  args: {
    workspace_id: v.id("workspaces"),
    summary_text: v.string(),
    summary_type: v.string(), // 'daily' | 'manual' | 'scheduled'
    trigger: v.string(), // 'cron' | 'command' | 'api'
    triggered_by: v.optional(v.string()), // Phone number if !summary command
    metrics: v.object({
      newLeadsCount: v.number(),
      hotLeadsCount: v.number(),
      warmLeadsCount: v.number(),
      coldLeadsCount: v.number(),
      responseRate: v.optional(v.number()),
      avgScore: v.optional(v.number()),
      topQuestions: v.optional(v.array(v.string())),
      rejectionReasons: v.optional(v.array(v.string())),
    }),
    tokens_used: v.optional(v.number()),
    cost_usd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const summaryId = await ctx.db.insert("brainSummaries", {
      workspace_id: args.workspace_id,
      summary_text: args.summary_text,
      summary_type: args.summary_type,
      trigger: args.trigger,
      triggered_by: args.triggered_by,
      metrics: args.metrics,
      tokens_used: args.tokens_used,
      cost_usd: args.cost_usd,
      created_at: Date.now(),
    });

    console.log(`[Brain] Created summary ${summaryId} (${args.summary_type})`);
    return summaryId;
  },
});

/**
 * query: getLatestSummary - Get most recent summary for workspace
 */
export const getLatestSummary = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const summary = await ctx.db
      .query("brainSummaries")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId))
      .order("desc")
      .first();

    return summary || null;
  },
});

/**
 * query: getSummariesByWorkspace - Get summaries with optional type filter
 */
export const getSummariesByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
    summaryType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workspaceId, summaryType, limit = 10 } = args;

    if (summaryType) {
      // Use by_workspace_type index when filtering by type
      const summaries = await ctx.db
        .query("brainSummaries")
        .withIndex("by_workspace_type", (q) =>
          q.eq("workspace_id", workspaceId).eq("summary_type", summaryType)
        )
        .order("desc")
        .take(limit);

      return summaries;
    } else {
      // Use by_workspace index when no type filter
      const summaries = await ctx.db
        .query("brainSummaries")
        .withIndex("by_workspace", (q) => q.eq("workspace_id", workspaceId))
        .order("desc")
        .take(limit);

      return summaries;
    }
  },
});

/**
 * internalQuery: getRecentSummaries - For internal use in summary generation
 * Used to prevent duplicate daily summaries
 */
export const getRecentSummaries = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workspaceId, days = 1 } = args;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const allSummaries = await ctx.db
      .query("brainSummaries")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspaceId))
      .order("desc")
      .collect();

    // Filter for summaries within the time window
    const recentSummaries = allSummaries.filter(
      (s) => s.created_at >= cutoffTime
    );

    return recentSummaries;
  },
});
