import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// System prompt for Brain summaries
const BRAIN_SUMMARY_SYSTEM_PROMPT = `You are Brain - the analytical AI assistant for my21staff. Your job is to summarize lead activity in a conversational, friendly tone.

TONE: Conversational assistant (friendly but focused)
- Good: "Here's what happened today - you've got 3 hot ones!"
- Bad: "Today's summary: 5 new leads, 3 hot leads, 2 conversions"
- Bad: "5 new | 3 need attention | 2 went cold"

FORMAT: Hybrid conversational + data
- Start with natural language intro (1-2 sentences)
- Include key metrics as bullet points
- End with 1-2 specific action recommendations

KEEP IT SHORT: Under 800 characters for WhatsApp readability.

If data is insufficient, say "Not enough data yet" instead of guessing.`;

/**
 * Call Grok 4.1-fast API for summary generation
 */
async function callGrokAPI(systemPrompt: string, userPrompt: string): Promise<{
  content: string;
  tokens: number;
  cost: number;
}> {
  const grokApiKey = process.env.GROK_API_KEY;
  if (!grokApiKey) throw new Error("GROK_API_KEY not configured");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${grokApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-4.1-fast",  // Cost-effective: $0.20/$0.50 per M tokens
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.5, // Slightly creative for conversational tone
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  // Grok 4.1-fast pricing: $0.20 input, $0.50 output per M tokens
  const cost = (inputTokens * 0.20 + outputTokens * 0.50) / 1_000_000;

  return {
    content: data.choices?.[0]?.message?.content || "",
    tokens: inputTokens + outputTokens,
    cost,
  };
}

/**
 * Build prompt for summary generation
 */
function buildSummaryPrompt(
  stats: any,
  hotLeads: any[],
  config: any
): string {
  const metrics = config.summary.includeMetrics;

  let prompt = `Generate a conversational summary of today's lead activity.\n\nData:\n`;

  if (metrics.newLeads) {
    prompt += `- New leads today: ${stats.newToday}\n`;
    prompt += `- Total leads: ${stats.total}\n`;
  }

  prompt += `- By temperature: ${stats.byTemperature.hot} hot, ${stats.byTemperature.warm} warm, ${stats.byTemperature.cold} cold\n`;

  if (hotLeads.length > 0) {
    const names = hotLeads.map(l => l.name || 'Unknown').join(', ');
    prompt += `- Hot leads: ${names}\n`;
  }

  if (metrics.responseTimes) {
    prompt += `- Avg lead score: ${stats.avgScore}\n`;
  }

  prompt += `\nGenerate a friendly, conversational summary following the tone guidelines.`;

  return prompt;
}

/**
 * internalQuery: getWorkspacesWithBrainEnabled
 * Returns list of workspace IDs that have Brain summary enabled
 */
export const getWorkspacesWithBrainEnabled = internalQuery({
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    const enabled: string[] = [];

    for (const ws of workspaces) {
      const config = await ctx.db
        .query("brainConfig")
        .withIndex("by_workspace", (q) => q.eq("workspace_id", ws._id))
        .first();

      if (config?.summary?.enabled) {
        enabled.push(ws._id);
      }
    }

    return enabled;
  },
});

/**
 * Internal helper for workspace summary generation
 */
async function generateSummaryForWorkspaceInternal(
  ctx: any,
  workspaceId: string,
  trigger: 'cron' | 'command' | 'api',
  triggeredBy?: string
): Promise<any> {
  // 1. Fetch brainConfig for workspace
  const config = await ctx.runQuery(internal.brainConfig.getByWorkspaceId, {
    workspaceId,
  });

  if (!config || !config.summary.enabled) {
    return { skipped: true, reason: "Brain summary not enabled" };
  }

  // 2. Fetch lead stats
  const stats = await ctx.runQuery(internal.leads.getLeadStats, {
    workspaceId,
  });

  // 3. Fetch hot leads
  const hotLeads = await ctx.runQuery(internal.leads.getLeadsByStatus, {
    workspaceId,
    status: "qualified",
    limit: 5,
  });

  // 4. Build prompt
  const userPrompt = buildSummaryPrompt(stats, hotLeads, config);

  // 5. Call Grok API
  const { content, tokens, cost } = await callGrokAPI(
    BRAIN_SUMMARY_SYSTEM_PROMPT,
    userPrompt
  );

  // 6. Store summary
  const summaryId = await ctx.runMutation(internal.brainSummaries.createSummary, {
    workspace_id: workspaceId,
    summary_text: content,
    summary_type: trigger === 'cron' ? 'daily' : 'manual',
    trigger,
    triggered_by: triggeredBy,
    metrics: {
      newLeadsCount: stats.newToday,
      hotLeadsCount: stats.byTemperature.hot,
      warmLeadsCount: stats.byTemperature.warm,
      coldLeadsCount: stats.byTemperature.cold,
      avgScore: stats.avgScore,
    },
    tokens_used: tokens,
    cost_usd: cost,
  });

  console.log(`[Brain] Generated summary ${summaryId} for workspace ${workspaceId}`);

  return {
    success: true,
    summaryId,
    summaryText: content,
    tokens_used: tokens,
    cost_usd: cost,
  };
}

/**
 * internalAction: generateSummaryForWorkspace
 * Generate summary for a specific workspace
 */
export const generateSummaryForWorkspace = internalAction({
  args: {
    workspace_id: v.string(),
    trigger: v.union(v.literal("cron"), v.literal("command"), v.literal("api")),
    triggered_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await generateSummaryForWorkspaceInternal(
      ctx,
      args.workspace_id,
      args.trigger,
      args.triggered_by
    );
  },
});

/**
 * internalAction: generateDailySummary
 * Generate summaries for all Brain-enabled workspaces (called by cron)
 */
export const generateDailySummary = internalAction({
  handler: async (ctx) => {
    const workspaceIds = await ctx.runQuery(internal.brainAnalysis.getWorkspacesWithBrainEnabled);

    console.log(`[Brain] Running daily summary for ${workspaceIds.length} workspaces`);

    const results = [];
    for (const wsId of workspaceIds) {
      try {
        const result = await generateSummaryForWorkspaceInternal(ctx, wsId, 'cron');
        results.push({ workspace: wsId, ...result });
      } catch (error) {
        console.error(`[Brain] Summary failed for ${wsId}:`, error);
        results.push({ workspace: wsId, error: String(error) });
      }
    }

    return { processed: results.length, results };
  },
});
