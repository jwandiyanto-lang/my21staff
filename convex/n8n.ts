/**
 * n8n webhook integration for lead creation.
 *
 * This module handles incoming leads from n8n workflows (e.g., Google Form submissions)
 * and creates contacts in the workspace's CRM database.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Normalize phone number to consistent format.
 *
 * Handles Indonesian phone numbers with +62 or 0 prefix.
 *
 * @param phone - Raw phone number from form
 * @returns Normalized phone number
 */
function normalizePhone(phone: string): string {
  // Remove all whitespace and special characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // If starts with 0, replace with +62
  if (cleaned.startsWith("0")) {
    return "+62" + cleaned.substring(1);
  }

  // If starts with 62 (no plus), add plus
  if (cleaned.startsWith("62")) {
    return "+" + cleaned;
  }

  // If already has +62 or other country code, return as is
  return cleaned;
}

/**
 * Create lead from n8n webhook data.
 *
 * PUBLIC MUTATION - No auth required (called from HTTP webhook).
 *
 * Checks for duplicate contacts by phone number and skips if exists.
 * Creates new contact with source="n8n" and no tags (empty array).
 *
 * @param workspace_id - The workspace ID (resolved from slug in HTTP handler)
 * @param name - Contact name
 * @param phone - Phone number (will be normalized)
 * @param email - Optional email address
 * @param lead_score - Calculated lead score (0-100)
 * @param metadata - Additional lead data (form_answers, etc.)
 * @returns Success response with status and contact_id
 */
export const createLead = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    lead_score: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const normalizedPhone = normalizePhone(args.phone);

    console.log("[n8n] Processing lead:", {
      workspace_id: args.workspace_id,
      name: args.name,
      phone: normalizedPhone,
    });

    // Check if contact already exists by phone
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", args.workspace_id).eq("phone", normalizedPhone)
      )
      .first();

    if (existing) {
      console.log("[n8n] Contact already exists:", existing._id);
      return {
        success: true,
        status: "exists",
        contact_id: existing._id,
      };
    }

    // Get workspace to determine default lead status
    const workspace = await ctx.db.get(args.workspace_id);
    const defaultStatus = workspace?.settings?.lead_stages?.[0]?.key || "new";

    // Create new contact
    const contactId = await ctx.db.insert("contacts", {
      workspace_id: args.workspace_id,
      phone: normalizedPhone,
      phone_normalized: normalizedPhone,
      name: args.name,
      kapso_name: undefined,
      email: args.email,
      lead_score: args.lead_score,
      lead_status: defaultStatus,
      tags: [],
      assigned_to: undefined,
      source: "n8n",
      metadata: args.metadata || {},
      cache_updated_at: undefined,
      created_at: now,
      updated_at: now,
      supabaseId: "", // No Supabase ID for new contacts from n8n
    });

    console.log("[n8n] Contact created:", contactId);

    return {
      success: true,
      status: "created",
      contact_id: contactId,
    };
  },
});
