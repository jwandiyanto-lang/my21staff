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

  const clerkId = identity.subject;

  // Look up user by Clerk ID to get their Convex user document
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerk_id", clerkId))
    .first();

  // Auto-create user if doesn't exist (handles webhook delays or missing webhooks)
  if (!user) {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerk_id: clerkId,
      workspace_id: undefined,
      created_at: now,
      updated_at: now,
    });
    user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Failed to create user");
    }
  }

  // Find the organization that owns this workspace
  const organization = await ctx.db
    .query("organizations")
    .withIndex("by_workspace", (q: any) => q.eq("workspace_id", workspaceId))
    .first();

  if (!organization) {
    throw new Error("Workspace not linked to an organization");
  }

  // Check if user is a member of this organization (Clerk-based membership)
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_user", (q: any) =>
      q.eq("organization_id", organization._id).eq("clerk_user_id", clerkId)
    )
    .first();

  if (!membership) {
    throw new Error("Not a member of this workspace");
  }

  return { userId: user._id, membership };
}

/**
 * Type alias for MutationContext since it's not exported directly
 * from generated files
 */
export type MutationContext = MutationCtx;
