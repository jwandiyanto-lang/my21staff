/**
 * Workspace member query functions for Convex.
 *
 * These functions provide workspace membership verification
 * and member listing for authorization purposes.
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get workspace membership for a specific user.
 *
 * Used to verify membership and get role.
 * Internal version for API routes that handle their own auth.
 *
 * @param workspace_id - The workspace to check
 * @param user_id - The user ID to check membership for
 * @returns Membership document with role or null if not found
 */
export const getByUserWorkspace = internalQuery({
  args: {
    workspace_id: v.string(),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("user_id", args.user_id).eq("workspace_id", args.workspace_id)
      )
      .first();
    return membership;
  },
});

/**
 * List all workspace members.
 *
 * Used by inbox filter dropdowns and team member display.
 * Returns members without full profile data (profile data
 * comes from auth context/Supabase profiles table).
 *
 * @param workspace_id - The workspace to list members for
 * @returns Array of workspace members with user_id and role
 */
export const listByWorkspace = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();

    return members.map((m) => ({
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
    }));
  },
});

/**
 * Check if a user is a member of a workspace.
 *
 * Returns membership info if found, null otherwise.
 *
 * @param workspace_id - The workspace to check
 * @param user_id - The user ID to check
 * @returns Membership document or null
 */
export const checkMembership = internalQuery({
  args: {
    workspace_id: v.string(),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("user_id", args.user_id).eq("workspace_id", args.workspace_id)
      )
      .first();
    return membership;
  },
});
