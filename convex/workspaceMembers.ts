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
 * Get workspace member by ID.
 *
 * Used by API routes to fetch member details for deletion or updates.
 *
 * @param id - The workspaceMembers ID to fetch
 * @returns Membership document or null if not found
 */
export const getById = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id as any);
    return member;
  },
});

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

/**
 * List all workspace members with their user profile data.
 *
 * Joins workspaceMembers with users table to provide profile info.
 * Used by UI components that display team member names.
 *
 * @param workspace_id - The workspace to list members for
 * @returns Array of workspace members with joined user profile data
 */
export const listByWorkspaceWithUsers = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();

    // Join with users table to get profile data
    const membersWithUsers = await Promise.all(
      members.map(async (m) => {
        // Look up user by Clerk ID (user_id in members is Clerk ID)
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", m.user_id))
          .first();

        return {
          _id: m._id,
          user_id: m.user_id,
          workspace_id: m.workspace_id,
          role: m.role,
          created_at: m.created_at,
          user: user
            ? {
                name: user.name || null,
                email: user.email || null,
              }
            : null,
        };
      })
    );

    return membersWithUsers;
  },
});

/**
 * Get workspace member by user ID and workspace ID (public version).
 *
 * Used by API routes to validate workspace membership
 * (e.g., when assigning a ticket to a user).
 *
 * @param userId - The user ID (Clerk ID) to check
 * @param workspaceId - The workspace to check membership in
 * @returns Membership document or null if not found
 */
export const getByUserAndWorkspace = query({
  args: {
    userId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("user_id", args.userId).eq("workspace_id", args.workspaceId)
      )
      .first();
    return membership;
  },
});
