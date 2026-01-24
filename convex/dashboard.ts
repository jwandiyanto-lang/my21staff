/**
 * Dashboard query functions for Convex.
 *
 * These functions provide workspace-level statistics and activity feed
 * for the dashboard view.
 */

// @ts-nocheck - Schema types mismatch with generated Convex types
import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

/**
 * Get workspace statistics with optional time filtering.
 *
 * Returns contact and conversation counts, status breakdown,
 * and onboarding checks (Kapso connected, has contacts, has conversations).
 *
 * @param workspace_id - The workspace to get stats for
 * @param time_filter - Optional time filter: 'week', 'month', or 'all' (default: 'all')
 * @returns Dashboard statistics object
 */
export const getStats = query({
  args: {
    workspace_id: v.string(),
    time_filter: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Determine time cutoff
    let timeCutoff = 0; // 'all' - no filter
    if (args.time_filter === "week") {
      timeCutoff = weekAgo;
    } else if (args.time_filter === "month") {
      timeCutoff = monthAgo;
    }

    // Fetch all contacts and conversations for the workspace
    const [allContacts, allConversations, workspace] = await Promise.all([
      ctx.db
        .query("contacts")
        .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
        .collect(),
      ctx.db
        .query("conversations")
        .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
        .collect(),
      ctx.db.get(args.workspace_id as any),
    ]);

    // Apply time filter
    const contacts = allContacts.filter((c) => c.created_at >= timeCutoff);
    const conversations = allConversations.filter((c) => c.created_at >= timeCutoff);

    // Calculate status breakdown
    const statusBreakdown = contacts.reduce((acc, contact) => {
      const status = contact.lead_status || "new";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate active conversations (unread_count > 0)
    const activeConversations = conversations.filter((c) => c.unread_count > 0).length;

    // Check onboarding status
    const hasKapsoConnected = !!(workspace?.kapso_phone_id);
    const hasContacts = allContacts.length > 0;
    const hasConversations = allConversations.length > 0;

    return {
      totalContacts: contacts.length,
      totalConversations: conversations.length,
      activeConversations,
      statusBreakdown,
      hasKapsoConnected,
      hasContacts,
      hasConversations,
    };
  },
});

/**
 * List recent workspace activity with pagination.
 *
 * Returns paginated contact notes with associated contact information.
 * Notes are ordered by most recent first. For v3.2, activity feed shows
 * only notes - form fills and chat summaries deferred to future iteration.
 *
 * @param workspace_id - The workspace to get activity for
 * @param paginationOpts - Convex pagination options
 * @returns Paginated activity feed with contact details
 */
export const listActivity = query({
  args: {
    workspace_id: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Query contactNotes with pagination
    const result = await ctx.db
      .query("contactNotes")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .order("desc")
      .paginate(args.paginationOpts);

    // Get unique contact IDs from notes
    const contactIds = [...new Set(result.page.map((note) => note.contact_id))];

    // Fetch contacts in parallel
    const contacts = await Promise.all(
      contactIds.map((id) => ctx.db.get(id))
    );

    // Create contact lookup map
    const contactMap = new Map();
    contacts.forEach((contact) => {
      if (contact) {
        contactMap.set(contact._id, contact);
      }
    });

    // Map notes to activity items with contact info
    const activities = result.page.map((note) => {
      const contact = contactMap.get(note.contact_id);
      return {
        ...note,
        type: 'note' as const,
        contact: contact
          ? {
              name: contact.name,
              phone: contact.phone,
            }
          : null,
      };
    });

    return {
      ...result,
      page: activities,
    };
  },
});
