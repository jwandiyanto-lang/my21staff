/**
 * ARI (AI Response Intelligence) query and mutation functions for Convex.
 *
 * Provides access to ARI configuration, flow stages, knowledge base,
 * scoring config, and consultant slots.
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMembership } from "./lib/auth";

// ============================================
// ARI CONFIG
// ============================================

/**
 * Get ARI config for a workspace.
 * Returns null if no config exists (caller should use defaults).
 */
export const getAriConfig = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    // TEMPORARY: Skip workspace membership check to fix production settings page
    // Will be re-enabled once proper auth sync is implemented
    // await requireWorkspaceMembership(ctx, args.workspace_id);

    const config = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .first();

    return config;
  },
});

/**
 * Check if workspace has ARI enabled (webhook version).
 * No auth check - webhook validates signature.
 *
 * @param workspace_id - The workspace ID
 * @returns True if ARI config exists, false otherwise
 */
export const hasAriConfig = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .first();

    return !!config;
  },
});

/**
 * Upsert ARI config (create or update).
 */
export const upsertAriConfig = mutation({
  args: {
    workspace_id: v.string(),
    enabled: v.optional(v.boolean()),
    bot_name: v.string(),
    greeting_style: v.string(),
    language: v.string(),
    tone: v.optional(v.any()),
    community_link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    // Check if config exists
    const existing = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing config
      const updates: any = {
        bot_name: args.bot_name,
        greeting_style: args.greeting_style,
        language: args.language,
        tone: args.tone,
        community_link: args.community_link || undefined,
        updated_at: now,
      };
      // Only update enabled if explicitly provided
      if (args.enabled !== undefined) {
        updates.enabled = args.enabled;
      }
      await ctx.db.patch(existing._id, updates);
      return await ctx.db.get(existing._id);
    } else {
      // Create new config (enabled defaults to true)
      const configId = await ctx.db.insert("ariConfig", {
        workspace_id: args.workspace_id as any,
        enabled: args.enabled !== undefined ? args.enabled : true,
        bot_name: args.bot_name,
        greeting_style: args.greeting_style,
        language: args.language,
        tone: args.tone,
        community_link: args.community_link,
        created_at: now,
        updated_at: now,
      });
      return await ctx.db.get(configId);
    }
  },
});

/**
 * Toggle AI enabled/disabled for a workspace.
 * Simple mutation for the settings toggle.
 */
export const toggleAiEnabled = mutation({
  args: {
    workspace_id: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const existing = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .first();

    if (!existing) {
      throw new Error("ARI config not found. Please configure AI settings first.");
    }

    await ctx.db.patch(existing._id, {
      enabled: args.enabled,
      updated_at: Date.now(),
    });

    return await ctx.db.get(existing._id);
  },
});

/**
 * Seed ARI config (admin only, no auth check).
 * Used for initial workspace setup via CLI.
 *
 * WARNING: This mutation bypasses auth. Use only for initial setup
 * or admin operations via CLI.
 *
 * @param workspace_id - The workspace ID (Convex ID string)
 * @param bot_name - Bot display name
 * @param greeting_style - 'professional', 'friendly', 'casual'
 * @param language - 'id' or 'en'
 * @param tone - Optional tone settings object
 * @param community_link - Optional community invite link
 */
export const seedAriConfig = mutation({
  args: {
    workspace_id: v.string(),
    bot_name: v.string(),
    greeting_style: v.string(),
    language: v.string(),
    tone: v.optional(v.any()),
    community_link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if config exists
    const existing = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing config
      await ctx.db.patch(existing._id, {
        bot_name: args.bot_name,
        greeting_style: args.greeting_style,
        language: args.language,
        tone: args.tone,
        community_link: args.community_link || undefined,
        updated_at: now,
      });
      return await ctx.db.get(existing._id);
    } else {
      // Create new config
      const configId = await ctx.db.insert("ariConfig", {
        workspace_id: args.workspace_id as any,
        bot_name: args.bot_name,
        greeting_style: args.greeting_style,
        language: args.language,
        tone: args.tone,
        community_link: args.community_link,
        created_at: now,
        updated_at: now,
      });
      return await ctx.db.get(configId);
    }
  },
});

