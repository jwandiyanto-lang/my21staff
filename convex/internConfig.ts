import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

// Get intern config by workspace ID
export const getByWorkspaceId = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query('internConfig')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspaceId))
      .first()

    return config
  },
})

// Upsert intern config (create or update)
export const upsert = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    updates: v.object({
      persona: v.object({
        greetingStyle: v.string(),
        language: v.string(),
        tone: v.array(v.string()),
        customPrompt: v.optional(v.string()),
      }),
      behavior: v.object({
        autoRespondNewLeads: v.boolean(),
        handoffKeywords: v.array(v.string()),
        quietHoursEnabled: v.boolean(),
        quietHoursStart: v.string(),
        quietHoursEnd: v.string(),
        maxMessagesBeforeHuman: v.number(),
      }),
      response: v.object({
        maxMessageLength: v.number(),
        emojiUsage: v.string(),
        priceMentions: v.string(),
        responseDelay: v.string(),
      }),
      slotExtraction: v.object({
        enabled: v.boolean(),
        slots: v.object({
          name: v.object({ enabled: v.boolean(), required: v.boolean() }),
          serviceInterest: v.object({ enabled: v.boolean(), required: v.boolean() }),
          budgetRange: v.object({ enabled: v.boolean(), required: v.boolean() }),
          timeline: v.object({ enabled: v.boolean(), required: v.boolean() }),
        }),
        customSlots: v.array(v.string()),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('internConfig')
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
      const newId = await ctx.db.insert('internConfig', {
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
