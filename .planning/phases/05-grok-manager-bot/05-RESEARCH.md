# Phase 5: Grok Manager Bot - Research

**Researched:** 2026-01-31
**Domain:** AI-powered lead analysis, business intelligence, and decision support
**Confidence:** HIGH

## Summary

Phase 5 implements Brain (Grok Manager Bot) - an AI-powered decision support system that analyzes leads, generates daily summaries, and provides actionable recommendations. This research validates the technical approach using Grok 4.1-fast for cost-effective analysis ($0.20/$0.50 per million tokens), Kapso workflows for command triggers and scheduling, and Convex for dashboard data storage.

**Key findings:**
- Grok API is OpenAI-compatible with proven business intelligence capabilities
- Lead scoring best practices use 0-100 scale with 70+ hot, 40-69 warm, 0-39 cold thresholds
- Summary generation requires focused, incremental prompts with human oversight
- Action recommendation engines use hybrid collaborative + content-based filtering
- Conversation analysis tools detect patterns, objections, and sentiment with 25% customer retention boost
- WhatsApp keyword triggers (like !summary) remain viable despite 2026 AI policy changes

**Primary recommendation:** Implement Brain as Kapso workflow with Grok 4.1-fast, using keyword triggers for !summary command and Convex HTTP endpoint for scheduled daily summaries. Store analysis results in Convex for dashboard display (Phase 6).

## Standard Stack