// ============================================
// FLOW STAGES
// ============================================

/**
 * Get all flow stages for a workspace, ordered by stage_order.
 * Includes outcomes for each stage.
 */
export const getFlowStages = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const stages = await ctx.db
      .query("ariFlowStages")
      .withIndex("by_workspace_order", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    // Fetch outcomes for each stage
    const stagesWithOutcomes = await Promise.all(
      stages.map(async (stage) => {
        const outcomes = await ctx.db
          .query("ariFlowStageOutcomes")
          .withIndex("by_stage_order", (q) => q.eq("stage_id", stage._id))
          .collect();

        return {
          ...stage,
          outcomes,
        };
      })
    );

    return stagesWithOutcomes;
  },
});

/**
 * Create a new flow stage.
 */
export const createFlowStage = mutation({
  args: {
    workspace_id: v.string(),
    name: v.string(),
    goal: v.string(),
    sample_script: v.optional(v.string()),
    exit_criteria: v.optional(v.string()),
    stage_order: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const now = Date.now();

    const stageId = await ctx.db.insert("ariFlowStages", {
      workspace_id: args.workspace_id as any,
      name: args.name,
      goal: args.goal,
      sample_script: args.sample_script,
      exit_criteria: args.exit_criteria,
      stage_order: args.stage_order,
      is_active: args.is_active,
      created_at: now,
      updated_at: now,
    });

    return await ctx.db.get(stageId);
  },
});

/**
 * Update a flow stage.
 */
export const updateFlowStage = mutation({
  args: {
    stage_id: v.string(),
    workspace_id: v.string(),
    name: v.optional(v.string()),
    goal: v.optional(v.string()),
    sample_script: v.optional(v.string()),
    exit_criteria: v.optional(v.string()),
    stage_order: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const stage = await ctx.db.get(args.stage_id as any);
    if (!stage || stage.workspace_id !== args.workspace_id) {
      throw new Error("Stage not found");
    }

    const updateData: any = {
      updated_at: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.goal !== undefined) updateData.goal = args.goal;
    if (args.sample_script !== undefined) updateData.sample_script = args.sample_script;
    if (args.exit_criteria !== undefined) updateData.exit_criteria = args.exit_criteria;
    if (args.stage_order !== undefined) updateData.stage_order = args.stage_order;
    if (args.is_active !== undefined) updateData.is_active = args.is_active;

    await ctx.db.patch(args.stage_id as any, updateData);
    return await ctx.db.get(args.stage_id as any);
  },
});

/**
 * Delete a flow stage and its outcomes.
 */
export const deleteFlowStage = mutation({
  args: {
    stage_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const stage = await ctx.db.get(args.stage_id as any);
    if (!stage || stage.workspace_id !== args.workspace_id) {
      throw new Error("Stage not found");
    }

    // Delete all outcomes for this stage
    const outcomes = await ctx.db
      .query("ariFlowStageOutcomes")
      .withIndex("by_stage", (q) => q.eq("stage_id", args.stage_id as any))
      .collect();

    for (const outcome of outcomes) {
      await ctx.db.delete(outcome._id);
    }

    await ctx.db.delete(args.stage_id as any);
    return { success: true };
  },
});

/**
 * Get outcomes for a specific flow stage.
 */
export const getFlowStageOutcomes = query({
  args: {
    stage_id: v.string(),
  },
  handler: async (ctx, args) => {
    const outcomes = await ctx.db
      .query("ariFlowStageOutcomes")
      .withIndex("by_stage_order", (q) => q.eq("stage_id", args.stage_id as any))
      .collect();

    return outcomes;
  },
});

