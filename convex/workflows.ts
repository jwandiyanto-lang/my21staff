import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Get workflow configuration for a workspace
 * Returns null if no config exists (use defaults in rules engine)
 */
export const getConfig = query({
  args: {
    workspace_id: v.id('workspaces'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('workflow_configs')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspace_id))
      .first();
  },
});

/**
 * Upsert workflow configuration
 * Creates or updates config for a workspace
 */
export const upsertConfig = mutation({
  args: {
    workspace_id: v.id('workspaces'),
    keyword_triggers: v.array(
      v.object({
        id: v.string(),
        keywords: v.array(v.string()),
        action: v.union(
          v.literal('handoff'),
          v.literal('manager_bot'),
          v.literal('faq_response'),
          v.literal('pass_through')
        ),
        response_template: v.optional(v.string()),
        case_sensitive: v.boolean(),
        match_mode: v.union(
          v.literal('exact'),
          v.literal('contains'),
          v.literal('starts_with')
        ),
        enabled: v.boolean(),
      })
    ),
    faq_templates: v.array(
      v.object({
        id: v.string(),
        trigger_keywords: v.array(v.string()),
        response: v.string(),
        enabled: v.boolean(),
      })
    ),
    lead_routing: v.object({
      new_lead_greeting: v.string(),
      returning_lead_greeting: v.string(),
      detection_window_hours: v.number(),
    }),
    ai_fallback_enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('workflow_configs')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspace_id))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        keyword_triggers: args.keyword_triggers,
        faq_templates: args.faq_templates,
        lead_routing: args.lead_routing,
        ai_fallback_enabled: args.ai_fallback_enabled,
        updated_at: now,
      });
      return existing._id;
    }

    return await ctx.db.insert('workflow_configs', {
      workspace_id: args.workspace_id,
      keyword_triggers: args.keyword_triggers,
      faq_templates: args.faq_templates,
      lead_routing: args.lead_routing,
      ai_fallback_enabled: args.ai_fallback_enabled,
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * Log a workflow execution for analytics and debugging
 */
export const logExecution = mutation({
  args: {
    workspace_id: v.id('workspaces'),
    contact_id: v.id('contacts'),
    conversation_id: v.optional(v.id('conversations')),
    message_content: v.string(),
    rule_matched: v.optional(v.string()),
    action_taken: v.union(
      v.literal('handoff'),
      v.literal('manager_bot'),
      v.literal('faq_response'),
      v.literal('pass_through'),
      v.literal('ai_fallback')
    ),
    lead_type: v.union(v.literal('new'), v.literal('returning')),
    response_sent: v.optional(v.string()),
    processing_time_ms: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('workflow_executions', {
      workspace_id: args.workspace_id,
      contact_id: args.contact_id,
      conversation_id: args.conversation_id,
      message_content: args.message_content,
      rule_matched: args.rule_matched,
      action_taken: args.action_taken,
      lead_type: args.lead_type,
      response_sent: args.response_sent,
      processing_time_ms: args.processing_time_ms,
      created_at: Date.now(),
    });
  },
});

/**
 * Get recent workflow executions for a workspace (for debugging)
 */
export const getRecentExecutions = query({
  args: {
    workspace_id: v.id('workspaces'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query('workflow_executions')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspace_id))
      .order('desc')
      .take(limit);
  },
});

/**
 * Check if workflow config exists for workspace
 */
export const hasConfig = query({
  args: {
    workspace_id: v.id('workspaces'),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query('workflow_configs')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspace_id))
      .first();
    return config !== null;
  },
});
