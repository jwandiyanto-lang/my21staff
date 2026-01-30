import { mutation, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  new: ["qualified", "archived"],
  qualified: ["contacted", "archived"],
  contacted: ["converted", "qualified", "archived"], // allow backwards
  converted: ["archived"],
  archived: ["new"], // allow re-engagement
};

/**
 * Update lead status with validation
 * Validates status transitions and tracks who made the change
 */
export const updateLeadStatus = mutation({
  args: {
    contactId: v.id("contacts"),
    newStatus: v.union(
      v.literal("new"),
      v.literal("qualified"),
      v.literal("contacted"),
      v.literal("converted"),
      v.literal("archived")
    ),
    changedBy: v.string(), // "sarah-bot" | "grok-bot" | user email
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const currentStatus = contact.leadStatus || "new";
    const allowed = validTransitions[currentStatus] || [];

    if (!allowed.includes(args.newStatus)) {
      throw new Error(`Invalid transition: ${currentStatus} -> ${args.newStatus}`);
    }

    await ctx.db.patch(args.contactId, {
      leadStatus: args.newStatus,
      statusChangedAt: Date.now(),
      statusChangedBy: args.changedBy,
      lastActivityAt: Date.now(),
      updated_at: Date.now(),
    });

    return { success: true, newStatus: args.newStatus };
  },
});

/**
 * Add note to contact
 * Stores note in timeline array with max limit of 100 notes
 */
export const addContactNote = mutation({
  args: {
    contactId: v.id("contacts"),
    content: v.string(),
    addedBy: v.string(), // "sarah-bot" | "grok-bot" | user email
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const existingNotes = contact.notes || [];
    const MAX_NOTES = 100;

    // Limit array size (keep last 100)
    const notes = existingNotes.length >= MAX_NOTES
      ? [...existingNotes.slice(-MAX_NOTES + 1), {
          content: args.content,
          addedBy: args.addedBy,
          addedAt: Date.now(),
        }]
      : [...existingNotes, {
          content: args.content,
          addedBy: args.addedBy,
          addedAt: Date.now(),
        }];

    await ctx.db.patch(args.contactId, {
      notes,
      lastActivityAt: Date.now(),
      updated_at: Date.now(),
    });

    return { success: true, noteCount: notes.length };
  },
});

/**
 * Internal mutation for Sarah data sync
 * Maps Sarah phases to lead status and updates contact with extracted data
 */
export const syncSarahData = internalMutation({
  args: {
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    businessType: v.optional(v.string()),
    domisili: v.optional(v.string()),
    businessDuration: v.optional(v.string()),
    painPoints: v.optional(v.array(v.string())),
    interestMotivation: v.optional(v.string()),
    priority: v.optional(v.string()),
    urgencyLevel: v.optional(v.string()),
    leadScore: v.optional(v.number()),
    leadTemperature: v.optional(v.string()),
    sarahLanguage: v.optional(v.string()),
    currentPhase: v.optional(v.string()), // A, B, C, D
  },
  handler: async (ctx, args) => {
    const { contactId, currentPhase, ...extractedData } = args;

    // Map Sarah phase to lead status
    const phaseToStatus: Record<string, string> = {
      A: "new",
      B: "qualified",
      C: "qualified",
      D: "contacted",
    };

    const updates: any = {
      lastActivityAt: Date.now(),
      updated_at: Date.now(),
    };

    // Add extracted data fields if provided
    if (extractedData.name) updates.name = extractedData.name;
    if (extractedData.businessType) updates.businessType = extractedData.businessType;
    if (extractedData.domisili) updates.domisili = extractedData.domisili;
    if (extractedData.businessDuration) updates.businessDuration = extractedData.businessDuration;
    if (extractedData.painPoints) updates.painPoints = extractedData.painPoints;
    if (extractedData.interestMotivation) updates.interestMotivation = extractedData.interestMotivation;
    if (extractedData.priority) updates.priority = extractedData.priority;
    if (extractedData.urgencyLevel) updates.urgencyLevel = extractedData.urgencyLevel;
    if (extractedData.leadScore) updates.leadScore = extractedData.leadScore;
    if (extractedData.sarahLanguage) updates.sarahLanguage = extractedData.sarahLanguage;

    // Validate and add leadTemperature if provided
    if (extractedData.leadTemperature) {
      const validTemps = ["hot", "warm", "lukewarm", "cold"];
      if (validTemps.includes(extractedData.leadTemperature)) {
        updates.leadTemperature = extractedData.leadTemperature;
      }
    }

    // Update lead status based on phase if provided
    if (currentPhase && phaseToStatus[currentPhase]) {
      updates.leadStatus = phaseToStatus[currentPhase];
      updates.statusChangedAt = Date.now();
      updates.statusChangedBy = "sarah-bot";
    }

    await ctx.db.patch(contactId, updates);
    return { success: true };
  },
});

