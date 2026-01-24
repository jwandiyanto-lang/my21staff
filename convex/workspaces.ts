/**
 * Workspace query functions for Convex.
 *
 * These functions provide workspace data access for API routes,
 * including workspace lookup by ID, slug, and Kapso phone ID.
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a workspace by ID with settings.
 *
 * Used by API routes to fetch workspace settings including
 * Kapso credentials for message sending.
 *
 * @param workspace_id - The workspace ID to look up
 * @returns Workspace document with settings or null if not found
 */
export const getById = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.id as any);
    return workspace;
  },
});

/**
 * Get a workspace by slug.
 *
 * Used for routing (e.g., my21staff.com/[slug]/dashboard).
 *
 * @param slug - The workspace slug to look up
 * @returns Workspace document or null if not found
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return workspace;
  },
});

/**
 * Get a workspace by Kapso phone ID (internal version).
 *
 * Used by Kapso webhook handler to identify the workspace
 * for an incoming message.
 *
 * @param kapso_phone_id - The Kapso phone_number_id to look up
 * @returns Workspace document or null if not found
 */
export const getByKapsoPhoneId = internalQuery({
  args: {
    kapso_phone_id: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .filter((q) => q.eq(q.field("kapso_phone_id"), args.kapso_phone_id))
      .first();
    return workspace;
  },
});

/**
 * Get a workspace by Kapso phone ID (webhook version).
 *
 * Used by Kapso webhook handler to identify the workspace
 * for an incoming message. No auth check - webhook validates signature.
 *
 * @param kapso_phone_id - The Kapso phone_number_id to look up
 * @returns Workspace document or null if not found
 */
export const getByKapsoPhoneIdWebhook = query({
  args: {
    kapso_phone_id: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .filter((q) => q.eq(q.field("kapso_phone_id"), args.kapso_phone_id))
      .first();
    return workspace;
  },
});

/**
 * Get workspace ID by slug (internal version).
 *
 * Used by internal operations that only need the workspace ID.
 *
 * @param slug - The workspace slug to look up
 * @returns Workspace ID or null if not found
 */
export const getIdBySlug = internalQuery({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return workspace?._id || null;
  },
});

/**
 * Create a new workspace.
 *
 * Used for initial setup or migration.
 *
 * @param name - Workspace display name
 * @param slug - Workspace slug for URL routing
 * @param owner_id - Owner user ID (Clerk user ID)
 * @param kapso_phone_id - Optional Kapso phone ID for WhatsApp
 * @returns Created workspace ID
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    owner_id: v.string(),
    kapso_phone_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workspaces", {
      name: args.name,
      slug: args.slug,
      owner_id: args.owner_id,
      kapso_phone_id: args.kapso_phone_id,
      settings: {},
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * Get workspace membership for a specific user.
 *
 * Used by workspace-auth helper to verify user has access to workspace.
 *
 * @param workspace_id - The workspace ID to check
 * @param user_id - The user ID (Clerk user ID) to check
 * @returns Membership document or null if not found
 */
export const getMembership = query({
  args: {
    workspace_id: v.string(),
    user_id: v.string()
  },
  handler: async (ctx, { workspace_id, user_id }) => {
    return await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", q =>
        q.eq("workspace_id", workspace_id).eq("user_id", user_id)
      )
      .first();
  },
});

/**
 * Update workspace settings.
 *
 * Used by settings API routes to update workspace configuration.
 *
 * @param workspace_id - The workspace ID to update
 * @param updates - Fields to update (name, settings, etc.)
 * @returns Success status
 */
export const updateSettings = mutation({
  args: {
    workspace_id: v.string(),
    name: v.optional(v.string()),
    settings: v.optional(v.any()),
    kapso_phone_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { workspace_id, ...updates } = args;

    const workspace = await ctx.db.get(workspace_id as any);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    await ctx.db.patch(workspace_id as any, {
      ...updates,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * List all workspaces (admin only).
 *
 * Used by super-admin routes to view all client workspaces.
 *
 * @returns Array of all workspaces
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    return workspaces;
  },
});

/**
 * Remove a member from workspace.
 *
 * Used by member management API routes.
 *
 * @param member_id - The workspaceMembers ID to remove
 * @returns Success status
 */
export const removeMember = mutation({
  args: { member_id: v.string() },
  handler: async (ctx, { member_id }) => {
    const member = await ctx.db.get(member_id as any);
    if (!member) {
      throw new Error("Member not found");
    }
    await ctx.db.delete(member_id as any);
    return { success: true };
  },
});

/**
 * Update member role in workspace.
 *
 * Used by role management API routes.
 *
 * @param member_id - The workspaceMembers ID to update
 * @param role - New role (owner, admin, member)
 * @returns Success status
 */
export const updateMemberRole = mutation({
  args: { member_id: v.string(), role: v.string() },
  handler: async (ctx, { member_id, role }) => {
    const member = await ctx.db.get(member_id as any);
    if (!member) {
      throw new Error("Member not found");
    }
    if (!['owner', 'admin', 'member'].includes(role)) {
      throw new Error("Invalid role");
    }
    await ctx.db.patch(member_id as any, { role, updated_at: Date.now() });
    return { success: true };
  },
});

/**
 * Get Kapso credentials for a workspace (webhook version).
 *
 * Used by Kapso webhook and ARI processor to send messages.
 * No auth check - webhook validates signature.
 *
 * Returns meta_access_token and kapso_phone_id for message sending.
 *
 * @param workspace_id - The workspace ID
 * @returns Object with meta_access_token and kapso_phone_id, or null
 */
export const getKapsoCredentials = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspace_id as any);
    if (!workspace) {
      return null;
    }

    // Return only the fields needed for Kapso API calls
    return {
      meta_access_token: workspace.meta_access_token || null,
      kapso_phone_id: workspace.kapso_phone_id || null,
    };
  },
});
