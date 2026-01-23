/**
 * Convex functions for users.
 *
 * These functions handle user data synced from Clerk via webhook.
 * Internal mutations are called by the webhook endpoint.
 * Query is public for app to fetch user data.
 */

import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

/**
 * Get a user by their Clerk ID.
 *
 * @param clerk_id - The Clerk user ID
 * @returns The user document or null
 */
export const getUserByClerkId = query({
  args: { clerk_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.clerk_id))
      .unique();
  },
});

// ============================================
// INTERNAL MUTATIONS (called by webhook)
// ============================================

/**
 * Create a new user from Clerk webhook.
 *
 * Idempotent - skips if user already exists.
 *
 * @param clerk_id - The Clerk user ID
 * @param workspace_id - Optional workspace to associate
 * @returns The user ID
 */
export const createUser = internalMutation({
  args: {
    clerk_id: v.string(),
    workspace_id: v.optional(v.id("workspaces")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already exists (idempotent)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.clerk_id))
      .unique();

    if (existing) {
      console.log(`[Users] User ${args.clerk_id} already exists, skipping create`);
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerk_id: args.clerk_id,
      workspace_id: args.workspace_id,
      created_at: now,
      updated_at: now,
    });

    console.log(`[Users] Created user ${args.clerk_id}`);
    return userId;
  },
});

/**
 * Update a user from Clerk webhook.
 *
 * Creates user if doesn't exist (handles webhook ordering issues).
 *
 * @param clerk_id - The Clerk user ID
 * @param workspace_id - Optional workspace to associate
 * @returns The user ID
 */
export const updateUser = internalMutation({
  args: {
    clerk_id: v.string(),
    workspace_id: v.optional(v.id("workspaces")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.clerk_id))
      .unique();

    if (!user) {
      console.log(`[Users] User ${args.clerk_id} not found for update, creating instead`);
      // Create if doesn't exist (handles webhook ordering issues)
      return await ctx.db.insert("users", {
        clerk_id: args.clerk_id,
        workspace_id: args.workspace_id,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    }

    await ctx.db.patch(user._id, {
      workspace_id: args.workspace_id ?? user.workspace_id,
      updated_at: Date.now(),
    });

    console.log(`[Users] Updated user ${args.clerk_id}`);
    return user._id;
  },
});

/**
 * Delete a user from Clerk webhook.
 *
 * @param clerk_id - The Clerk user ID
 * @returns The deleted user ID or null if not found
 */
export const deleteUser = internalMutation({
  args: { clerk_id: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.clerk_id))
      .unique();

    if (!user) {
      console.log(`[Users] User ${args.clerk_id} not found for deletion`);
      return null;
    }

    await ctx.db.delete(user._id);
    console.log(`[Users] Deleted user ${args.clerk_id}`);
    return user._id;
  },
});

// ============================================
// WEBHOOK AUDIT (called by webhook)
// ============================================

/**
 * Log a webhook event for debugging.
 *
 * @param event_type - The webhook event type (e.g., 'user.created')
 * @param clerk_id - The Clerk user ID (if applicable)
 * @param payload - The raw webhook payload
 * @param status - 'success' or 'error'
 * @param error_message - Error message if status is 'error'
 * @returns The audit log ID
 */
export const logWebhookEvent = internalMutation({
  args: {
    event_type: v.string(),
    clerk_id: v.optional(v.string()),
    payload: v.any(),
    status: v.string(),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhookAudit", {
      event_type: args.event_type,
      clerk_id: args.clerk_id,
      payload: args.payload,
      status: args.status,
      error_message: args.error_message,
      processed_at: Date.now(),
    });
  },
});
