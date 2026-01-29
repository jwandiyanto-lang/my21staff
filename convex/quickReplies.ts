import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// List all quick replies for a workspace
export const list = query({
  args: { workspace_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quickReplies")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .order("desc")
      .collect();
  },
});

// Create a new quick reply
export const create = mutation({
  args: {
    workspace_id: v.string(),
    shortcut: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check for duplicate shortcut in this workspace
    const existing = await ctx.db
      .query("quickReplies")
      .withIndex("by_shortcut", (q) =>
        q.eq("workspace_id", args.workspace_id).eq("shortcut", args.shortcut)
      )
      .first();

    if (existing) {
      throw new Error("A quick reply with this shortcut already exists");
    }

    const now = Date.now();
    return await ctx.db.insert("quickReplies", {
      workspace_id: args.workspace_id,
      shortcut: args.shortcut,
      message: args.message,
      created_by: userId,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update an existing quick reply
export const update = mutation({
  args: {
    id: v.id("quickReplies"),
    shortcut: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Quick reply not found");

    // If shortcut is being changed, check for duplicates
    if (args.shortcut && args.shortcut !== existing.shortcut) {
      const duplicate = await ctx.db
        .query("quickReplies")
        .withIndex("by_shortcut", (q) =>
          q.eq("workspace_id", existing.workspace_id).eq("shortcut", args.shortcut!)
        )
        .first();

      if (duplicate && duplicate._id !== args.id) {
        throw new Error("A quick reply with this shortcut already exists");
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.shortcut && { shortcut: args.shortcut }),
      ...(args.message && { message: args.message }),
      updated_at: Date.now(),
    });

    return args.id;
  },
});

// Delete a quick reply
export const remove = mutation({
  args: {
    id: v.id("quickReplies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return args.id;
  },
});
