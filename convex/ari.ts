/**
 * ARI (AI Response Intelligence) query and mutation functions for Convex.
 *
 * Provides access to ARI configuration, flow stages, knowledge base,
 * scoring config, and consultant slots.
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query, mutation } from "./_generated/server";
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
    await requireWorkspaceMembership(ctx, args.workspace_id);

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

    return stages;
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
 * Delete a flow stage.
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

    await ctx.db.delete(args.stage_id as any);
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
        current_state: args.current_state,
        context: args.context,
        last_message_at: args.last_message_at || now,
        updated_at: now,
      });
      return await ctx.db.get(existing._id);
    } else {
      const conversationId = await ctx.db.insert("ariConversations", {
        workspace_id: args.workspace_id as any,
        contact_id: args.contact_id as any,
        current_state: args.current_state,
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

// ============================================
// ARI APPOINTMENTS
// ============================================

/**
 * Create appointment (handoff).
 */
export const createAppointment = mutation({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
    contact_id: v.string(),
    slot_id: v.string(),
    consultant_name: v.string(),
    scheduled_at: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const appointmentId = await ctx.db.insert("ariAppointments", {
      conversation_id: args.conversation_id as any,
      workspace_id: args.workspace_id as any,
      contact_id: args.contact_id as any,
      slot_id: args.slot_id as any,
      consultant_name: args.consultant_name,
      scheduled_at: args.scheduled_at,
      status: "scheduled",
      notes: args.notes || null,
      created_at: now,
      updated_at: now,
      supabaseId: null,
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
