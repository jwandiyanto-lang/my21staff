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
 * Get a workspace by ID (internal version for API routes).
 *
 * Used by /api/messages/send to get workspace with Kapso credentials.
 * No workspace membership check - API route handles authorization.
 */
export const getByIdInternal = query({
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
 * Get a workspace by Clerk organization ID.
 *
 * Used during onboarding to find workspace for a user's organization.
 *
 * @param clerk_org_id - The Clerk organization ID to look up
 * @returns Workspace document or null if not found
 */
export const getByOrgId = query({
  args: {
    clerk_org_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Find organization first
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerk_org_id", args.clerk_org_id))
      .first();

    if (!org || !org.workspace_id) {
      return null;
    }

    // Get workspace
    const workspace = await ctx.db.get(org.workspace_id);
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
      .withIndex("by_user_workspace", q =>
        q.eq("user_id", user_id).eq("workspace_id", workspace_id)
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

/**
 * Get Kapso credential status for a workspace.
 *
 * Used to check if a workspace has Kapso credentials configured
 * without exposing the actual credentials.
 *
 * @param slug - The workspace slug to check
 * @returns Object with hasKapsoPhoneId and hasMetaAccessToken booleans, or null if not found
 */
export const getWorkspaceKapsoStatus = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!workspace) {
      return null;
    }

    return {
      workspace_id: workspace._id,
      name: workspace.name,
      slug: workspace.slug,
      hasKapsoPhoneId: !!workspace.kapso_phone_id,
      hasMetaAccessToken: !!workspace.meta_access_token,
    };
  },
});

/**
 * Get lead status configuration for a workspace.
 *
 * Returns custom lead statuses if configured, otherwise returns
 * default statuses that align with Brain's temperature mapping.
 *
 * @param workspaceId - The workspace ID
 * @returns Array of status configurations with keys, labels, colors, and temperature mappings
 */
export const getStatusConfig = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return null;

    // Return custom config or default
    const customConfig = workspace.settings?.lead_statuses;
    if (customConfig && Array.isArray(customConfig) && customConfig.length > 0) {
      return customConfig;
    }

    // Default status configuration matching Brain's temperature mapping
    return [
      { key: "new", label: "New", color: "#6B7280", bgColor: "#F3F4F6", temperature: null },
      { key: "cold", label: "Cold Lead", color: "#3B82F6", bgColor: "#DBEAFE", temperature: "cold" },
      { key: "warm", label: "Warm Lead", color: "#F59E0B", bgColor: "#FEF3C7", temperature: "warm" },
      { key: "hot", label: "Hot Lead", color: "#DC2626", bgColor: "#FEE2E2", temperature: "hot" },
      { key: "client", label: "Client", color: "#10B981", bgColor: "#D1FAE5", temperature: null },
      { key: "lost", label: "Lost", color: "#4B5563", bgColor: "#E5E7EB", temperature: null },
    ];
  },
});

/**
 * Update lead status configuration for a workspace.
 *
 * Allows workspaces to customize their lead status stages and labels.
 *
 * @param workspaceId - The workspace ID
 * @param leadStatuses - Array of status configurations
 * @returns Success status
 */
export const updateStatusConfig = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    leadStatuses: v.array(v.object({
      key: v.string(),
      label: v.string(),
      color: v.string(),
      bgColor: v.string(),
      temperature: v.union(v.literal("hot"), v.literal("warm"), v.literal("cold"), v.null()),
    }))
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    await ctx.db.patch(args.workspaceId, {
      settings: {
        ...workspace.settings,
        lead_statuses: args.leadStatuses,
      },
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update Kapso credentials for a workspace.
 *
 * Used to configure kapso_phone_id and meta_access_token for WhatsApp integration.
 * This is an internal mutation - credentials should be set via Convex dashboard or CLI.
 *
 * @param workspace_id - The workspace ID to update
 * @param kapso_phone_id - The Kapso phone_number_id from Meta
 * @param meta_access_token - The Meta/Kapso API access token
 * @returns Success status
 */
export const updateKapsoCredentials = mutation({
  args: {
    workspace_id: v.string(),
    kapso_phone_id: v.optional(v.string()),
    meta_access_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { workspace_id, kapso_phone_id, meta_access_token } = args;

    const workspace = await ctx.db.get(workspace_id as any);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const updates: Record<string, unknown> = {
      updated_at: Date.now(),
    };

    if (kapso_phone_id !== undefined) {
      updates.kapso_phone_id = kapso_phone_id;
    }

    if (meta_access_token !== undefined) {
      updates.meta_access_token = meta_access_token;
    }

    await ctx.db.patch(workspace_id as any, updates);

    console.log(
      `[Workspace] Updated Kapso credentials for workspace ${workspace.slug}: ` +
        `phone_id=${kapso_phone_id ? "set" : "unchanged"}, ` +
        `token=${meta_access_token ? "set" : "unchanged"}`
    );

    return { success: true };
  },
});

/**
 * Get workspace with Kapso settings for API routes.
 *
 * Used by Kapso API routes (/api/kapso/*) to get workspace credentials.
 * Returns workspace with settings including kapso_api_key.
 *
 * @param workspaceId - The workspace ID (string format)
 * @returns Workspace document with settings or null if not found
 */
export const getForKapso = query({
  args: {
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId as any);
    return workspace;
  },
});