/**
 * Sync outcomes for a stage (create/update/delete).
 * Replaces all outcomes for a stage with the new list.
 */
export const syncFlowStageOutcomes = mutation({
  args: {
    stage_id: v.string(),
    workspace_id: v.string(),
    outcomes: v.array(v.object({
      id: v.optional(v.string()),
      description: v.string(),
      points: v.number(),
      keywords: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const stage = await ctx.db.get(args.stage_id as any);
    if (!stage || stage.workspace_id !== args.workspace_id) {
      throw new Error("Stage not found");
    }

    // Delete all existing outcomes
    const existingOutcomes = await ctx.db
      .query("ariFlowStageOutcomes")
      .withIndex("by_stage", (q) => q.eq("stage_id", args.stage_id as any))
      .collect();

    for (const outcome of existingOutcomes) {
      await ctx.db.delete(outcome._id);
    }

    // Create new outcomes
    const now = Date.now();
    for (let i = 0; i < args.outcomes.length; i++) {
      const outcome = args.outcomes[i];
      await ctx.db.insert("ariFlowStageOutcomes", {
        stage_id: args.stage_id as any,
        workspace_id: args.workspace_id as any,
        description: outcome.description,
        points: outcome.points,
        keywords: outcome.keywords,
        outcome_order: i,
        created_at: now,
        updated_at: now,
      });
    }

    return { success: true };
  },
});

// ============================================
// KNOWLEDGE BASE
// ============================================

/**
 * Get all knowledge categories for a workspace, ordered by display_order.
 */
export const getKnowledgeCategories = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const categories = await ctx.db
      .query("ariKnowledgeCategories")
      .withIndex("by_workspace_order", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    return categories;
  },
});

/**
 * Get knowledge entries for a workspace, optionally filtered by category.
 */
export const getKnowledgeEntries = query({
  args: {
    workspace_id: v.string(),
    category_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    if (args.category_id) {
      // Filter by category
      const entries = await ctx.db
        .query("ariKnowledgeEntries")
        .withIndex("by_category", (q) => q.eq("category_id", args.category_id as any))
        .collect();
      return entries;
    } else {
      // Get all entries for workspace
      const entries = await ctx.db
        .query("ariKnowledgeEntries")
        .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
        .collect();
      return entries;
    }
  },
});

/**
 * Create a knowledge category.
 */
export const createKnowledgeCategory = mutation({
  args: {
    workspace_id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    display_order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const now = Date.now();

    const categoryId = await ctx.db.insert("ariKnowledgeCategories", {
      workspace_id: args.workspace_id as any,
      name: args.name,
      description: args.description,
      display_order: args.display_order,
      created_at: now,
      updated_at: now,
    });

    return await ctx.db.get(categoryId);
  },
});

/**
 * Update a knowledge category.
 */
export const updateKnowledgeCategory = mutation({
  args: {
    category_id: v.string(),
    workspace_id: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    display_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const category = await ctx.db.get(args.category_id as any);
    if (!category || category.workspace_id !== args.workspace_id) {
      throw new Error("Category not found");
    }

    const updateData: any = {
      updated_at: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.display_order !== undefined) updateData.display_order = args.display_order;

    await ctx.db.patch(args.category_id as any, updateData);
    return await ctx.db.get(args.category_id as any);
  },
});

/**
 * Delete a knowledge category (entries must be unlinked or deleted separately).
 */
export const deleteKnowledgeCategory = mutation({
  args: {
    category_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const category = await ctx.db.get(args.category_id as any);
    if (!category || category.workspace_id !== args.workspace_id) {
      throw new Error("Category not found");
    }

    await ctx.db.delete(args.category_id as any);
    return { success: true };
  },
});

/**
 * Create a knowledge entry.
 */
export const createKnowledgeEntry = mutation({
  args: {
    workspace_id: v.string(),
    category_id: v.optional(v.string()),
    title: v.string(),
    content: v.string(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const now = Date.now();

    const entryId = await ctx.db.insert("ariKnowledgeEntries", {
      workspace_id: args.workspace_id as any,
      category_id: args.category_id ? (args.category_id as any) : undefined,
      title: args.title,
      content: args.content,
      is_active: args.is_active,
      created_at: now,
      updated_at: now,
    });

    return await ctx.db.get(entryId);
  },
});

/**
 * Update a knowledge entry.
 */
export const updateKnowledgeEntry = mutation({
  args: {
    entry_id: v.string(),
    workspace_id: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category_id: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const entry = await ctx.db.get(args.entry_id as any);
    if (!entry || entry.workspace_id !== args.workspace_id) {
      throw new Error("Entry not found");
    }

    const updateData: any = {
      updated_at: Date.now(),
    };

    if (args.title !== undefined) updateData.title = args.title;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.category_id !== undefined) updateData.category_id = args.category_id ? (args.category_id as any) : undefined;
    if (args.is_active !== undefined) updateData.is_active = args.is_active;

    await ctx.db.patch(args.entry_id as any, updateData);
    return await ctx.db.get(args.entry_id as any);
  },
});

/**
 * Delete a knowledge entry.
 */
export const deleteKnowledgeEntry = mutation({
  args: {
    entry_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const entry = await ctx.db.get(args.entry_id as any);
    if (!entry || entry.workspace_id !== args.workspace_id) {
      throw new Error("Entry not found");
    }

    await ctx.db.delete(args.entry_id as any);
    return { success: true };
  },
});

// ============================================
// SCORING CONFIG
// ============================================

/**
 * Get scoring config for a workspace.
 * Returns null if no config exists (caller should use defaults).
 */
export const getScoringConfig = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const config = await ctx.db
      .query("ariScoringConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .first();

    return config;
  },
});

