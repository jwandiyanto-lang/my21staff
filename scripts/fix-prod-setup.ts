/**
 * Fix production setup script
 *
 * This script will:
 * 1. Create a user record for your Clerk user
 * 2. Create ARI config for the workspace
 *
 * Usage: CLERK_USER_ID=user_xxx WORKSPACE_ID=js773xxx npx tsx scripts/fix-prod-setup.ts
 */

import { mutation, internalMutation } from '../convex/_generated/server.js';
import { v } from 'convex/values';

// Mutation to create user record
export const createUserRecord = internalMutation({
  args: {
    clerk_id: v.string(),
  },
  handler: async (ctx, { clerk_id }) => {
    const now = Date.now();

    // Check if user exists
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerk_id', clerk_id))
      .first();

    if (existing) {
      console.log('  ✓ User already exists:', existing._id);
      return existing._id;
    }

    // Create user
    const userId = await ctx.db.insert('users', {
      clerk_id,
      workspace_id: undefined,
      created_at: now,
      updated_at: now,
    });

    console.log('  ✓ Created user record:', userId);
    return userId;
  },
});

// Mutation to create ARI config
export const createAriConfig = internalMutation({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, { workspace_id }) => {
    const now = Date.now();

    // Check if config exists
    const existing = await ctx.db
      .query('ariConfig')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', workspace_id))
      .first();

    if (existing) {
      console.log('  ✓ ARI config already exists');
      return existing._id;
    }

    // Create default ARI config
    const configId = await ctx.db.insert('ariConfig', {
      workspace_id,
      bot_name: 'Your Intern',
      greeting_style: 'professional',
      language: 'id',
      enabled: true,
      created_at: now,
      updated_at: now,
    });

    console.log('  ✓ Created ARI config:', configId);
    return configId;
  },
});