/**
 * Get leads by status for dashboard filtering
 */
export const getLeadsByStatus = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("qualified"),
      v.literal("contacted"),
      v.literal("converted"),
      v.literal("archived")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workspaceId, status, limit = 50 } = args;

    let query = ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspaceId));

    const contacts = await query.order("desc").take(limit);

    // Filter by status in memory (Convex doesn't support compound index filters well)
    const filtered = status
      ? contacts.filter((c) => c.leadStatus === status)
      : contacts;

    return filtered.map((c) => ({
      _id: c._id,
      phone: c.phone,
      name: c.name || c.kapso_name || "Unknown",
      leadStatus: c.leadStatus || "new",
      leadScore: c.leadScore || c.lead_score || 0,
      leadTemperature: c.leadTemperature || "cold",
      businessType: c.businessType,
      painPoints: c.painPoints,
      lastActivityAt: c.lastActivityAt || c.updated_at,
      lastContactAt: c.lastContactAt,
      created_at: c.created_at,
    }));
  },
});

/**
 * Get leads needing follow-up (no contact in X days, qualified status)
 */
export const getLeadsNeedingFollowUp = query({
  args: {
    workspaceId: v.id("workspaces"),
    daysSinceContact: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workspaceId, daysSinceContact = 7 } = args;
    const cutoffTime = Date.now() - daysSinceContact * 24 * 60 * 60 * 1000;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspaceId))
      .collect();

    // Filter: qualified status AND (no lastContactAt OR lastContactAt < cutoff)
    const needFollowUp = contacts.filter((c) => {
      const isQualified = c.leadStatus === "qualified";
      const noRecentContact = !c.lastContactAt || c.lastContactAt < cutoffTime;
      return isQualified && noRecentContact;
    });

    // Sort by lead score (highest priority first)
    needFollowUp.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));

    return needFollowUp.map((c) => ({
      _id: c._id,
      phone: c.phone,
      name: c.name || c.kapso_name || "Unknown",
      leadScore: c.leadScore || c.lead_score || 0,
      leadTemperature: c.leadTemperature || "cold",
      businessType: c.businessType,
      lastActivityAt: c.lastActivityAt || c.updated_at,
      lastContactAt: c.lastContactAt,
      daysSinceContact: c.lastContactAt
        ? Math.floor((Date.now() - c.lastContactAt) / (24 * 60 * 60 * 1000))
        : null,
    }));
  },
});

/**
 * Get lead statistics for dashboard
 */
export const getLeadStats = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId))
      .collect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const thisWeekMs = todayMs - 7 * 24 * 60 * 60 * 1000;
    const thisMonthMs = todayMs - 30 * 24 * 60 * 60 * 1000;

    return {
      total: contacts.length,
      byStatus: {
        new: contacts.filter((c) => c.leadStatus === "new" || !c.leadStatus).length,
        qualified: contacts.filter((c) => c.leadStatus === "qualified").length,
        contacted: contacts.filter((c) => c.leadStatus === "contacted").length,
        converted: contacts.filter((c) => c.leadStatus === "converted").length,
        archived: contacts.filter((c) => c.leadStatus === "archived").length,
      },
      byTemperature: {
        hot: contacts.filter((c) => c.leadTemperature === "hot").length,
        warm: contacts.filter((c) => c.leadTemperature === "warm").length,
        lukewarm: contacts.filter((c) => c.leadTemperature === "lukewarm").length,
        cold: contacts.filter((c) => c.leadTemperature === "cold" || !c.leadTemperature).length,
      },
      newToday: contacts.filter((c) => c.created_at >= todayMs).length,
      newThisWeek: contacts.filter((c) => c.created_at >= thisWeekMs).length,
      newThisMonth: contacts.filter((c) => c.created_at >= thisMonthMs).length,
      avgScore: contacts.length > 0
        ? Math.round(contacts.reduce((sum, c) => sum + (c.leadScore || c.lead_score || 0), 0) / contacts.length)
        : 0,
    };
  },
});