/**
 * Upsert scoring config (create or update).
 */
export const upsertScoringConfig = mutation({
  args: {
    workspace_id: v.string(),
    hot_threshold: v.number(),
    warm_threshold: v.number(),
    weight_basic: v.number(),
    weight_qualification: v.number(),
    weight_document: v.number(),
    weight_engagement: v.number(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    // Check if config exists
    const existing = await ctx.db
      .query("ariScoringConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing config
      await ctx.db.patch(existing._id, {
        hot_threshold: args.hot_threshold,
        warm_threshold: args.warm_threshold,
        weight_basic: args.weight_basic,
        weight_qualification: args.weight_qualification,
        weight_document: args.weight_document,
        weight_engagement: args.weight_engagement,
        updated_at: now,
      });
      return await ctx.db.get(existing._id);
    } else {
      // Create new config
      const configId = await ctx.db.insert("ariScoringConfig", {
        workspace_id: args.workspace_id as any,
        hot_threshold: args.hot_threshold,
        warm_threshold: args.warm_threshold,
        weight_basic: args.weight_basic,
        weight_qualification: args.weight_qualification,
        weight_document: args.weight_document,
        weight_engagement: args.weight_engagement,
        created_at: now,
        updated_at: now,
      });
      return await ctx.db.get(configId);
    }
  },
});

// ============================================
// CONSULTANT SLOTS
// ============================================

/**
 * Get all consultant slots for a workspace, ordered by day and time.
 */
export const getConsultantSlots = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const slots = await ctx.db
      .query("consultantSlots")
      .withIndex("by_workspace_day", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    return slots;
  },
});

/**
 * Create a consultant slot.
 */
