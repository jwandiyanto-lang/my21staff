/**
 * Workspace query functions for Convex.
 *
 * These functions provide workspace data access for API routes,
 * including workspace lookup by ID, slug, and Kapso phone ID.
 */

import { query, internalQuery } from "./_generated/server";
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
export const getById = internalQuery({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspace_id as any);
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
 * Get a workspace by Kapso phone ID.
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
