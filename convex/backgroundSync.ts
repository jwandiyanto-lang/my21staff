import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Reconcile contacts - find and flag stale contacts
 *
 * A contact is considered stale if:
 * 1. lastActivityAt is older than staleThresholdMs (default 1 hour)
 * 2. Has an active conversation (not archived)
 *
 * This doesn't re-fetch from Kapso (expensive), but flags contacts
 * that may need attention for manual review or future Kapso API call.
 */
export const reconcileContacts = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    staleThresholdMs: v.optional(v.number()), // Default 1 hour
  },
  handler: async (ctx, args) => {
    const { workspaceId, staleThresholdMs = 60 * 60 * 1000 } = args;
    const now = Date.now();
    const staleThreshold = now - staleThresholdMs;

    // Find contacts with active conversations that haven't been updated recently
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspaceId))
      .collect();

    const staleContacts = contacts.filter((c) => {
      // Skip archived/converted leads
      if (c.leadStatus === "archived" || c.leadStatus === "converted") {
        return false;
      }

      // Check if lastActivityAt is stale
      const lastActivity = c.lastActivityAt || c.updated_at || c.created_at;
      return lastActivity < staleThreshold;
    });

    // Flag stale contacts by adding a note
    let flaggedCount = 0;
    for (const contact of staleContacts.slice(0, 50)) { // Limit batch size
      const existingNotes = contact.notes || [];

      // Check if already flagged recently (within 24 hours)
      const recentFlag = existingNotes.find(
        (n) => n.addedBy === "background-sync" && n.addedAt > now - 24 * 60 * 60 * 1000
      );

      if (!recentFlag) {
        const notes = [
          ...existingNotes,
          {
            content: `Sync check: No activity for ${Math.round((now - (contact.lastActivityAt || contact.updated_at || 0)) / (60 * 60 * 1000))} hours`,
            addedBy: "background-sync",
            addedAt: now,
          },
        ];

        await ctx.db.patch(contact._id, { notes });
        flaggedCount++;
      }
    }

    // Log sync run
    await ctx.db.insert("syncHealth", {
      workspace_id: workspaceId,
      run_at: now,
      contacts_checked: contacts.length,
      stale_found: staleContacts.length,
      flagged: flaggedCount,
    });

    console.log(`[BackgroundSync] Workspace ${workspaceId}: checked ${contacts.length}, found ${staleContacts.length} stale, flagged ${flaggedCount}`);

    return {
      checked: contacts.length,
      stale: staleContacts.length,
      flagged: flaggedCount,
    };
  },
});

/**
 * Run reconciliation for all active workspaces
 */
export const reconcileAllWorkspaces = internalMutation({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db
      .query("workspaces")
      .collect();

    // Filter to workspaces with Kapso configured
    const activeWorkspaces = workspaces.filter(
      (w) => w.kapso_phone_id && w.meta_access_token
    );

    let totalChecked = 0;
    let totalStale = 0;
    let totalFlagged = 0;

    for (const workspace of activeWorkspaces) {
      try {
        const result = await reconcileContactsHandler(ctx, {
          workspaceId: workspace._id,
          staleThresholdMs: 60 * 60 * 1000, // 1 hour
        });
        totalChecked += result.checked;
        totalStale += result.stale;
        totalFlagged += result.flagged;
      } catch (error) {
        console.error(`[BackgroundSync] Failed for workspace ${workspace._id}:`, error);
      }
    }

    console.log(`[BackgroundSync] Complete: ${activeWorkspaces.length} workspaces, ${totalChecked} contacts, ${totalStale} stale, ${totalFlagged} flagged`);

    return {
      workspaces: activeWorkspaces.length,
      checked: totalChecked,
      stale: totalStale,
      flagged: totalFlagged,
    };
  },
});

// Helper to run reconciliation logic (used by both mutations)
async function reconcileContactsHandler(
  ctx: any,
  args: { workspaceId: any; staleThresholdMs: number }
) {
  const { workspaceId, staleThresholdMs } = args;
  const now = Date.now();
  const staleThreshold = now - staleThresholdMs;

  const contacts = await ctx.db
    .query("contacts")
    .withIndex("by_workspace", (q: any) => q.eq("workspace_id", workspaceId))
    .collect();

  const staleContacts = contacts.filter((c: any) => {
    if (c.leadStatus === "archived" || c.leadStatus === "converted") {
      return false;
    }
    const lastActivity = c.lastActivityAt || c.updated_at || c.created_at;
    return lastActivity < staleThreshold;
  });

  let flaggedCount = 0;
  for (const contact of staleContacts.slice(0, 50)) {
    const existingNotes = contact.notes || [];
    const recentFlag = existingNotes.find(
      (n: any) => n.addedBy === "background-sync" && n.addedAt > now - 24 * 60 * 60 * 1000
    );

    if (!recentFlag) {
      const notes = [
        ...existingNotes,
        {
          content: `Sync check: No activity for ${Math.round((now - (contact.lastActivityAt || contact.updated_at || 0)) / (60 * 60 * 1000))} hours`,
          addedBy: "background-sync",
          addedAt: now,
        },
      ];
      await ctx.db.patch(contact._id, { notes });
      flaggedCount++;
    }
  }

  await ctx.db.insert("syncHealth", {
    workspace_id: workspaceId,
    run_at: now,
    contacts_checked: contacts.length,
    stale_found: staleContacts.length,
    flagged: flaggedCount,
  });

  return { checked: contacts.length, stale: staleContacts.length, flagged: flaggedCount };
}

/**
 * Get sync health statistics
 */
export const getSyncHealth = query({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    let query = ctx.db.query("syncHealth");

    if (args.workspaceId) {
      query = query.filter((q) => q.eq(q.field("workspace_id"), args.workspaceId));
    }

    const runs = await query.order("desc").take(limit);

    return {
      runs,
      summary: runs.length > 0
        ? {
            lastRun: runs[0].run_at,
            avgStale: Math.round(runs.reduce((sum, r) => sum + r.stale_found, 0) / runs.length),
            totalFlagged: runs.reduce((sum, r) => sum + r.flagged, 0),
          }
        : null,
    };
  },
});