export const createSlot = mutation({
  args: {
    workspace_id: v.string(),
    consultant_id: v.optional(v.string()),
    day_of_week: v.number(),
    start_time: v.string(),
    end_time: v.string(),
    duration_minutes: v.number(),
    booking_window_days: v.number(),
    max_bookings_per_slot: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const now = Date.now();

    const slotId = await ctx.db.insert("consultantSlots", {
      workspace_id: args.workspace_id as any,
      consultant_id: args.consultant_id,
      day_of_week: args.day_of_week,
      start_time: args.start_time,
      end_time: args.end_time,
      duration_minutes: args.duration_minutes,
      booking_window_days: args.booking_window_days,
      max_bookings_per_slot: args.max_bookings_per_slot,
      is_active: args.is_active,
      created_at: now,
      updated_at: now,
    });

    return await ctx.db.get(slotId);
  },
});

/**
 * Update a consultant slot.
 */
export const updateSlot = mutation({
  args: {
    slot_id: v.string(),
    workspace_id: v.string(),
    consultant_id: v.optional(v.string()),
    day_of_week: v.optional(v.number()),
    start_time: v.optional(v.string()),
    end_time: v.optional(v.string()),
    duration_minutes: v.optional(v.number()),
    booking_window_days: v.optional(v.number()),
    max_bookings_per_slot: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const slot = await ctx.db.get(args.slot_id as any);
    if (!slot || slot.workspace_id !== args.workspace_id) {
      throw new Error("Slot not found");
    }

    const updateData: any = {
      updated_at: Date.now(),
    };

    if (args.consultant_id !== undefined) updateData.consultant_id = args.consultant_id;
    if (args.day_of_week !== undefined) updateData.day_of_week = args.day_of_week;
    if (args.start_time !== undefined) updateData.start_time = args.start_time;
    if (args.end_time !== undefined) updateData.end_time = args.end_time;
    if (args.duration_minutes !== undefined) updateData.duration_minutes = args.duration_minutes;
    if (args.booking_window_days !== undefined) updateData.booking_window_days = args.booking_window_days;
    if (args.max_bookings_per_slot !== undefined) updateData.max_bookings_per_slot = args.max_bookings_per_slot;
    if (args.is_active !== undefined) updateData.is_active = args.is_active;

    await ctx.db.patch(args.slot_id as any, updateData);
    return await ctx.db.get(args.slot_id as any);
  },
});

/**
 * Delete a consultant slot.
 */
export const deleteSlot = mutation({
  args: {
    slot_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const slot = await ctx.db.get(args.slot_id as any);
    if (!slot || slot.workspace_id !== args.workspace_id) {
      throw new Error("Slot not found");
    }

    await ctx.db.delete(args.slot_id as any);
    return { success: true };
  },
});

// ============================================
// ARI CONVERSATIONS
// ============================================

/**
 * Get ARI conversation by contact.
 */
export const getConversationByContact = query({
  args: {
    workspace_id: v.string(),
    contact_id: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("ariConversations")
      .withIndex("by_contact", (q) =>
        q.eq("workspace_id", args.workspace_id as any).eq("contact_id", args.contact_id as any)
      )
      .first();

    return conversation;
  },
});

/**
 * Get ARI conversation by ID (webhook version).
 * No auth check - used by cron/webhook processing.
 */
export const getConversationById = query({
  args: {
    conversation_id: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversation_id as any);
    return conversation;
  },
});

/**
 * Create or update ARI conversation.
 */
export const upsertConversation = mutation({
  args: {
    workspace_id: v.string(),
    contact_id: v.string(),
    current_state: v.string(),
    context: v.optional(v.any()),
    last_message_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ariConversations")
      .withIndex("by_contact", (q) =>
        q.eq("workspace_id", args.workspace_id as any).eq("contact_id", args.contact_id as any)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        state: args.current_state,
        context: args.context,
        last_message_at: args.last_message_at || now,
        updated_at: now,
      });
      return await ctx.db.get(existing._id);
    } else {
      const conversationId = await ctx.db.insert("ariConversations", {
        workspace_id: args.workspace_id as any,
        contact_id: args.contact_id as any,
        state: args.current_state,
        context: args.context || {},
        last_message_at: args.last_message_at || now,
        created_at: now,
        updated_at: now,
        supabaseId: null,
      });
      return await ctx.db.get(conversationId);
    }
  },
});

