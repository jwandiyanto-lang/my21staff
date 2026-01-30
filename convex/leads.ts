import { mutation, internalMutation } from "./_generated/server";
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
