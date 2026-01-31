import { internalAction, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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

// ============================================
// ACTION RECOMMENDATION ENGINE
// ============================================

// ContactLead type - matches the return shape from leads.ts queries
interface ContactLead {
  _id: Id<"contacts">;
  phone: string;
  name: string;
  leadScore: number;
  leadTemperature: string;
  businessType?: string;
  painPoints?: string[];
  lastActivityAt?: number;
  lastContactAt?: number;
  daysSinceContact?: number | null;
  sarahLanguage?: string;
  notes?: Array<{ content: string; addedBy: string; addedAt: number }>;
}

interface ActionRecommendation {
  contactId: string;
  contactName: string;
  contactPhone: string;
  actionType: 'follow_up' | 'response_template' | 'handoff_ready' | 'opportunity_alert';
  priority: number;  // 0-100
  urgency: 'immediate' | 'today' | 'this_week';
  reason: string;
  suggestedMessage?: string;
}

interface ScoringWeights {
  leadScore: number;      // Weight for lead temperature (default: 0.40)
  timeSinceContact: number; // Weight for days since last contact (default: 0.30)
  engagementDecay: number;  // Weight for score trending down (default: 0.20)
  urgencySignals: number;   // Weight for explicit urgency (default: 0.10)
}

/**
 * Calculate action priority using weighted scoring algorithm
 */
function calculateActionPriority(lead: ContactLead, weights: ScoringWeights = {
  leadScore: 0.40,
  timeSinceContact: 0.30,
  engagementDecay: 0.20,
  urgencySignals: 0.10,
}): number {
  const daysSinceContact = lead.lastContactAt
    ? Math.floor((Date.now() - lead.lastContactAt) / (24 * 60 * 60 * 1000))
    : 14; // Default to 14 days if never contacted

  const normalized = {
    leadScore: (lead.leadScore || 0) / 100,
    timeSinceContact: Math.min(daysSinceContact / 14, 1), // Cap at 14 days
    engagementDecay: 0, // TODO: Track previous scores for trending
    urgencySignals: hasUrgencySignal(lead) ? 1 : 0,
  };

  return Math.round(
    normalized.leadScore * weights.leadScore * 100 +
    normalized.timeSinceContact * weights.timeSinceContact * 100 +
    normalized.engagementDecay * weights.engagementDecay * 100 +
    normalized.urgencySignals * weights.urgencySignals * 100
  );
}

/**
 * Detect urgency signals in lead notes
 */
function hasUrgencySignal(lead: ContactLead): boolean {
  // Check notes for urgency keywords
  const notes = lead.notes?.map(n => n.content).join(' ') || '';
  const signals = [
    /budget|anggaran|biaya/i,
    /urgent|segera|cepat|asap/i,
    /competitor|saingan|bandingkan/i,
    /ready|siap|mau/i,
  ];
  return signals.some(pattern => pattern.test(notes));
}

/**
 * Detect opportunity type from conversation patterns
 */
function detectOpportunityType(lead: ContactLead): string | null {
  const notes = lead.notes?.map(n => n.content).join(' ') || '';

  if (/budget|anggaran|biaya/i.test(notes)) return 'Budget discussion detected';
  if (/competitor|saingan|bandingkan/i.test(notes)) return 'Competitor comparison mentioned';
  if (/urgent|segera|cepat/i.test(notes)) return 'Urgency signal detected';
  if (/demo|coba|trial/i.test(notes)) return 'Demo request detected';

  return null;
}

/**
 * Determine urgency level based on priority score and lead temperature
 */
function determineUrgency(priority: number, lead: ContactLead): 'immediate' | 'today' | 'this_week' {
  if (priority >= 80) return 'immediate';
  if (priority >= 60) return 'today';
  if (lead.leadTemperature === 'hot') return 'today';
  return 'this_week';
}

// ============================================
// TEMPLATE GENERATION
// ============================================

/**
 * System prompt for Grok template generation
 */
const TEMPLATE_SYSTEM_PROMPT = `You are Brain, writing personalized WhatsApp follow-up messages for Indonesian SME leads.

RULES:
- Keep it under 200 characters (WhatsApp friendly)
- Use the lead's name
- Reference their specific pain point or business type
- Be warm and conversational, not salesy
- Write in the same language as the conversation (ID or EN)

Example outputs:
- "Halo Ahmad! Masih ingat pembicaraan kita soal otomasi WhatsApp? Ada waktu diskusi lebih lanjut?"
- "Hi Sarah! Just following up on our chat about CRM automation. Ready to see a demo?"`;

/**
 * Generate personalized follow-up message using Grok API
 *
 * Fallback to generic template if Grok API fails
 */
async function generatePersonalizedTemplate(
  lead: ContactLead,
  language: 'id' | 'en'
): Promise<string> {
  const prompt = `Generate a follow-up message for:
Name: ${lead.name || 'there'}
Business: ${lead.businessType || 'unknown'}
Pain points: ${lead.painPoints?.join(', ') || 'general automation needs'}
Last contact: ${lead.daysSinceContact || 7} days ago
Language: ${language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English'}

Write ONE short, personalized follow-up message.`;

  try {
    const result = await callGrokAPI(TEMPLATE_SYSTEM_PROMPT, prompt);
    return result.content.trim();
  } catch (error) {
    // Fallback to generic template
    return language === 'id'
      ? `Halo ${lead.name || 'there'}! Ada waktu untuk lanjut diskusi soal kebutuhan bisnis Anda?`
      : `Hi ${lead.name || 'there'}! Do you have time to continue our discussion about your business needs?`;
  }
}

/**
 * Generate action recommendations for a workspace
 *
 * Process:
 * 1. Get qualified leads needing follow-up
 * 2. Get all qualified/hot leads for other actions
 * 3. Generate follow-up recommendations with priority scoring
 * 4. Generate handoff-ready alerts for hot leads
 * 5. Generate opportunity alerts from conversation patterns
 * 6. Generate personalized templates for top 5 follow-ups (using Grok)
 * 7. Deduplicate by contact (highest priority wins)
 * 8. Store top 20 recommendations in database
 */
export const generateActionRecommendations = internalAction({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<ActionRecommendation[]> => {
    console.log(`[Brain] Generating action recommendations for workspace ${args.workspaceId}`);

    // 1. Get qualified leads needing follow-up
    // Note: leads.ts exports regular queries, so use api.leads (not internal.leads)
    const leadsNeedingFollowUp = await ctx.runQuery(api.leads.getLeadsNeedingFollowUp, {
      workspaceId: args.workspaceId,
      daysSinceContact: 7,
    });

    // 2. Get all qualified and hot leads for other action types
    const qualifiedLeads = await ctx.runQuery(api.leads.getLeadsByStatus, {
      workspaceId: args.workspaceId,
      status: 'qualified',
      limit: 50,
    });

    const recommendations: ActionRecommendation[] = [];

    // 3. Generate follow-up recommendations
    for (const lead of leadsNeedingFollowUp) {
      // Cast to ContactLead type for type safety
      const typedLead = lead as ContactLead;
      const priority = calculateActionPriority(typedLead);
      recommendations.push({
        contactId: lead._id,
        contactName: lead.name,
        contactPhone: lead.phone,
        actionType: 'follow_up',
        priority,
        urgency: determineUrgency(priority, typedLead),
        reason: `Qualified lead, ${lead.daysSinceContact || '7+'} days since last contact`,
      });
    }

    // 4. Generate handoff-ready recommendations for hot leads
    for (const lead of qualifiedLeads) {
      const typedLead = lead as ContactLead;
      if (lead.leadTemperature === 'hot' && (lead.leadScore || 0) >= 70) {
        recommendations.push({
          contactId: lead._id,
          contactName: lead.name,
          contactPhone: lead.phone,
          actionType: 'handoff_ready',
          priority: 95,
          urgency: 'immediate',
          reason: `Hot lead (score: ${lead.leadScore}), ready for human contact`,
        });
      }
    }

    // 5. Generate opportunity alerts
    for (const lead of qualifiedLeads) {
      const typedLead = lead as ContactLead;
      const opportunity = detectOpportunityType(typedLead);
      if (opportunity) {
        recommendations.push({
          contactId: lead._id,
          contactName: lead.name,
          contactPhone: lead.phone,
          actionType: 'opportunity_alert',
          priority: 90,
          urgency: 'immediate',
          reason: opportunity,
        });
      }
    }

    // 6. Generate personalized templates for top follow-ups (limit to 5 to control API costs)
    const followUps = recommendations.filter(r => r.actionType === 'follow_up').slice(0, 5);
    for (const rec of followUps) {
      const lead = leadsNeedingFollowUp.find(l => l._id === rec.contactId) as ContactLead | undefined;
      if (lead) {
        rec.suggestedMessage = await generatePersonalizedTemplate(
          lead,
          (lead.sarahLanguage as 'id' | 'en') || 'id'
        );
      }
    }

    // 7. Sort by priority (highest first) and deduplicate by contact
    const seen = new Set<string>();
    const deduped = recommendations
      .sort((a, b) => b.priority - a.priority)
      .filter(r => {
        if (seen.has(r.contactId)) return false;
        seen.add(r.contactId);
        return true;
      });

    // 8. Store recommendations in database
    for (const rec of deduped.slice(0, 20)) { // Limit to top 20
      await ctx.runMutation(internal.brainActions.createActionRecommendation, {
        workspace_id: args.workspaceId,
        contact_id: rec.contactId as Id<"contacts">,
        action_type: rec.actionType,
        priority: rec.priority,
        urgency: rec.urgency,
        reason: rec.reason,
        suggested_message: rec.suggestedMessage,
      });
    }

    console.log(`[Brain] Generated ${deduped.length} action recommendations`);
    return deduped;
  },
});

// ============================================
// CONVERSATION PATTERN ANALYSIS
// ============================================

/**
 * System prompt for pattern analysis with FAQ suggestions (MGR-06)
 */
const PATTERN_ANALYSIS_SYSTEM_PROMPT = `You are Brain, analyzing conversation patterns for an Indonesian SME CRM.

Your job is to identify:
1. TRENDING TOPICS - What do leads ask about most?
2. OBJECTION PATTERNS - Common concerns (pricing, timing, technical)
3. INTEREST SIGNALS - Buying intent indicators
4. REJECTION REASONS - Why leads went cold

For TRENDING TOPICS and OBJECTION PATTERNS, also generate FAQ SUGGESTIONS.

OUTPUT FORMAT (JSON only, no markdown):
{
  "trending_topics": [
    {
      "topic": "...",
      "frequency": N,
      "examples": ["...", "..."],
      "suggested_faqs": [
        { "question": "...", "suggested_answer": "..." }
      ]
    }
  ],
  "objections": [
    {
      "objection": "...",
      "frequency": N,
      "examples": ["...", "..."],
      "suggested_faqs": [
        { "question": "...", "suggested_answer": "..." }
      ]
    }
  ],
  "interest_signals": [
    { "signal": "...", "frequency": N, "examples": ["...", "..."] }
  ],
  "rejection_reasons": [
    { "reason": "...", "frequency": N, "examples": ["...", "..."] }
  ]
}

RULES:
- Only report patterns if you see 3+ examples
- Include actual quotes as examples (max 3 per pattern)
- frequency is the count of occurrences
- For trending_topics and objections, ALWAYS include suggested_faqs with 1-2 draft FAQ entries
- FAQ answers should be helpful, concise, and in Indonesian or English based on the examples
- If not enough data, return empty arrays with a "data_insufficient" flag`;

/**
 * Pattern analysis result type with FAQ suggestions (MGR-06)
 */
interface PatternAnalysisResult {
  trending_topics: Array<{
    topic: string;
    frequency: number;
    examples: string[];
    suggested_faqs?: Array<{
      question: string;
      suggested_answer: string;
    }>;
  }>;
  objections: Array<{
    objection: string;
    frequency: number;
    examples: string[];
    suggested_faqs?: Array<{
      question: string;
      suggested_answer: string;
    }>;
  }>;
  interest_signals: Array<{
    signal: string;
    frequency: number;
    examples: string[];
  }>;
  rejection_reasons: Array<{
    reason: string;
    frequency: number;
    examples: string[];
  }>;
  data_insufficient?: boolean;
}

/**
 * Calculate time range cutoff for pattern analysis
 */
function getTimeRangeCutoff(timeRange: 'today' | 'week' | 'month'): number {
  const now = Date.now();
  switch (timeRange) {
    case 'today':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.getTime();
    case 'week':
      return now - 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return now - 30 * 24 * 60 * 60 * 1000;
    default:
      return now - 7 * 24 * 60 * 60 * 1000;
  }
}

/**
 * internalQuery: getContactsWithNotes
 * Helper query to fetch contacts with recent activity (MUST be defined before analyzeConversationPatterns)
 */
export const getContactsWithNotes = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId))
      .filter((q) => q.gte(q.field("lastActivityAt"), args.since))
      .collect();

    return contacts.map(c => ({
      _id: c._id,
      name: c.name,
      notes: c.notes,
      painPoints: c.painPoints,
      leadStatus: c.leadStatus,
      leadTemperature: c.leadTemperature,
    }));
  },
});