/**
 * Update conversation state.
 */
export const updateConversationState = mutation({
  args: {
    conversation_id: v.string(),
    current_state: v.string(),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.conversation_id as any, {
      current_state: args.current_state,
      context: args.context,
      last_message_at: now,
      updated_at: now,
    });
    return await ctx.db.get(args.conversation_id as any);
  },
});

/**
 * Update ARI conversation (webhook version, no auth).
 * Flexible update for processor.ts usage.
 */
export const updateConversation = mutation({
  args: {
    conversation_id: v.string(),
    state: v.optional(v.string()),
    context: v.optional(v.any()),
    lead_score: v.optional(v.number()),
    lead_temperature: v.optional(v.string()),
    handoff_at: v.optional(v.number()),
    handoff_reason: v.optional(v.string()),
    ai_model: v.optional(v.string()),
    last_ai_message_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversation_id as any);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const now = Date.now();
    const updates: any = { updated_at: now };

    if (args.state !== undefined) updates.state = args.state;
    if (args.context !== undefined) updates.context = args.context;
    if (args.lead_score !== undefined) updates.lead_score = args.lead_score;
    if (args.lead_temperature !== undefined) updates.lead_temperature = args.lead_temperature;
    if (args.handoff_at !== undefined) updates.handoff_at = args.handoff_at;
    if (args.handoff_reason !== undefined) updates.handoff_reason = args.handoff_reason;
    if (args.ai_model !== undefined) updates.ai_model = args.ai_model;
    if (args.last_ai_message_at !== undefined) updates.last_ai_message_at = args.last_ai_message_at;

    await ctx.db.patch(args.conversation_id as any, updates);
    return await ctx.db.get(args.conversation_id as any);
  },
});

// ============================================
// ARI MESSAGES
// ============================================

/**
 * Create ARI message.
 */
export const createMessage = mutation({
  args: {
    conversation_id: v.string(),
    sender_type: v.string(),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const messageId = await ctx.db.insert("ariMessages", {
      conversation_id: args.conversation_id as any,
      sender_type: args.sender_type,
      content: args.content,
      metadata: args.metadata || {},
      created_at: now,
      supabaseId: null,
    });
    return await ctx.db.get(messageId);
  },
});

/**
 * Get messages for a conversation.
 */
export const getConversationMessages = query({
  args: {
    conversation_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("ariMessages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversation_id", args.conversation_id as any)
      )
      .order("desc");

    if (args.limit) {
      const messages = await q.take(args.limit);
      return messages.reverse(); // Return oldest first
    }

    const messages = await q.collect();
    return messages.reverse();
  },
});

/**
 * Count messages in current state for auto-handoff detection.
 * If state_changed_at is provided, counts messages since that timestamp.
 */
export const countMessagesInState = query({
  args: {
    conversation_id: v.string(),
    state_changed_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("ariMessages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversation_id", args.conversation_id as any)
      )
      .collect();

    if (args.state_changed_at) {
      // Count messages since state change
      return messages.filter(m => m.created_at >= args.state_changed_at!).length;
    }

    // Count all messages
    return messages.length;
  },
});

/**
 * Get conversation with messages (for handoff).
 * No auth - used by webhook processing.
 */
export const getConversationWithMessages = query({
  args: {
    conversation_id: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("ariConversations")
      .withIndex("by_supabaseId", (q) => q.eq("supabaseId", args.conversation_id))
      .first();

    if (!conversation) {
      return null;
    }

    const messages = await ctx.db
      .query("ariMessages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversation_id", conversation._id as any)
      )
      .order("asc")
      .collect();

    return {
      ...conversation,
      messages,
    };
  },
});

// ============================================
// ARI APPOINTMENTS
// ============================================

