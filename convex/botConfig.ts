import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

// Default bot names
const DEFAULT_INTERN_NAME = 'Sarah'
const DEFAULT_BRAIN_NAME = 'Grok'

/**
 * Get bot configuration for a workspace
 * Returns existing config or default values
 */
export const getBotConfig = query({
  args: { workspace_id: v.id('workspaces') },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query('botConfig')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspace_id))
      .first()

    if (!config) {
      return {
        intern_name: DEFAULT_INTERN_NAME,
        brain_name: DEFAULT_BRAIN_NAME,
      }
    }

    return {
      intern_name: config.intern_name,
      brain_name: config.brain_name,
    }
  },
})

/**
 * Update or create bot configuration for a workspace
 * Upsert logic: creates new config if not exists, updates if exists
 */
export const updateBotConfig = mutation({
  args: {
    workspace_id: v.id('workspaces'),
    intern_name: v.optional(v.string()),
    brain_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { workspace_id, intern_name, brain_name } = args

    // Check if config exists
    const existing = await ctx.db
      .query('botConfig')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', workspace_id))
      .first()

    const now = Date.now()

    if (existing) {
      // Update existing config
      const updates: {
        intern_name?: string
        brain_name?: string
        updated_at: number
      } = { updated_at: now }

      if (intern_name !== undefined) {
        updates.intern_name = intern_name
      }
      if (brain_name !== undefined) {
        updates.brain_name = brain_name
      }

      await ctx.db.patch(existing._id, updates)

      // Return updated config
      const updated = await ctx.db.get(existing._id)
      return {
        intern_name: updated!.intern_name,
        brain_name: updated!.brain_name,
      }
    } else {
      // Create new config
      const configId = await ctx.db.insert('botConfig', {
        workspace_id,
        intern_name: intern_name || DEFAULT_INTERN_NAME,
        brain_name: brain_name || DEFAULT_BRAIN_NAME,
        created_at: now,
        updated_at: now,
      })

      const config = await ctx.db.get(configId)
      return {
        intern_name: config!.intern_name,
        brain_name: config!.brain_name,
      }
    }
  },
})
