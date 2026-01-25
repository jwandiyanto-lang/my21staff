/**
 * Admin utilities for one-off operations.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create ariConfig for a workspace.
 */
export const createAriConfig = mutation({
  args: {
    workspaceId: v.string(),
    botName: v.string(),
    greetingStyle: v.string(),
    language: v.string(),
    communityLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const id = await ctx.db.insert("ariConfig", {
      workspace_id: args.workspaceId as any,
      bot_name: args.botName,
      greeting_style: args.greetingStyle,
      language: args.language,
      community_link: args.communityLink,
      created_at: now,
      updated_at: now,
    });

    return { id, message: "ariConfig created successfully" };
  },
});