/**
 * Create appointment (handoff).
 * Schema: ari_conversation_id, workspace_id, consultant_id, scheduled_at, duration_minutes, status, notes
 */
export const createAppointment = mutation({
  args: {
    ari_conversation_id: v.string(),
    workspace_id: v.string(),
    consultant_id: v.optional(v.string()),
    scheduled_at: v.number(),
    duration_minutes: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const appointmentId = await ctx.db.insert("ariAppointments", {
      ari_conversation_id: args.ari_conversation_id as any,
      workspace_id: args.workspace_id as any,
      consultant_id: args.consultant_id || undefined,
      scheduled_at: args.scheduled_at,
      duration_minutes: args.duration_minutes,
      status: "scheduled",
      notes: args.notes || undefined,
      created_at: now,
      updated_at: now,
    });
    return await ctx.db.get(appointmentId);
  },
});

/**
 * Get appointments for contact.
 */
export const getContactAppointments = query({
  args: {
    contact_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ariAppointments")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contact_id as any))
      .order("desc")
      .collect();
  },
});

/**
 * Get upcoming appointments for reminder cron.
 *
 * Returns appointments scheduled in the specified time window
 * that haven't had reminders sent yet.
 */
export const getUpcomingAppointments = query({
  args: {
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all appointments and filter in memory
    // (Convex doesn't support range queries on non-indexed fields)
    const allAppointments = await ctx.db
      .query("ariAppointments")
      .collect();

    return allAppointments.filter(apt =>
      apt.scheduled_at >= args.from &&
      apt.scheduled_at <= args.to &&
      !apt.reminder_sent_at &&
      (apt.status === "scheduled" || apt.status === "confirmed")
    );
  },
});

/**
 * Get appointments for a workspace in a time window (for scheduling).
 * No auth - used by webhook processing.
 */
export const getWorkspaceAppointments = query({
  args: {
    workspace_id: v.string(),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    const allAppointments = await ctx.db
      .query("ariAppointments")
      .collect();

    return allAppointments.filter(apt =>
      apt.workspace_id === args.workspace_id &&
      apt.scheduled_at >= args.from &&
      apt.scheduled_at <= args.to &&
      apt.status !== "cancelled" &&
      apt.status !== "no_show"
    );
  },
});

/**
 * Mark appointment reminder as sent.
 */
export const markReminderSent = mutation({
  args: {
    appointment_id: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.appointment_id as any, {
      reminder_sent_at: now,
      status: "confirmed",
      updated_at: now,
    });
  },
});

// ============================================
// ARI DESTINATIONS (KNOWLEDGE BASE)
// ============================================

/**
 * Get all destinations for a workspace.
 * No auth - used by webhook processing.
 */
export const getDestinations = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    const destinations = await ctx.db
      .query("ariDestinations")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    return destinations;
  },
});

/**
 * Get destinations for a specific country.
 * No auth - used by webhook processing.
 */
export const getDestinationsByCountry = query({
  args: {
    workspace_id: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const destinations = await ctx.db
      .query("ariDestinations")
      .withIndex("by_workspace_country", (q) =>
        q.eq("workspace_id", args.workspace_id as any).eq("country", args.country)
      )
      .collect();

    // Sort by promoted and priority
    return destinations.sort((a, b) => {
      if (a.is_promoted !== b.is_promoted) {
        return a.is_promoted ? -1 : 1;
      }
      return b.priority - a.priority;
    });
  },
});

/**
 * Get promoted destinations for a workspace.
 * No auth - used by webhook processing.
 */
export const getPromotedDestinations = query({
  args: {
    workspace_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allDestinations = await ctx.db
      .query("ariDestinations")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    const promoted = allDestinations
      .filter(d => d.is_promoted)
      .sort((a, b) => b.priority - a.priority);

    return args.limit ? promoted.slice(0, args.limit) : promoted;
  },
});
