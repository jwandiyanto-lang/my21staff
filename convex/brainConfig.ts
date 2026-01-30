import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

// Get brain config by workspace ID
export const getByWorkspaceId = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query('brainConfig')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspaceId))
      .first()

    return config
  },
})

// Upsert brain config (create or update)
export const upsert = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    updates: v.object({
      summary: v.object({
        enabled: v.boolean(),
        time: v.string(),
        format: v.string(),
        includeMetrics: v.object({
          newLeads: v.boolean(),
          conversions: v.boolean(),
          responseTimes: v.boolean(),
          topSources: v.boolean(),
        }),
      }),
      scoring: v.object({
        hotThreshold: v.number(),
        warmThreshold: v.number(),
        weights: v.object({
          basicInfo: v.number(),
          qualification: v.number(),
          document: v.number(),
          engagement: v.number(),
        }),
      }),
      triggers: v.object({
        onHandoff: v.boolean(),
        onKeyword: v.boolean(),
        keyword: v.string(),
        onSchedule: v.boolean(),
        schedule: v.string(),
        analysisDepth: v.string(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('brainConfig')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspaceId))
      .first()

    const now = Date.now()

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        ...args.updates,
        updated_at: now,
      })
      return { ...existing, ...args.updates, updated_at: now }
    } else {
      // Create new
      const newId = await ctx.db.insert('brainConfig', {
        workspace_id: args.workspaceId,
        ...args.updates,
        created_at: now,
        updated_at: now,
      })
      return {
        _id: newId,
        workspace_id: args.workspaceId,
        ...args.updates,
        created_at: now,
        updated_at: now,
      }
    }
  },
})
