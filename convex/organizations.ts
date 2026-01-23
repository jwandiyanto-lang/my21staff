import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Organization CRUD mutations for Clerk webhook handling.
 * All mutations are idempotent to handle webhook retries.
 */

// ============================================
// CREATE ORGANIZATION
// Called on organization.created webhook event
// ============================================
export const createOrganization = internalMutation({
  args: {
    clerk_org_id: v.string(),
    name: v.string(),
    slug: v.string(),
    workspace_id: v.optional(v.string()), // convexWorkspaceId from public_metadata
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if organization already exists (idempotent)
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerk_org_id", args.clerk_org_id))
      .first();

    if (existing) {
      console.log(`[Organizations] Organization ${args.clerk_org_id} already exists, skipping create`);
      return existing._id;
    }

    // Parse workspace_id if provided
    let workspaceId = undefined;
    if (args.workspace_id) {
      try {
        // Validate that the workspace exists
        const workspace = await ctx.db.get(args.workspace_id as any);
        if (workspace) {
          workspaceId = args.workspace_id as any;
        } else {
          console.log(`[Organizations] Workspace ${args.workspace_id} not found, creating org without link`);
        }
      } catch {
        console.log(`[Organizations] Invalid workspace_id format: ${args.workspace_id}`);
      }
    }

    const orgId = await ctx.db.insert("organizations", {
      clerk_org_id: args.clerk_org_id,
      workspace_id: workspaceId,
      name: args.name,
      slug: args.slug,
      created_at: now,
      updated_at: now,
    });

    console.log(`[Organizations] Created organization ${args.clerk_org_id} -> ${orgId}`);
    return orgId;
  },
});

// ============================================
// UPDATE ORGANIZATION
// Called on organization.updated webhook event
// ============================================
export const updateOrganization = internalMutation({
  args: {
    clerk_org_id: v.string(),
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerk_org_id", args.clerk_org_id))
      .first();

    if (!existing) {
      // Organization doesn't exist - create it (handles webhook ordering)
      console.log(`[Organizations] Organization ${args.clerk_org_id} not found, creating on update`);
      const orgId = await ctx.db.insert("organizations", {
        clerk_org_id: args.clerk_org_id,
        workspace_id: undefined,
        name: args.name,
        slug: args.slug,
        created_at: now,
        updated_at: now,
      });
      return orgId;
    }

    await ctx.db.patch(existing._id, {
      name: args.name,
      slug: args.slug,
      updated_at: now,
    });

    console.log(`[Organizations] Updated organization ${args.clerk_org_id}`);
    return existing._id;
  },
});

// ============================================
// DELETE ORGANIZATION
// Called on organization.deleted webhook event
// ============================================
export const deleteOrganization = internalMutation({
  args: {
    clerk_org_id: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerk_org_id", args.clerk_org_id))
      .first();

    if (!existing) {
      console.log(`[Organizations] Organization ${args.clerk_org_id} not found for deletion`);
      return;
    }

    // Delete all organization members first
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) => q.eq("organization_id", existing._id))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    await ctx.db.delete(existing._id);
    console.log(`[Organizations] Deleted organization ${args.clerk_org_id} with ${members.length} members`);
  },
});

// ============================================
// ADD MEMBER
// Called on organizationMembership.created webhook event
// ============================================
export const addMember = internalMutation({
  args: {
    clerk_org_id: v.string(),
    clerk_user_id: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the organization
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerk_org_id", args.clerk_org_id))
      .first();

    if (!org) {
      console.error(`[Organizations] Cannot add member: org ${args.clerk_org_id} not found`);
      // This could happen if membership webhook arrives before org.created
      // We could queue for retry or create placeholder org
      return null;
    }

    // Check if member already exists (idempotent)
    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organization_id", org._id).eq("clerk_user_id", args.clerk_user_id)
      )
      .first();

    if (existing) {
      console.log(`[Organizations] Member ${args.clerk_user_id} already in org ${args.clerk_org_id}`);
      return existing._id;
    }

    const memberId = await ctx.db.insert("organizationMembers", {
      organization_id: org._id,
      clerk_user_id: args.clerk_user_id,
      role: args.role,
      created_at: now,
      updated_at: now,
    });

    console.log(`[Organizations] Added member ${args.clerk_user_id} to org ${args.clerk_org_id} as ${args.role}`);
    return memberId;
  },
});

// ============================================
// UPDATE MEMBER ROLE
// Called on organizationMembership.updated webhook event
// ============================================
export const updateMemberRole = internalMutation({
  args: {
    clerk_org_id: v.string(),
    clerk_user_id: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the organization
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerk_org_id", args.clerk_org_id))
      .first();

    if (!org) {
      console.error(`[Organizations] Cannot update member role: org ${args.clerk_org_id} not found`);
      return null;
    }

    // Find the member
    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organization_id", org._id).eq("clerk_user_id", args.clerk_user_id)
      )
      .first();

    if (!existing) {
      // Member doesn't exist - create them (handles webhook ordering)
      console.log(`[Organizations] Member ${args.clerk_user_id} not found, creating on role update`);
      const memberId = await ctx.db.insert("organizationMembers", {
        organization_id: org._id,
        clerk_user_id: args.clerk_user_id,
        role: args.role,
        created_at: now,
        updated_at: now,
      });
      return memberId;
    }

    await ctx.db.patch(existing._id, {
      role: args.role,
      updated_at: now,
    });

    console.log(`[Organizations] Updated member ${args.clerk_user_id} role to ${args.role}`);
    return existing._id;
  },
});

// ============================================
// REMOVE MEMBER
// Called on organizationMembership.deleted webhook event
// ============================================
export const removeMember = internalMutation({
  args: {
    clerk_org_id: v.string(),
    clerk_user_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the organization
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerk_org_id", args.clerk_org_id))
      .first();

    if (!org) {
      console.log(`[Organizations] Cannot remove member: org ${args.clerk_org_id} not found`);
      return;
    }

    // Find the member
    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organization_id", org._id).eq("clerk_user_id", args.clerk_user_id)
      )
      .first();

    if (!existing) {
      console.log(`[Organizations] Member ${args.clerk_user_id} not found in org ${args.clerk_org_id}`);
      return;
    }

    await ctx.db.delete(existing._id);
    console.log(`[Organizations] Removed member ${args.clerk_user_id} from org ${args.clerk_org_id}`);
  },
});
