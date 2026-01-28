/**
 * Authorization helpers for Convex functions.
 *
 * These functions implement workspace-scoped access control, replacing
 * Supabase Row Level Security (RLS) policies with server-side authorization.
 */

import { query, mutation } from "../_generated/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Verifies that a user is authenticated using Clerk.
 *
 * @param ctx - Query or mutation context
 * @returns The authenticated user's ID (Clerk user ID)
 * @throws Error if not authenticated
 */
export async function requireAuthentication(
  ctx: QueryCtx | MutationContext
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity.subject;
}

/**
 * Verifies that a user is a member of the specified workspace.
 *
 * This is the primary authorization check for workspace-scoped data access.
 * It replaces Supabase RLS policies that check workspace membership.
 *
 * @param ctx - Query or mutation context
 * @param workspaceId - The workspace ID to check membership for
 * @returns Object containing userId and membership document
 * @throws Error if not authenticated or not a workspace member
 */
export async function requireWorkspaceMembership(
  ctx: QueryCtx | MutationContext,
  workspaceId: string
): Promise<{ userId: string; membership: any }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  const userId = identity.subject;

  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user_workspace", (q: any) =>
      q.eq("user_id", userId).eq("workspace_id", workspaceId)
    )
    .first();

  if (!membership) {
    throw new Error("Not a member of this workspace");
  }

  return { userId, membership };
}

/**
 * Type alias for MutationContext since it's not exported directly
 * from generated files
 */
export type MutationContext = MutationCtx;