The established libraries/tools for AI-powered lead analysis and business intelligence:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Grok 4.1-fast | Current (2026) | Lead analysis and summary generation | Cost-effective ($0.20/$0.50/M tokens), 64 intelligence rating, OpenAI-compatible API |
| Kapso Workflows | Current | WhatsApp automation and triggers | Native workflow builder, already integrated (Phase 2-4) |
| Convex HTTP Actions | Current | Data storage and webhook endpoints | Existing infrastructure, real-time queries |
| x.ai API | v1 | Grok model access | Official xAI endpoint (https://api.x.ai/v1/chat/completions) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Grok 4 | Current | Deep analysis (optional upgrade) | Complex pattern detection ($3/$15 vs $0.20/$0.50) |
| Cloudflare Workers | Current | External API calls from Kapso | Already used in Phase 3 (fetch-intern-settings) |
| Convex Cron | Current | Scheduled daily summaries | Built-in scheduling, no external dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Grok 4.1-fast | GPT-4o | Higher cost (~$5/M vs $0.20/M), similar quality |
| Grok 4.1-fast | Claude 3.5 Sonnet | More expensive, already used elsewhere (Mouth/Brain distinction) |
| Kapso workflows | Custom Node.js service | More complex, loses Kapso visual builder benefits |
| Convex HTTP | Direct Grok calls from frontend | Exposes API keys, no server-side logic |

**Installation:**
```bash
# No npm packages needed - all API-based integrations
# Grok API key stored in Kapso environment variables
# Convex deployment handled via existing setup
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── brainAnalysis.ts        # Grok analysis logic (HTTP action)
├── brainSummaries.ts       # Daily summary generation
├── brainInsights.ts        # Pattern detection, content recommendations
├── brainActions.ts         # Action recommendation engine
└── crons.ts                # Daily summary scheduler

.planning/phases/05-grok-manager-bot/
├── grok-workflow.json      # Kapso workflow export (for !summary trigger)
└── brain-functions/        # Cloudflare Worker functions
    ├── analyze-leads.js    # Lead analysis aggregator
    └── generate-summary.js # Summary formatter
```

### Pattern 1: Hybrid Scoring (Read Sarah + Re-calculate)
**What:** Brain reads Sarah's existing score, shows reasoning, and re-calculates if needed
**When to use:** When Sarah has already scored a lead but Brain sees additional context
**Example:**
```typescript
// Source: Project CONTEXT.md + business_21/03_bots/E-handoff-to-human.md
interface LeadScoreAnalysis {
  sarahScore: number;           // From sarahConversations table
  brainScore: number;           // Re-calculated with additional factors
  brainReasoning: string;       // Why Brain's score differs
  finalScore: number;           // Use Brain's if justification is clear
  temperature: 'hot' | 'warm' | 'cold';
  factors: {
    engagement: number;         // Message frequency, response time
    dataCompleteness: number;   // How many fields filled
    businessFit: number;        // Match with ideal customer profile
    behavioralPatterns: number; // Urgency signals, buying intent
  };
}

// Scoring thresholds (consistent with Sarah)
const thresholds = {
  hot: 70,   // 70-100
  warm: 40,  // 40-69
  cold: 0,   // 0-39
};
```

### Pattern 2: Command Trigger via Kapso Workflow
**What:** WhatsApp keyword (!summary) triggers Brain summary via Kapso
**When to use:** Hidden commands for business owners to request instant analysis
**Example:**
```javascript
// Kapso Workflow: Rules Engine
// Node: AI Decide (keyword detection)
{
  "node_type": "ai_decide",
  "keywords": ["!summary", "!Summary", "SUMMARY"],
  "match_mode": "exact",
  "action": "trigger_brain_summary"
}

// Node: Function Call (generate summary)
{
  "node_type": "function",
  "function_id": "generate-summary",
  "params": {
    "workspace_id": "{{workspace.id}}",
    "trigger": "manual",
    "requested_by": "{{contact.phone}}"
  }
}

// Node: Send Message (conversational summary)
{
  "node_type": "send_message",
  "template": "{{function.summary_text}}"
}
```

### Pattern 3: Scheduled Summary via Convex Cron
**What:** Daily summary generation triggered by Convex cron job
**When to use:** Automatic daily digest for business owners at configured time
**Example:**
```typescript
// Source: convex/crons.ts (existing pattern from project)
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "daily brain summary",
  { hourUTC: 1, minuteUTC: 0 }, // 09:00 WIB (UTC+8)
  internal.brainSummaries.generateDailySummary,
  { trigger: "scheduled" }
);

export default crons;
```

### Pattern 4: Action Prioritization Algorithm
**What:** Weighted scoring for follow-up recommendations
**When to use:** Generating "who needs follow-up" action items
**Example:**
```typescript
// Source: Lead scoring best practices + conversation intelligence research
interface ActionPriority {
  contactId: string;
  priority: number;  // 0-100 calculated score
  reason: string;
  urgency: 'immediate' | 'today' | 'this_week';
  suggestedAction: string;
}

function calculateActionPriority(lead: Lead): number {
  const weights = {
    leadScore: 0.40,        // Highest weight - hot leads first
    timeSinceContact: 0.30, // Urgency based on last contact
    engagementDecay: 0.20,  // Leads going cold need attention
    urgencySignals: 0.10,   // Budget mention, competitor comparison
  };

  const normalized = {
    leadScore: lead.leadScore / 100,
    timeSinceContact: Math.min(lead.daysSinceContact / 14, 1), // Cap at 14 days
    engagementDecay: lead.previousScore > lead.currentScore ? 1 : 0,
    urgencySignals: lead.hasUrgencySignal ? 1 : 0,
  };

  return (
    normalized.leadScore * weights.leadScore * 100 +
    normalized.timeSinceContact * weights.timeSinceContact * 100 +
    normalized.engagementDecay * weights.engagementDecay * 100 +
    normalized.urgencySignals * weights.urgencySignals * 100
  );
}
```

### Pattern 5: Conversational Summary Generation
**What:** Natural language summary with data points, not formal reports
**When to use:** Responding to !summary command or daily digest
**Example:**
```typescript
// Source: LLM best practices 2026 + CONTEXT.md user preferences
const summarySystemPrompt = `
You are the Brain (Grok) - analytical AI for my21staff. Your job is to summarize lead activity in a conversational, friendly tone.

TONE: Conversational assistant (friendly but focused)
- Good: "Here's what happened today - you've got 3 hot ones!"
- Bad: "Today's summary: 5 new leads, 3 hot leads, 2 conversions"
- Bad: "5 new | 3 need attention | 2 went cold"

FORMAT: Hybrid conversational + data
- Start with natural language intro
- Include key metrics as bullet points
- End with specific action recommendations

FOCUS: Actionable insights, not data dumps
- Highlight what owner needs to DO
- Prioritize hot leads and urgent actions
- Explain WHY leads went cold (rejection analysis)
`;

// Prompt structure (focused, incremental)
const dailySummaryPrompt = `
Analyze today's lead activity and generate a conversational summary.

Today's Data:
- New leads: ${stats.newToday}
- Lead sources: ${stats.sources}
- Response rate: ${stats.responseRate}
- Hot leads: ${stats.hot} (names: ${hotLeadNames})
- Common questions: ${stats.topQuestions}
- Rejections: ${stats.rejections} (reasons: ${rejectionReasons})

Generate a friendly summary following the tone guidelines above.
`;
```

### Anti-Patterns to Avoid
- **Don't build custom NLP for pattern detection:** Use Grok's built-in capabilities for objection tracking and topic clustering. Custom NLP requires training data and maintenance.
- **Don't store full conversation history in prompts:** Use last 20-30 messages max. Token costs scale linearly - summarize older conversations.
- **Don't make Brain synchronous in Sarah's workflow:** Brain analysis runs AFTER Sarah responds (async), not blocking message flow.
- **Don't hardcode summary metrics:** Make all metrics configurable via Brain settings (brainConfig table).
- **Don't expose Grok API keys in frontend:** All Grok calls must go through Convex HTTP actions or Kapso Cloudflare Workers.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Lead scoring formula | Custom point calculator | Grok 4.1-fast with prompt engineering | AI adapts to context (budget mention, competitor comparison) that fixed formulas miss. Research shows AI-assisted reps close 36% faster. |
| Objection pattern detection | Regex keyword matching | Grok conversation analysis | NLP detects nuanced objections (tone, context). Simple regex misses "price seems high" vs "budget approved, pricing?" |
| Daily scheduling | Custom cron service | Convex crons (built-in) | Convex handles timezone conversion, error handling, retry logic automatically. No infrastructure to maintain. |
| Summary formatting | Template strings | Grok with conversational prompt | LLM generates natural language summaries that adapt to data. Templates feel robotic ("5 new leads" vs "You've got 5 fresh ones!"). |
| Action prioritization | Sort by lead_score | Weighted algorithm with decay | Priority needs multiple factors: score + timing + urgency + engagement decay. Single-field sort misses leads going cold. |
| Sentiment analysis | Custom sentiment library | Grok with objection tracking prompt | Training custom models requires labeled data. Grok's pre-trained capabilities handle sentiment out of the box. |

**Key insight:** AI is cost-effective enough ($0.20/M tokens) to replace custom logic for most analysis tasks. Build custom logic only for exact-match requirements (like status transitions). Let AI handle fuzzy problems (pattern detection, summarization, recommendations).

## Common Pitfalls

### Pitfall 1: Token Bloat from Full Conversation History
**What goes wrong:** Passing entire conversation history to Grok for every analysis, causing costs to skyrocket
**Why it happens:** Developer assumes "more context = better analysis" without measuring token usage
**How to avoid:**
- Limit to last 20-30 messages for analysis (enough for context)
- Use summary of older messages instead of raw text
- Calculate expected token cost: 1000 messages * 100 tokens avg = 100K tokens * $0.20/M = $0.02 per analysis (acceptable)
- Monitor Convex aiUsage table for cost tracking
**Warning signs:**
- Analysis costs >$0.10 per lead
- Grok API timeout errors (prompt too long)
- Slow response times (>5 seconds)

### Pitfall 2: Synchronous Brain Blocking Sarah
**What goes wrong:** Sarah waits for Brain analysis before responding, causing 2-5 second delays for users
**Why it happens:** Developer couples Sarah response with Brain analysis in same workflow node
**How to avoid:**
- Sarah responds immediately (Phase 3 complete, proven fast)
- Brain analysis runs async AFTER response sent
- Use separate Kapso workflow or Convex action triggered by message event
- Dashboard displays Brain insights when available (eventual consistency)
**Warning signs:**
- Users complaining about slow bot responses
- Sarah message delays correlating with Grok API calls
- Kapso workflow execution time >3 seconds

### Pitfall 3: Overloading !summary Command
**What goes wrong:** !summary generates massive report causing WhatsApp message length errors or overwhelming user
**Why it happens:** Developer tries to include every possible metric in one message
**How to avoid:**
- Keep summary under 1000 characters (WhatsApp practical limit for readability)
- Use conversational format with 3-5 key points (from CONTEXT.md)
- Break into multiple messages if needed: "Here's part 1... (typing)" then send part 2
- Default metrics from Brain settings: lead count, response rate, hot leads, common questions, rejections
**Warning signs:**
- WhatsApp "message too long" errors
- Users not reading full summaries
- Multiple !summary requests for same day (sign summary wasn't useful)

### Pitfall 4: Ignoring Brain Settings Configuration
**What goes wrong:** Hardcoded metrics and thresholds don't match customer's business model
**Why it happens:** Developer ships with defaults and doesn't build settings UI (Phase 2.5 pattern)
**How to avoid:**
- Read from brainConfig table for ALL configurable values
- Provide defaults when config doesn't exist (graceful degradation)
- Settings include: summary time, metrics to track, scoring weights, hot/warm thresholds
- Reference internConfig pattern from Phase 2.5 (working example)
**Warning signs:**
- Customers asking "can I change the summary time?"
- Scoring doesn't match customer's sales process
- Summary includes metrics customer doesn't care about

### Pitfall 5: No Feedback Loop for Recommendations
**What goes wrong:** Brain suggests actions but never learns if they were useful
**Why it happens:** No tracking of recommendation outcomes (did they follow up? did it convert?)
**How to avoid:**
- For v2.0: Ship without feedback loop (acceptable MVP)
- For future: Track action outcomes in contacts table (followUpActioned, actionResult)
- Display accuracy metrics in dashboard ("Brain recommended 10 follow-ups, 7 converted")
- Use feedback to refine prioritization algorithm over time
**Warning signs:**
- Customers stop trusting Brain recommendations
- Action items consistently wrong (low-priority leads marked urgent)
- No way to validate Brain's effectiveness

### Pitfall 6: Hallucinated Insights from Missing Data
**What goes wrong:** Grok generates insights about leads that don't exist or creates false patterns
**Why it happens:** LLM tries to be helpful by inferring when data is sparse
**How to avoid:**
- Use structured prompts: "Only report patterns if you see 3+ examples"
- Validate Grok output against actual data before displaying
- System prompt: "If data is insufficient, say 'Not enough data yet' instead of guessing"
- Include confidence levels in insights: "High confidence" vs "Low confidence (only 2 examples)"
**Warning signs:**
- Dashboard shows insights that contradict raw data
- Customers say "I don't remember that lead"
- Insights reference non-existent conversations

## Code Examples

Verified patterns from official sources and project structure:

### Grok API Call (OpenAI-Compatible)
```typescript
// Source: Official xAI API docs (https://docs.x.ai/docs/models)
// Verified pricing: $0.20 input / $0.50 output per 1M tokens (Grok 4.1-fast)

async function callGrokAPI(prompt: string, systemPrompt: string): Promise<string> {
  const grokApiKey = process.env.GROK_API_KEY;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${grokApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-4.1-fast",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower for consistent JSON output
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Daily Summary HTTP Action (Convex)
```typescript
// Source: Existing convex/ai/brain.ts pattern + research findings
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateDailySummary = httpAction(async (ctx, request) => {
  const { workspaceId, trigger } = await request.json();

  // 1. Fetch Brain settings
  const config = await ctx.runQuery(internal.brainConfig.getByWorkspaceId, {
    workspaceId
  });

  if (!config?.summary.enabled) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  // 2. Gather today's lead data
  const stats = await ctx.runQuery(internal.leads.getLeadStats, { workspaceId });
  const hotLeads = await ctx.runQuery(internal.leads.getLeadsByStatus, {
    workspaceId,
    status: "qualified",
    limit: 10,
  });

  // 3. Build prompt from configurable metrics
  const metrics = buildMetricsFromConfig(config.summary.includeMetrics, stats);
  const prompt = buildSummaryPrompt(metrics, hotLeads);

  // 4. Call Grok for summary generation
  const summaryText = await callGrokAPI(prompt, BRAIN_SUMMARY_SYSTEM_PROMPT);

  // 5. Store summary in Convex for dashboard display
  await ctx.runMutation(internal.brainSummaries.createSummary, {
    workspaceId,
    summaryText,
    metrics,
    generatedAt: Date.now(),
    trigger,
  });

  // 6. Send to WhatsApp if trigger === "manual" (!summary command)
  if (trigger === "manual") {
    return new Response(JSON.stringify({ summaryText }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

### Action Recommendation Engine
```typescript
// Source: AI recommendation engine research + prioritization algorithms 2026
interface ActionRecommendation {
  contactId: string;
  priority: number;
  actionType: 'follow_up' | 'response_template' | 'handoff_ready' | 'opportunity_alert';
  reason: string;
  urgency: 'immediate' | 'today' | 'this_week';
  template?: string; // For response_template type
}

export const generateActionRecommendations = async (
  ctx: any,
  args: { workspaceId: string }
): Promise<ActionRecommendation[]> => {
  const leads = await ctx.db
    .query("contacts")
    .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId))
    .collect();

  const recommendations: ActionRecommendation[] = [];

  for (const lead of leads) {
    // Follow-up priority (qualified + no recent contact)
    if (lead.leadStatus === "qualified" && needsFollowUp(lead)) {
      const priority = calculateActionPriority(lead);
      recommendations.push({
        contactId: lead._id,
        priority,
        actionType: "follow_up",
        reason: `Qualified lead, ${lead.daysSinceContact} days since last contact`,
        urgency: priority > 80 ? "immediate" : priority > 60 ? "today" : "this_week",
      });
    }

    // Handoff ready (hot lead + handoff state)
    if (lead.leadTemperature === "hot" && lead.leadScore >= 70) {
      recommendations.push({
        contactId: lead._id,
        priority: 95, // High priority
        actionType: "handoff_ready",
        reason: `Hot lead (score: ${lead.leadScore}), ready for human contact`,
        urgency: "immediate",
      });
    }

    // Opportunity alert (budget mention, competitor comparison)
    if (hasOpportunitySignal(lead)) {
      recommendations.push({
        contactId: lead._id,
        priority: 90,
        actionType: "opportunity_alert",
        reason: detectOpportunityType(lead),
        urgency: "immediate",
      });
    }
  }

  // Sort by priority (highest first)
  return recommendations.sort((a, b) => b.priority - a.priority);
};

function hasOpportunitySignal(lead: any): boolean {
  const transcript = lead.notes?.map((n: any) => n.content).join(" ") || "";
  const signals = [
    /budget|price|cost|invest/i,
    /competitor|comparison|vs |alternative/i,
    /urgent|asap|immediately|now/i,
    /ready|decision|approve/i,
  ];
  return signals.some((pattern) => pattern.test(transcript));
}
```

### Conversation Insights (Pattern Detection)
```typescript
// Source: Conversation intelligence research (pattern detection, objection tracking)
interface ConversationInsight {
  type: 'trending_topic' | 'objection_pattern' | 'interest_signal';
  pattern: string;
  frequency: number;
  examples: string[];
  recommendation: string;
}

export const analyzeConversationPatterns = async (
  ctx: any,
  args: { workspaceId: string; timeRange: 'today' | 'week' | 'month' }
): Promise<ConversationInsight[]> => {
  const cutoff = getTimeRangeCutoff(args.timeRange);

  // Gather recent conversations
  const leads = await ctx.db
    .query("contacts")
    .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId))
    .filter((q: any) => q.gte(q.field("lastActivityAt"), cutoff))
    .collect();

  // Extract topics and objections
  const allNotes = leads.flatMap((lead: any) =>
    (lead.notes || []).map((note: any) => note.content)
  );

  // Call Grok for pattern analysis
  const prompt = `
Analyze these conversation excerpts and identify:
1. Trending topics (what do leads ask about most?)
2. Common objections (pricing, timing, technical concerns)
3. Interest signals (buying intent, urgency)

Conversations:
${allNotes.slice(0, 100).join("\n")} // Limit to first 100 for token control

Output as JSON array of insights with: type, pattern, frequency, examples, recommendation.
`;

  const grokResponse = await callGrokAPI(prompt, PATTERN_ANALYSIS_SYSTEM_PROMPT);
  const insights: ConversationInsight[] = JSON.parse(grokResponse);

  return insights;
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed lead scoring formulas | AI-powered contextual scoring | 2024-2025 | Adapts to nuanced signals (tone, urgency). 36% faster close rates (research). |
| Post-call analysis only | Real-time conversation intelligence | 2024-2025 | Immediate objection detection. 25% boost in customer retention (research). |
| Static dashboards | AI-powered dynamic insights | 2025-2026 | Natural language queries, automatic pattern detection. 5-6% productivity boost. |
| Manual summary writing | LLM-generated summaries | 2024-2025 | Faster, consistent summaries. Focus on focused prompts (2026 best practice). |
| Rule-based action routing | Hybrid recommendation engines | 2024-2025 | Collaborative + content-based filtering. Better prioritization accuracy. |
| Grok 2 ($2/$10) | Grok 4.1-fast ($0.20/$0.50) | Dec 2025 | 10x cheaper for same quality. Makes analysis cost-effective at scale. |

**Deprecated/outdated:**
- **Custom NLP libraries for sentiment:** Grok's built-in capabilities are sufficient and maintained by xAI
- **Separate scheduling services:** Convex crons handle scheduling with zero infrastructure (since Convex launch)
- **Static lead temperature labels:** Now calculated dynamically from behavior, not fixed on first interaction
- **Long-form executive summaries:** Users prefer conversational 3-5 bullet points (2026 research finding)

## Open Questions

Things that couldn't be fully resolved:

1. **Kapso scheduled workflow triggers**
   - What we know: Kapso has workflow automation and function nodes
   - What's unclear: Whether Kapso supports cron-based scheduled triggers natively
   - Recommendation: Use Convex crons for daily summaries (proven pattern), trigger Kapso workflow via webhook for WhatsApp delivery

2. **Grok's accuracy for Indonesian language analysis**
   - What we know: Grok 4.1-fast performs well on English business intelligence tasks
   - What's unclear: Performance on casual Indonesian (Bahasa gaul) for objection/sentiment detection
   - Recommendation: Test with sample Indonesian conversations in Phase 5 implementation. Fallback: English translation layer if accuracy <85%

3. **Brain settings backup strategy**
   - What we know: Phase 2.5 implemented settings backup for Intern config (working pattern)
   - What's unclear: Whether Brain config needs same backup strategy or simpler approach
   - Recommendation: Reuse settingsBackup table pattern from Phase 2.5 (low effort, consistent with existing architecture)

4. **Optimal summary freshness vs cost**
   - What we know: Daily summaries cost ~$0.02-0.05 per workspace (50-250K tokens)
   - What's unclear: Whether customers want multiple daily summaries or single end-of-day
   - Recommendation: Start with single daily summary (configurable time in Brain settings). Add "refresh" button in dashboard if users request real-time updates.

5. **Conversation insights retention period**
   - What we know: Pattern detection requires historical data (1-30 days of conversations)
   - What's unclear: How long to store brainSummaries and brainInsights records before archiving
   - Recommendation: Keep last 90 days in active database, archive older summaries. Revisit after v2.0 launch based on actual usage patterns.

## Sources

### Primary (HIGH confidence)
- xAI official API documentation: [Models and Pricing](https://docs.x.ai/docs/models) - Grok 4.1-fast pricing ($0.20/$0.50 per 1M tokens), model capabilities, API structure
- xAI official website: [API Public Beta](https://x.ai/api) - OpenAI-compatible integration patterns
- Grok Review 2026: [We Tested xAI's Model](https://hackceleration.com/grok-review/) - Real-world performance data, business intelligence use cases
- Kapso official documentation: [Workflows Introduction](https://docs.kapso.ai/docs/workflows/introduction) - Workflow automation capabilities
- Existing project codebase: convex/ai/brain.ts, convex/brainConfig.ts - Proven patterns for Grok integration

### Secondary (MEDIUM confidence)
- Lead scoring classification research: [Cold, Warm, and Hot Leads](https://revnew.com/blog/cold-warm-and-hot-leads) - 70+ hot, 40-69 warm, 0-39 cold thresholds (industry standard)
- Lead Scoring Thomasnet Guide: [Definition, How To Score, and Models](https://blog.thomasnet.com/lead-generation/lead-scoring) - Scoring methodology, predictive analytics approaches
- Conversation intelligence research: [How AI Detects Objections](https://www.trata.ai/blogs/how-ai-detects-objections-in-sales-calls) - Pattern detection, objection tracking techniques
- LLM coding workflow 2026: [My LLM coding workflow](https://addyosmani.com/blog/ai-coding-workflow/) - Best practices for focused prompts, incremental generation
- Dashboard KPI guide 2026: [The 2026 Guide to Sales and Marketing Performance Metrics](https://querio.ai/articles/2026-guide-sales-marketing-performance-metrics-kpis-dashboards-ai-insights) - AI-powered dashboards, visualization strategies
- AI recommendation engines: [AI-Powered Recommendation Engines](https://www.shaped.ai/blog/ai-powered-recommendation-engines) - Collaborative + content-based hybrid approaches

### Tertiary (LOW confidence)
- WhatsApp bot 2026 policy: [Not All Chatbots Are Banned](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban) - Keyword triggers remain allowed for structured bots
- Grok pricing comparison: [AI API Pricing Comparison 2025](https://intuitionlabs.ai/articles/ai-api-pricing-comparison-grok-gemini-openai-claude) - Cost benchmarks across providers
- Conversation analytics tools 2026: [Top 12 Conversational Analytics Tools](https://www.zonkafeedback.com/blog/conversational-analytics-tools-software) - Industry tool landscape

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Grok API pricing verified from official docs, Kapso/Convex patterns proven in existing codebase
- Architecture: HIGH - Patterns mirror successful Phase 2-4 implementations (HTTP actions, Cloudflare Workers, Convex queries)
- Pitfalls: MEDIUM - Based on LLM best practices research + general software engineering experience (not my21staff-specific yet)
- Lead scoring: HIGH - 70/40 thresholds confirmed in project's E-handoff-to-human.md + industry standard research

**Research date:** 2026-01-31
**Valid until:** 60 days (2026-04-01) - Stable domain (AI APIs, scoring algorithms). Re-verify Grok pricing if xAI announces changes.

**Key assumptions validated:**
1. Grok 4.1-fast is cost-effective for high-volume analysis (verified: $0.20/$0.50 per 1M tokens)
2. OpenAI-compatible API means easy integration (verified: existing brain.ts uses same pattern)
3. Kapso workflow keyword triggers work for !summary (verified: Phase 2-3 use keyword detection successfully)
4. Convex crons can handle daily scheduling (verified: convex/crons.ts exists with hourly sync example)
5. Lead scoring thresholds 70/40 match business logic (verified: E-handoff-to-human.md + Sarah scoring)

**Open risks:**
- Grok accuracy on casual Indonesian unknown until tested
- Kapso native cron scheduling unclear (using Convex fallback)
- Summary freshness requirements unknown (starting with daily, can iterate)
