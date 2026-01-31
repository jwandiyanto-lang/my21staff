import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * internalMutation: createInsight - Store detected pattern
 */
export const createInsight = internalMutation({
  args: {
    workspace_id: v.id("workspaces"),
    insight_type: v.string(),
    pattern: v.string(),
    frequency: v.number(),
    examples: v.array(v.string()),
    recommendation: v.optional(v.string()),
    suggested_faqs: v.optional(v.array(v.object({
      question: v.string(),
      suggested_answer: v.string(),
    }))),
    confidence: v.string(),
    time_range: v.string(),
  },
  handler: async (ctx, args) => {
    const insightId = await ctx.db.insert("brainInsights", {
      ...args,
      created_at: Date.now(),
    });
    return insightId;
  },
});

/**
 * query: getInsightsByWorkspace - Get insights with optional type filter
 */
export const getInsightsByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
    insightType: v.optional(v.string()),
    timeRange: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workspaceId, insightType, timeRange, limit = 20 } = args;

    let results = await ctx.db
      .query("brainInsights")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspaceId))
      .order("desc")
      .take(limit * 3); // Over-fetch for filtering

    if (insightType) {
      results = results.filter((r) => r.insight_type === insightType);
    }
    if (timeRange) {
      results = results.filter((r) => r.time_range === timeRange);
    }

    return results.slice(0, limit);
  },
});

/**
 * internalMutation: bulkCreateInsights - Create multiple insights at once
 * Used after pattern analysis completes
 */
export const bulkCreateInsights = internalMutation({
  args: {
    insights: v.array(v.object({
      workspace_id: v.id("workspaces"),
      insight_type: v.string(),
      pattern: v.string(),
      frequency: v.number(),
      examples: v.array(v.string()),
      recommendation: v.optional(v.string()),
      suggested_faqs: v.optional(v.array(v.object({
        question: v.string(),
        suggested_answer: v.string(),
      }))),
      confidence: v.string(),
      time_range: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    for (const insight of args.insights) {
      const id = await ctx.db.insert("brainInsights", {
        ...insight,
        created_at: Date.now(),
      });
      ids.push(id);
    }
    console.log(`[Brain] Bulk created ${ids.length} insights`);
    return { count: ids.length, ids };
  },
});
