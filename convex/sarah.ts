import { query, mutation, internalQuery, internalMutation, httpAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ============================================
// INTERNAL QUERIES (used by HTTP actions)
// ============================================

/**
 * Get Sarah conversation by phone number
 */
export const getByPhone = internalQuery({
  args: { contact_phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sarahConversations")
      .withIndex("by_phone", (q) => q.eq("contact_phone", args.contact_phone))
      .first();
  },
});

// ============================================
// INTERNAL MUTATIONS (used by HTTP actions)
// ============================================

/**
 * Create a new Sarah conversation record
 */
export const create = internalMutation({
  args: {
    contact_phone: v.string(),
    workspace_id: v.optional(v.string()),
    state: v.string(),
    lead_score: v.number(),
    lead_temperature: v.string(),
    extracted_data: v.optional(v.any()),
    language: v.string(),
    message_count: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
    last_message_at: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sarahConversations", args);
  },
});

/**
 * Update an existing Sarah conversation record
 */
export const update = internalMutation({
  args: {
    id: v.id("sarahConversations"),
    contact_phone: v.optional(v.string()),
    workspace_id: v.optional(v.string()),
    state: v.optional(v.string()),
    lead_score: v.optional(v.number()),
    lead_temperature: v.optional(v.string()),
    extracted_data: v.optional(v.any()),
    language: v.optional(v.string()),
    message_count: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    last_message_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

/**
 * Sync Sarah conversation data to contacts table
 * Called after each Sarah state update to keep lead data current
 */
export const syncToContacts = internalMutation({
  args: {
    contact_phone: v.string(),
    workspace_id: v.optional(v.string()),
    state: v.string(),
    lead_score: v.number(),
    lead_temperature: v.string(),
    extracted_data: v.any(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const {
      contact_phone,
      workspace_id,
      state,
      lead_score,
      lead_temperature,
      extracted_data,
      language,
    } = args;

    // Normalize phone for contact lookup
    const normalizedPhone = contact_phone.replace(/\D/g, "");

    // Find contact by phone (search all workspaces if workspace_id not provided)
    let contact;
    if (workspace_id) {
      // @ts-ignore - workspace_id is string from Kapso, contacts use Id
      contact = await ctx.db
        .query("contacts")
        .filter((q) => q.eq(q.field("phone"), normalizedPhone))
        .first();
    } else {
      contact = await ctx.db
        .query("contacts")
        .filter((q) => q.eq(q.field("phone"), normalizedPhone))
        .first();
    }

    if (!contact) {
      console.log(`[Sarah Sync] No contact found for phone: ${normalizedPhone}`);
      return { synced: false, reason: "contact_not_found" };
    }

    // Map Sarah state to lead status
    // Sarah states: 'greeting' | 'qualifying' | 'scoring' | 'handoff' | 'completed'
    const stateToStatus: Record<string, string> = {
      greeting: "new",
      qualifying: "qualified",
      scoring: "qualified",
      handoff: "contacted",
      completed: "converted",
    };

    // Validate lead temperature
    const validTemps = ["hot", "warm", "lukewarm", "cold"];
    const safeTemperature = validTemps.includes(lead_temperature)
      ? lead_temperature
      : "cold";

    const now = Date.now();

    // Build updates object with Sarah data
    const updates: Record<string, any> = {
      // Sarah Phase 1 fields
      businessType: extracted_data?.business_type,
      // Sarah Phase 2 fields
      painPoints: extracted_data?.pain_points,
      // Sarah Phase 3 fields
      leadScore: lead_score,
      leadTemperature: safeTemperature,
      // Language
      sarahLanguage: language,
      // Status
      leadStatus: stateToStatus[state] || contact.leadStatus || "new",
      statusChangedAt: now,
      statusChangedBy: "sarah-bot",
      // Timestamps
      lastActivityAt: now,
      updated_at: now,
    };

    // Only set name if extracted and contact doesn't have one
    if (extracted_data?.name && !contact.name) {
      updates.name = extracted_data.name;
    }

    // Patch contact with Sarah data
    await ctx.db.patch(contact._id, updates);

    console.log(`[Sarah Sync] Synced data to contact ${contact._id}: score=${lead_score}, status=${updates.leadStatus}`);
    return { synced: true, contactId: contact._id };
  },
});

// ============================================
// HTTP ACTIONS (for Kapso Function nodes)
// ============================================

/**
 * GET /sarah/state - Retrieve Sarah conversation state
 *
 * Called by Kapso before processing a message to get current conversation state.
 * Returns default state for new conversations.
 *
 * Query params:
 *   - contact_phone: The normalized phone number (required)
 */
export const getSarahState = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const contact_phone = url.searchParams.get("contact_phone");

  if (!contact_phone) {
    return new Response(
      JSON.stringify({ error: "contact_phone is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const conversation = await ctx.runQuery(internal.sarah.getByPhone, { contact_phone });

  if (!conversation) {
    // Return default state for new conversation
    return new Response(
      JSON.stringify({
        state: "greeting",
        lead_score: 0,
        lead_temperature: "cold",
        extracted_data: {},
        language: "id",
        message_count: 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify(conversation), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * POST /sarah/state - Upsert Sarah conversation state
 *
 * Called by Kapso after each message to save/update conversation state.
 *
 * Body:
 *   - contact_phone: The normalized phone number (required)
 *   - state: Current state in the conversation flow
 *   - lead_score: Calculated lead score (0-100)
 *   - lead_temperature: 'hot' | 'warm' | 'cold'
 *   - extracted_data: Object with extracted qualification data
 *   - language: 'id' | 'en'
 *   - message_count: Number of messages exchanged
 */
export const upsertSarahState = httpAction(async (ctx, request) => {
  const body = await request.json();
  const {
    contact_phone,
    state,
    lead_score,
    lead_temperature,
    extracted_data,
    language,
    message_count,
  } = body;

  // Validate required fields
  if (!contact_phone) {
    return new Response(
      JSON.stringify({ error: "contact_phone is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const now = Date.now();

  // Check for existing conversation
  const existing = await ctx.runQuery(internal.sarah.getByPhone, { contact_phone });

  const data = {
    contact_phone,
    state: state || "greeting",
    lead_score: lead_score || 0,
    lead_temperature: lead_temperature || "cold",
    extracted_data: extracted_data || {},
    language: language || "id",
    message_count: message_count || 0,
    updated_at: now,
    last_message_at: now,
  };

  if (existing) {
    // Update existing conversation
    await ctx.runMutation(internal.sarah.update, { id: existing._id, ...data });
  } else {
    // Create new conversation
    await ctx.runMutation(internal.sarah.create, {
      ...data,
      created_at: now,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ============================================
// DASHBOARD QUERIES (for frontend)
// ============================================

/**
 * Get all Sarah conversations with optional filtering
 *
 * Used for the dashboard lead list view.
 *
 * Args:
 *   - temperature: Filter by 'hot' | 'warm' | 'cold' (optional)
 *   - limit: Maximum number of results (default: 50)
 */
export const getSarahLeads = query({
  args: {
    temperature: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("sarahConversations");

    if (args.temperature) {
      q = q.withIndex("by_temperature", (q) =>
        q.eq("lead_temperature", args.temperature)
      );
    }

    const results = await q.order("desc").take(args.limit || 50);

    return results;
  },
});

/**
 * Get aggregate statistics for Sarah conversations
 *
 * Used for dashboard analytics display.
 */
export const getSarahStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("sarahConversations").collect();

    const hot = all.filter((c) => c.lead_temperature === "hot").length;
    const warm = all.filter((c) => c.lead_temperature === "warm").length;
    const cold = all.filter((c) => c.lead_temperature === "cold").length;

    const avgScore =
      all.length > 0
        ? all.reduce((sum, c) => sum + c.lead_score, 0) / all.length
        : 0;

    return {
      total: all.length,
      hot,
      warm,
      cold,
      avgScore: Math.round(avgScore),
    };
  },
});

/**
 * Get a single Sarah conversation by phone number
 *
 * Used for lead detail view in the dashboard.
 */
export const getSarahConversation = query({
  args: { contact_phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sarahConversations")
      .withIndex("by_phone", (q) => q.eq("contact_phone", args.contact_phone))
      .first();
  },
});
