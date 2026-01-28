/**
 * Create production workspace script
 *
 * Run this to create a workspace for your production organization.
 * Then update Clerk organization public_metadata with the returned workspace ID.
 */

import { mutation, internalMutation } from './_generated/server.js';
import { v } from 'convex/values';

// This mutation creates a workspace
export const createProductionWorkspace = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    owner_id: v.string(),
  },
  handler: async (ctx, { name, slug, owner_id }) => {
    const now = Date.now();
    const workspaceId = await ctx.db.insert('workspaces', {
      name,
      slug,
      owner_id,
      created_at: now,
      updated_at: now,
      settings: {},
    });
    return workspaceId;
  },
});
