import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new backup of settings configuration.
 * Updates workspace sync status to 'synced' on success, 'error' on failure.
 */
export const createBackup = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    backup_type: v.string(), // 'intern_config', 'brain_config', 'bot_names', 'full'
    config_data: v.any(),
    source: v.string(), // 'user_save', 'auto_backup', 'import'
    created_by: v.optional(v.string()), // Clerk user ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create backup record
    const backupId = await ctx.db.insert("settingsBackup", {
      workspace_id: args.workspace_id,
      backup_type: args.backup_type,
      config_data: args.config_data,
      source: args.source,
      created_at: now,
      created_by: args.created_by,
    });

    // Update workspace sync status
    await ctx.db.patch(args.workspace_id, {
      last_settings_sync: now,
      settings_sync_status: "synced",
      settings_sync_error: undefined, // Clear any previous errors
    });

    return { backupId, syncedAt: now };
  },
});

/**
 * Get the latest backup for a specific type.
 */
export const getLatestBackup = query({
  args: {
    workspace_id: v.id("workspaces"),
    backup_type: v.string(),
  },
  handler: async (ctx, args) => {
    const backup = await ctx.db
      .query("settingsBackup")
      .withIndex("by_workspace_type", (q) =>
        q.eq("workspace_id", args.workspace_id).eq("backup_type", args.backup_type)
      )
      .order("desc")
      .first();

    return backup;
  },
});

/**
 * List all backups for a workspace with pagination.
 */
export const listBackups = query({
  args: {
    workspace_id: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const backups = await ctx.db
      .query("settingsBackup")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .order("desc")
      .take(limit);

    return backups;
  },
});

/**
 * Restore configuration from a backup.
 * This returns the config data - actual restoration is handled by the client/API.
 */
export const restoreFromBackup = query({
  args: {
    workspace_id: v.id("workspaces"),
    backup_id: v.id("settingsBackup"),
  },
  handler: async (ctx, args) => {
    const backup = await ctx.db.get(args.backup_id);

    if (!backup) {
      throw new Error("Backup not found");
    }

    if (backup.workspace_id !== args.workspace_id) {
      throw new Error("Backup does not belong to this workspace");
    }

    return {
      backup_type: backup.backup_type,
      config_data: backup.config_data,
      created_at: backup.created_at,
      source: backup.source,
    };
  },
});

/**
 * Get current sync status for a workspace.
 */
export const getSyncStatus = query({
  args: {
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspace_id);

    if (!workspace) {
      return {
        status: "unknown",
        lastSync: null,
        error: null,
      };
    }

    return {
      status: workspace.settings_sync_status ?? "pending",
      lastSync: workspace.last_settings_sync ?? null,
      error: workspace.settings_sync_error ?? null,
    };
  },
});

/**
 * Mark sync as error (called by API route when backup fails).
 */
export const markSyncError = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    error_message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workspace_id, {
      settings_sync_status: "error",
      settings_sync_error: args.error_message,
      last_settings_sync: Date.now(),
    });
  },
});
