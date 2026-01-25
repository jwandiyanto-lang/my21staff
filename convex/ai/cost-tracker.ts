/**
 * Cost Tracker — Usage monitoring for AI modules.
 *
 * Provides queries for:
 * - Total costs by workspace
 * - Cost breakdown by AI type (mouth vs brain)
 * - Per-conversation costs
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

export interface CostSummary {
  mouth: {
    cost: number;
    conversations: number;
    totalTokens: number;
  };
  brain: {
    cost: number;
    conversations: number;
    totalTokens: number;
  };
  total: number;
}

/**
 * Get cost summary for a workspace in a date range.
 */
export const getWorkspaceCosts = query({
  args: {
    workspaceId: v.id("workspaces"),
    fromTimestamp: v.number(),
    toTimestamp: v.number(),
  },
  handler: async (ctx, args): Promise<CostSummary> => {
    const usageRecords = await ctx.db
      .query("aiUsage")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId))
      .collect();

    // Filter by date range in memory (Convex doesn't support range on non-indexed fields)
    const filtered = usageRecords.filter(
      (r) => r.created_at >= args.fromTimestamp && r.created_at <= args.toTimestamp
    );

    // Aggregate by AI type
    const mouthRecords = filtered.filter((r) => r.ai_type === "mouth");
    const brainRecords = filtered.filter((r) => r.ai_type === "brain");

    const mouthCost = mouthRecords.reduce((sum, r) => sum + r.cost_usd, 0);
    const brainCost = brainRecords.reduce((sum, r) => sum + r.cost_usd, 0);

    const mouthTokens = mouthRecords.reduce(
      (sum, r) => sum + r.input_tokens + r.output_tokens,
      0
    );
    const brainTokens = brainRecords.reduce(
      (sum, r) => sum + r.input_tokens + r.output_tokens,
      0
    );

    // Count unique conversations
    const mouthConvIds = new Set(
      mouthRecords.map((r) => r.conversation_id).filter(Boolean)
    );
    const brainConvIds = new Set(
      brainRecords.map((r) => r.conversation_id).filter(Boolean)
    );

    return {
      mouth: {
        cost: mouthCost,
        conversations: mouthConvIds.size,
        totalTokens: mouthTokens,
      },
      brain: {
        cost: brainCost,
        conversations: brainConvIds.size,
        totalTokens: brainTokens,
      },
      total: mouthCost + brainCost,
    };
  },
});

/**
 * Get cost for a specific conversation.
 */
export const getConversationCost = query({
  args: {
    conversationId: v.id("ariConversations"),
  },
  handler: async (ctx, args) => {
    const usageRecords = await ctx.db
      .query("aiUsage")
      .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversationId))
      .collect();

    const totalCost = usageRecords.reduce((sum, r) => sum + r.cost_usd, 0);
    const mouthCost = usageRecords
      .filter((r) => r.ai_type === "mouth")
      .reduce((sum, r) => sum + r.cost_usd, 0);
    const brainCost = usageRecords
      .filter((r) => r.ai_type === "brain")
      .reduce((sum, r) => sum + r.cost_usd, 0);

    return {
      total: totalCost,
      mouth: mouthCost,
      brain: brainCost,
      callCount: usageRecords.length,
    };
  },
});

/**
 * Get recent AI calls for debugging.
 */
export const getRecentCalls = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const records = await ctx.db
      .query("aiUsage")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId))
      .order("desc")
      .take(limit);

    return records.map((r) => ({
      id: r._id,
      model: r.model,
      aiType: r.ai_type,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      costUsd: r.cost_usd,
      createdAt: r.created_at,
    }));
  },
});
