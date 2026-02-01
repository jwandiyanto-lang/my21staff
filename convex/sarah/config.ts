import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Default configuration values for new workspaces
 */
const DEFAULT_CONFIG = {
  bot_name: "Your Intern",
  language: "id",
  pronoun: "Kamu",
  trial_link: "https://my21staff.com/trial",
};

/**
 * Get Sarah configuration for a workspace.
 * Returns the saved config or default values if none exists.
 */
export const getConfig = query({
  args: {
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("sarahConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .first();

    if (config) {
      return config;
    }

    // Return default config for new workspaces
    return {
      workspace_id: args.workspace_id,
      ...DEFAULT_CONFIG,
      created_at: 0,
      updated_at: 0,
    };
  },
});

/**
 * Update Sarah configuration for a workspace.
 * Creates new config if none exists, updates existing if present.
 * Validates all input fields before saving.
 */
export const updateConfig = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    bot_name: v.string(),
    language: v.string(),
    pronoun: v.string(),
    trial_link: v.string(),
  },
  handler: async (ctx, args) => {
    const { workspace_id, bot_name, language, pronoun, trial_link } = args;
    const now = Date.now();

    // Validate bot_name: 1-50 characters
    if (bot_name.length < 1 || bot_name.length > 50) {
      throw new Error("bot_name must be between 1 and 50 characters");
    }

    // Validate language: must be "id" or "en"
    if (language !== "id" && language !== "en") {
      throw new Error("language must be 'id' or 'en'");
    }

    // Validate pronoun: must be "Kamu" or "Anda"
    if (pronoun !== "Kamu" && pronoun !== "Anda") {
      throw new Error("pronoun must be 'Kamu' or 'Anda'");
    }

    // Validate trial_link: must be valid URL starting with https://
    if (!trial_link.startsWith("https://")) {
      throw new Error("trial_link must start with https://");
    }
    try {
      new URL(trial_link);
    } catch {
      throw new Error("trial_link must be a valid URL");
    }

    // Check if config already exists
    const existingConfig = await ctx.db
      .query("sarahConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspace_id))
      .first();

    let configId;

    if (existingConfig) {
      // Update existing config
      configId = existingConfig._id;
      await ctx.db.patch(existingConfig._id, {
        bot_name,
        language,
        pronoun,
        trial_link,
        updated_at: now,
      });
    } else {
      // Create new config
      configId = await ctx.db.insert("sarahConfigs", {
        workspace_id,
        bot_name,
        language,
        pronoun,
        trial_link,
        created_at: now,
        updated_at: now,
      });
    }

    return { success: true, configId };
  },
});

/**
 * Get Sarah configuration by Kapso phone ID.
 * Used by Kapso function nodes to fetch config without workspace_id.
 *
 * Flow:
 * 1. Lookup workspace by kapso_phone_id
 * 2. Lookup sarahConfigs by workspace_id
 * 3. Return config or DEFAULT_CONFIG if not found
 */
export const getConfigByPhone = query({
  args: {
    phone_id: v.string(), // The Kapso phone_number_id
  },
  handler: async (ctx, args) => {
    // Step 1: Find workspace by kapso_phone_id
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_kapso_phone", (q) => q.eq("kapso_phone_id", args.phone_id))
      .first();

    if (!workspace) {
      // No workspace found for this phone, return defaults
      return {
        ...DEFAULT_CONFIG,
        workspace_id: null,
        created_at: 0,
        updated_at: 0,
      };
    }

    // Step 2: Find sarahConfigs by workspace_id
    const config = await ctx.db
      .query("sarahConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspace._id))
      .first();

    if (config) {
      return config;
    }

    // Step 3: Return default config if no config exists
    return {
      workspace_id: workspace._id,
      ...DEFAULT_CONFIG,
      created_at: 0,
      updated_at: 0,
    };
  },
});
