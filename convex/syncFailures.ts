import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Log a sync failure for monitoring
 */
export const logSyncFailure = internalMutation({
  args: {
    source: v.string(), // "sarah" | "kapso" | "background"
    contact_phone: v.optional(v.string()),
    error: v.string(),
    payload: v.optional(v.string()), // JSON stringified for flexibility
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Keep only last 1000 failures (cleanup old ones)
    const oldFailures = await ctx.db
      .query("syncFailures" as any)
      .order("asc")
      .take(100);

    const totalCount = await ctx.db
      .query("syncFailures" as any)
      .collect()
      .then(all => all.length);

    if (totalCount > 1000) {
      // Delete oldest entries
      for (const old of oldFailures.slice(0, Math.min(100, totalCount - 900))) {
        await ctx.db.delete(old._id);
      }
    }

    await ctx.db.insert("syncFailures" as any, {
      source: args.source,
      contact_phone: args.contact_phone,
      error: args.error,
      payload: args.payload,
      created_at: now,
      resolved: false,
    });

    console.log(`[SyncFailure] Logged: ${args.source} - ${args.error.substring(0, 100)}`);
    return { logged: true };
  },
});

/**
 * Get recent sync failures for monitoring
 */
export const getSyncFailures = query({
  args: {
    limit: v.optional(v.number()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let failures = await ctx.db
      .query("syncFailures" as any)
      .order("desc")
      .take(limit * 2); // Get more to allow filtering

    if (args.source) {
      failures = failures.filter((f: any) => f.source === args.source);
    }

    return failures.slice(0, limit);
  },
});

/**
 * Mark failures as resolved
 */
export const resolveFailures = internalMutation({
  args: {
    failureIds: v.array(v.id("syncFailures" as any)),
  },
  handler: async (ctx, args) => {
    for (const id of args.failureIds) {
      await ctx.db.patch(id, { resolved: true });
    }
    return { resolved: args.failureIds.length };
  },
});
