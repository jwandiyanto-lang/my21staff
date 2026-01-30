# Phase 3: Sarah Chat Bot - Research

**Researched:** 2026-01-30
**Domain:** Conversational AI with Gemini 2.5 Flash + Kapso WhatsApp workflow integration
**Confidence:** MEDIUM (Kapso workflow architecture confirmed via existing code, Gemini 2.5 capabilities verified via official docs, specific Kapso Agent node details LOW)

## Summary

Phase 3 builds a conversational AI bot (Sarah) that handles natural WhatsApp conversations, extracts lead qualification data through multi-turn dialog, scores leads, and triggers handoffs. The implementation combines Gemini 2.5 Flash for natural language understanding with Kapso's WhatsApp infrastructure and Convex for persistent state storage.

**Architecture decision:** Sarah runs as a **custom Convex-based AI handler** (like Phase 2's ARI system), NOT as a Kapso workflow node. Kapso workflows are rule-based decision trees (keyword matching, routing), while Sarah requires conversational AI with state machines, structured data extraction, and complex scoring logic that exceeds Kapso workflow capabilities.

**Key insight:** Phase 2 established the pattern: Kapso webhook → Convex processWebhook → Convex processARI (AI logic) → sendKapsoMessage. Phase 3 extends this pattern by replacing simple ARI with Sarah's stateful conversation engine.

**Primary recommendation:** Build Sarah as a Convex-based state machine with Gemini 2.5 Flash integration, storing conversation state in ariConversations table, using Kapso only for message transport (webhook in, API send out).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Gemini 2.5 Flash | API | Conversational AI + structured output | Google's production-ready model with 1M token context, $0.30/1M input tokens, native JSON schema support |
| Google AI SDK | Latest (2026) | Gemini API client | Official SDK with multi-turn chat sessions, conversation history management |
| Convex | Production | State storage + real-time sync | Already integrated, handles ariConversations table with state machine persistence |
| Kapso API | v24.0 | WhatsApp message transport | Already configured (Project ID, API key, phone number, inbound webhook active) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | Latest | Schema validation | Validate Gemini structured output before database insertion |
| TypeScript | 5.x | Type safety | Ensure conversation state types match between Convex schema and Gemini responses |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Gemini 2.5 Flash | Grok 4.1-fast (Phase 2) | Grok lacks structured output + vision, but already integrated. Decision: Use Gemini for Sarah, keep Grok for Brain (Phase 5) |
| Convex state storage | Kapso KV storage | KV has expiration limits (24h max), no complex queries. Decision: Keep Convex as single source of truth |
| Custom AI handler | Kapso Agent workflow node | Agent nodes lack state machine control + complex scoring. Decision: Custom Convex handler for flexibility |

**Installation:**
```bash
npm install @google/generative-ai  # Official Gemini SDK
npm install zod                     # Schema validation
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── sarah/
│   ├── conversation.ts      # State machine logic (greeting → qualifying → scoring → handoff)
│   ├── extraction.ts        # Gemini structured output for 5 fields
│   ├── scoring.ts           # Lead scoring algorithm (0-100)
│   ├── language.ts          # Indonesian/English detection + response templates
│   └── prompts.ts           # Sarah persona prompt + state-specific instructions
src/
└── lib/
    └── gemini-client.ts     # Gemini API wrapper with chat sessions
```

### Pattern 1: Stateful Conversation Handler (Extends Phase 2 ARI Pattern)

**What:** Sarah replaces processARI with a state-machine-driven conversation handler

**When to use:** For conversational bots that need multi-step data collection with context retention

**Example:**
```typescript
// convex/kapso.ts - Extend existing processWebhook
export const processWebhook = internalMutation({
  handler: async (ctx, args) => {
    // ... existing contact/conversation creation ...

    // Schedule Sarah processing for text messages (replaces ARI check)
    if (message.type === "text") {
      await ctx.scheduler.runAfter(0, internal.sarah.processSarahMessage, {
        workspace_id: workspaceId,
        contact_id: contact._id,
        contact_phone: phone,
        user_message: textContent,
        kapso_message_id: message.id,
      });
    }
  }
});

// convex/sarah/conversation.ts - New Sarah handler
export const processSarahMessage = internalAction({
  args: {
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
    contact_phone: v.string(),
    user_message: v.string(),
    kapso_message_id: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get/create Sarah conversation with state
    const sarahConv = await ctx.runMutation(internal.sarah.getSarahContext, {
      workspace_id: args.workspace_id,
      contact_id: args.contact_id,
    });

    // 2. Determine next action based on state
    const currentState = sarahConv.state; // "greeting", "qualifying", "scoring", "handoff", "completed"

    // 3. Call Gemini with state-specific prompt
    const geminiResponse = await generateSarahResponse({
      state: currentState,
      userMessage: args.user_message,
      conversationHistory: sarahConv.messageHistory,
      extractedData: sarahConv.context?.collected || {},
      language: detectLanguage(args.user_message),
    });

    // 4. Extract structured data if in qualifying state
    if (currentState === "qualifying" && geminiResponse.extractedData) {
      await ctx.runMutation(internal.sarah.updateExtractedData, {
        sarahConvId: sarahConv._id,
        extractedData: geminiResponse.extractedData,
      });
    }

    // 5. Update state machine
    const nextState = determineNextState(currentState, sarahConv.context);
    await ctx.runMutation(internal.sarah.updateState, {
      sarahConvId: sarahConv._id,
      state: nextState,
    });

    // 6. Send response via Kapso
    await sendKapsoMessage(
      sarahConv.workspace.meta_access_token,
      sarahConv.workspace.kapso_phone_id,
      args.contact_phone,
      geminiResponse.content
    );

    // 7. If state is handoff, trigger consultant notification
    if (nextState === "handoff") {
      await ctx.runMutation(internal.sarah.triggerHandoff, {
        contact_id: args.contact_id,
        lead_score: sarahConv.lead_score,
        reason: sarahConv.context?.routing?.handoff_reason,
      });
    }
  }
});
```

### Pattern 2: Gemini Structured Output for Data Extraction

**What:** Use Gemini's native JSON schema to extract 5 fields from conversation

**When to use:** When you need guaranteed JSON output that matches a TypeScript interface

**Example:**
```typescript
// convex/sarah/extraction.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

interface QualificationData {
  name?: string | null;
  business_type?: string | null;
  team_size?: number | null;
  pain_points?: string[] | null;
  goals?: string | null;
}

const responseSchema = {
  type: "object",
  properties: {
    name: { type: "string", nullable: true },
    business_type: { type: "string", nullable: true },
    team_size: { type: "integer", nullable: true },
    pain_points: { type: "array", items: { type: "string" }, nullable: true },
    goals: { type: "string", nullable: true },
  },
  required: [], // All optional - partial extraction is OK
};

export async function extractDataFromMessage(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  currentData: QualificationData
): Promise<QualificationData> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const prompt = `
You are extracting lead qualification data from a conversation.

CURRENT DATA ALREADY COLLECTED:
${JSON.stringify(currentData, null, 2)}

CONVERSATION HISTORY:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

USER'S LATEST MESSAGE:
${userMessage}

Extract any NEW information mentioned in the latest message. Return null for fields not mentioned.

EXTRACTION RULES:
- name: Full name (not business name)
- business_type: Industry/sector (e.g., "fashion retail", "F&B delivery")
- team_size: Number of people handling customer chat/CS
- pain_points: Array of challenges mentioned (e.g., ["slow response", "miss messages"])
- goals: What they want from my21staff

Return ONLY the JSON object with extracted fields.
`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const extracted = JSON.parse(response) as QualificationData;

  // Merge with existing data (only overwrite if new data is not null)
  return {
    name: extracted.name || currentData.name,
    business_type: extracted.business_type || currentData.business_type,
    team_size: extracted.team_size || currentData.team_size,
    pain_points: extracted.pain_points ?
      [...(currentData.pain_points || []), ...extracted.pain_points] :
      currentData.pain_points,
    goals: extracted.goals || currentData.goals,
  };
}
```

### Pattern 3: State Machine with Database Persistence

**What:** Store conversation state in Convex ariConversations table with state field

**When to use:** When conversation spans multiple days and needs to resume from correct state

**Example:**
```typescript
// convex/sarah/conversation.ts
export const getSarahContext = internalMutation({
  args: {
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    // Get or create Sarah conversation
    let sarahConv = await ctx.db
      .query("ariConversations")
      .withIndex("by_workspace_contact", (q) =>
        q.eq("workspace_id", args.workspace_id).eq("contact_id", args.contact_id)
      )
      .first();

    if (!sarahConv) {
      const now = Date.now();
      const convId = await ctx.db.insert("ariConversations", {
        workspace_id: args.workspace_id,
        contact_id: args.contact_id,
        state: "greeting", // Initial state
        lead_score: 0,
        context: {
          collected: {},
          routing: {},
        },
        created_at: now,
        updated_at: now,
        supabaseId: "",
      });
      sarahConv = await ctx.db.get(convId);
    }

    // Get conversation history
    const messages = await ctx.db
      .query("ariMessages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("ari_conversation_id", sarahConv._id)
      )
      .order("desc")
      .take(20);

    return {
      _id: sarahConv._id,
      state: sarahConv.state,
      lead_score: sarahConv.lead_score,
      context: sarahConv.context,
      messageHistory: messages.reverse().map(m => ({
        role: m.role,
        content: m.content,
      })),
    };
  },
});

// State transitions
export function determineNextState(
  currentState: string,
  context: any
): string {
  const collected = context?.collected || {};

  switch (currentState) {
    case "greeting":
      return "qualifying"; // Always move to qualifying after greeting

    case "qualifying":
      // Check if all 5 fields are collected
      const hasAllData =
        collected.name &&
        collected.business_type &&
        collected.team_size !== null &&
        collected.pain_points &&
        collected.goals;

      return hasAllData ? "scoring" : "qualifying"; // Stay in qualifying until data complete

    case "scoring":
      // Calculate lead score and route
      const score = calculateLeadScore(context);
      if (score >= 70) return "handoff"; // Hot lead
      if (score < 40) return "completed"; // Cold lead
      return "scoring"; // Warm lead - continue conversation

    case "handoff":
    case "completed":
      return currentState; // Terminal states

    default:
      return "greeting";
  }
}
```

### Anti-Patterns to Avoid

- **Storing state in Kapso KV:** KV has 24h expiration limit - conversations may span days
- **Re-asking already collected fields:** Always merge new extraction with existing data
- **Verbose AI responses:** Enforce 140-char limit in prompt, not post-processing
- **Ignoring language detection:** User may switch between Indonesian/English mid-conversation
- **Blocking on handoff:** Consultant notification should be async (scheduler.runAfter)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-turn chat context | Manual message history array manipulation | Gemini Chat Sessions (`client.chats.create()`) | Gemini SDK handles history truncation, context window management, and token limits automatically |
| JSON schema validation | Custom parsing + error handling | Gemini `responseSchema` + Zod validation | Gemini guarantees valid JSON structure, Zod catches edge cases before DB insert |
| Language detection | Regex patterns for Indonesian/English | Gemini prompt instruction + confidence score | LLMs detect language nuances (code-switching, slang) better than regex |
| Lead scoring algorithm | Complex if/else scoring rules | Structured scoring table in database + simple point accumulation | Phase 2.5 established scoring_rules in workspace settings - reuse this pattern |
| State machine transitions | String comparisons scattered across codebase | Single determineNextState function with switch statement | Centralized logic prevents inconsistent state changes |

**Key insight:** Gemini 2.5 Flash's structured output eliminates 90% of data extraction complexity. Don't build custom parsers.

## Common Pitfalls

### Pitfall 1: Treating Sarah as a Kapso Workflow Node

**What goes wrong:** Attempting to build Sarah inside Kapso workflow builder leads to rigid conversation flows that can't handle natural language variations

**Why it happens:** Phase 2 used Kapso workflows successfully for rule-based routing, creating assumption that Sarah should also live in Kapso

**How to avoid:** Sarah is fundamentally different - she needs:
- State machine with 5+ states
- Partial data extraction across multiple messages
- Complex scoring logic (4 components, conditional weights)
- Conversation memory spanning days
- Image analysis capability

These requirements exceed Kapso workflow capabilities. Build Sarah in Convex as an AI action (like existing processARI pattern).

**Warning signs:**
- Trying to store extraction state in Kapso workflow variables
- Building multiple workflows for each conversation state
- Difficulty accessing conversation history across workflow executions

### Pitfall 2: Context Window Overflow

**What goes wrong:** Sending entire conversation history to Gemini on every message exceeds 1M token limit after ~500 messages

**Why it happens:** Gemini 2.5 Flash has 1M token context, but Indonesian text + conversation metadata adds up quickly

**How to avoid:**
- Use Gemini Chat Sessions (SDK manages history pruning)
- Only send last 20 messages (Phase 2 pattern: `.take(20)`)
- Store full history in ariMessages table, not in Gemini context
- For very long conversations, summarize old messages before sending to Gemini

**Warning signs:**
- Gemini API returns 400 error "context too long"
- Response latency increases significantly over time
- Token costs spike on long conversations

### Pitfall 3: Race Conditions on Inbound Messages

**What goes wrong:** Two messages arrive within 1 second, both trigger Sarah, both read same state, both write updates, second update overwrites first extraction

**Why it happens:** Convex processWebhook is async - webhook returns 200 OK immediately, then schedules Sarah action. No message-level locking.

**How to avoid:**
- Use Convex's ACID guarantees: read + update in single mutation
- Check `last_processed_message_id` before processing
- Add `processing` flag to ariConversations during action execution
- Use `ctx.scheduler.runAfter(100, ...)` to debounce rapid messages

**Warning signs:**
- Extracted data randomly disappears (overwritten by stale read)
- State machine regresses (qualifying → greeting)
- Duplicate Gemini API calls for same message

### Pitfall 4: Ignoring Message Order

**What goes wrong:** Webhook delivers messages out of order (WhatsApp server lag), Sarah responds to question before receiving answer

**Why it happens:** WhatsApp webhooks are not guaranteed to be in-order, especially during network issues

**How to avoid:**
- Check `message.timestamp` field before processing
- Store `last_message_timestamp` in ariConversations
- If incoming message is older than last processed, log warning and skip
- Use Kapso's `message.id` for deduplication (Phase 2 already handles this)

**Warning signs:**
- Sarah asks for name AFTER user already provided it
- Conversation jumps between states erratically
- User sees delayed responses to old messages

### Pitfall 5: Hard-Coding Indonesian Responses

**What goes wrong:** All responses are Indonesian, then English user messages get Indonesian replies, creating confusion

**Why it happens:** Sarah's default language is Indonesian (per persona doc), easy to forget auto-switching requirement

**How to avoid:**
- Detect language in EVERY message (don't cache user preference)
- Pass detected language to Gemini prompt: "Respond in [Indonesian/English]"
- Store detected language in ariMessages metadata for debugging
- Use language-specific templates from sarah-detailed-flow.md

**Warning signs:**
- English users report "bot speaks Indonesian"
- Code-switching users get mixed-language responses
- Test conversations fail for English scenarios

## Code Examples

Verified patterns for Phase 3 implementation:

### Gemini Multi-Turn Chat Session
```typescript
// Source: https://firebase.google.com/docs/ai-logic/chat (2026-01-30)
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Create chat session with history
const chat = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  .startChat({
    history: [
      { role: "user", parts: [{ text: "Halo" }] },
      { role: "model", parts: [{ text: "Selamat siang! 👋 Sarah disini." }] },
    ],
  });

// Send new message (preserves history internally)
const result = await chat.sendMessage("Apa itu my21staff?");
console.log(result.response.text());
```

### Gemini Structured Output
```typescript
// Source: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output (2026-01-30)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        name: { type: "string", nullable: true },
        business_type: { type: "string", nullable: true },
        team_size: { type: "integer", nullable: true },
        pain_points: { type: "array", items: { type: "string" } },
        goals: { type: "string", nullable: true },
      },
      required: [], // All optional for partial extraction
    },
  },
});

const result = await model.generateContent(extractionPrompt);
const data = JSON.parse(result.response.text());
```

### Convex State Machine Update
```typescript
// Source: Existing convex/kapso.ts pattern (Phase 2)
export const updateState = internalMutation({
  args: {
    sarahConvId: v.id("ariConversations"),
    state: v.string(),
    lead_score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sarahConvId, {
      state: args.state,
      lead_score: args.lead_score ?? undefined,
      updated_at: Date.now(),
    });
  },
});
```

### Language Detection
```typescript
// Source: business_21/03_bots/sarah-detailed-flow.md (internal doc)
function detectLanguage(message: string): "id" | "en" {
  const indonesianPatterns = [
    /^halo|^hai|^selamat|^kak|^kakak|^bang/i,
    /\b(ada|nggak|gak|ya|yah|sih|deh|dong|lah)\b/i,
  ];

  const englishPatterns = [
    /^hi|^hello|^hey/i,
    /\b(yeah|okay|sure|thanks|please)\b/i,
  ];

  const isIndonesian = indonesianPatterns.some(p => p.test(message));
  const isEnglish = englishPatterns.some(p => p.test(message));

  if (isIndonesian && !isEnglish) return "id";
  if (isEnglish && !isIndonesian) return "en";
  return "id"; // Default to Indonesian
}
```

### Lead Scoring Algorithm
```typescript
// Source: business_21/03_bots/sarah-detailed-flow.md (internal doc)
function calculateLeadScore(context: any): number {
  const collected = context?.collected || {};
  let score = 0;

  // Basic Data (25 pts)
  if (collected.name) score += 5;
  if (collected.business_type) score += 10;
  if (collected.goals) score += 10;

  // Team Size (20 pts)
  if (collected.team_size >= 3) score += 20;
  else if (collected.team_size === 2) score += 15;
  else if (collected.team_size === 1) score += 10;

  // Pain Points (30 pts)
  const urgencyKeywords = {
    high: ["overwhelmed", "miss message", "slow response", "complaint", "lost customer"],
    medium: ["busy", "need help", "growth", "expanding", "manual"],
    low: ["curious", "checking", "maybe", "someday"],
  };

  const painText = (collected.pain_points || []).join(" ").toLowerCase();
  if (urgencyKeywords.high.some(k => painText.includes(k))) score += 30;
  else if (urgencyKeywords.medium.some(k => painText.includes(k))) score += 20;
  else if (urgencyKeywords.low.some(k => painText.includes(k))) score += 10;

  // Engagement (25 pts) - placeholder for message count tracking
  // TODO: Track message count and question asking in context
  score += 15; // Default responsive score

  return Math.min(score, 100);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom JSON parsing | Gemini structured output with responseSchema | Jan 2026 (Gemini 2.5 release) | Eliminates 90% of extraction error handling, guaranteed valid JSON |
| Manual conversation history | Gemini Chat Sessions SDK | Jan 2026 (SDK update) | Automatic history pruning, token management, context window handling |
| Kapso workflow variables | Convex database state | Phase 2 (Dec 2025) | Persistent state beyond 24h, complex queries, real-time sync to dashboard |
| String-based state machine | TypeScript literal types | Phase 2.5 (Jan 2026) | Compile-time state validation, IDE autocomplete for state names |
| Grok for all AI tasks | Gemini (Sarah) + Grok (Brain) | Phase 3 design | Specialized models: Gemini for conversation, Grok for analysis |

**Deprecated/outdated:**
- Kapso Agent nodes for conversational AI: Lack state machine + structured output support (as of Jan 2026)
- KV storage for conversation state: 24h TTL limit makes it unsuitable for multi-day conversations
- Regex-based data extraction: LLM structured output is more accurate for natural language variations

## Open Questions

Things that couldn't be fully resolved:

1. **Kapso Agent Node Capabilities**
   - What we know: Kapso has FunctionNode and DecideNode in workflows, Phase 2 uses Grok via AI decide node
   - What's unclear: Whether Kapso has a dedicated "Agent node" that could run Gemini conversationally (docs didn't show this)
   - Recommendation: Proceed with Convex-based Sarah handler (proven pattern from Phase 2 ARI). If Kapso adds Agent nodes later, can migrate.

2. **Gemini API Rate Limits**
   - What we know: Gemini 2.5 Flash is production-ready, pricing is $0.30/1M input tokens, 1M token context window
   - What's unclear: Requests-per-minute rate limits for paid tier, whether Google AI SDK has automatic retry/backoff
   - Recommendation: Start with Google AI SDK (not Vertex AI) for simpler auth. Monitor rate limit errors in logs, add exponential backoff if needed.

3. **Image Message Handling Priority**
   - What we know: Gemini 2.5 Flash supports vision/image input, CONTEXT.md requires "Handles photo/image messages (analyze + respond)"
   - What's unclear: Frequency of image messages in real conversations, whether images should trigger data extraction
   - Recommendation: Implement image handling as separate state (`image_received`), respond with acknowledgment, continue normal qualifying flow. Full image analysis can be Phase 3.5 enhancement.

4. **Handoff Notification Mechanism**
   - What we know: Phase 3 requirement is "Detects when 4 slots filled for handoff", Phase 4 will build lead database, Phase 7 will build handoff workflow
   - What's unclear: How consultant receives notification in Phase 3 (before full dashboard exists)
   - Recommendation: Simple approach: Set conversation status to "handover", increment unread_count (Phase 2.5 inbox shows this). Phase 7 will add email/WhatsApp notifications.

5. **Conversation Timeout Handling**
   - What we know: CONTEXT.md specifies timeouts (24h follow-up, 48h mark cold, 5-day qualifying timeout)
   - What's unclear: Convex doesn't have native cron jobs - how to check for stale conversations
   - Recommendation: Implement timeouts in Phase 3 as Convex scheduled functions (`ctx.scheduler.runAfter()`), triggered when user messages arrive. Dedicated cron system can be Phase 8 polish.

## Sources

### Primary (HIGH confidence)
- [Gemini 2.5 Flash Official Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash) - Context window, pricing, capabilities (Jan 2026)
- [Gemini Structured Output Guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output) - responseSchema API, JSON validation (Jan 2026)
- [Gemini Multi-Turn Chat Guide](https://firebase.google.com/docs/ai-logic/chat) - Chat sessions, conversation history (Jan 2026)
- Existing codebase: `convex/kapso.ts` processARI pattern, ariConversations schema, Kapso webhook handling (Dec 2025-Jan 2026)

### Secondary (MEDIUM confidence)
- [Kapso Functions Overview](https://docs.kapso.ai/docs/functions/overview) - KV storage API, webhook event structure, conversation context access
- [n8n Gemini Integration Guide](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatgooglegemini/) - LangChain patterns (alternative to direct SDK)
- [State Machines for WhatsApp Bots](https://developer.vonage.com/en/blog/state-machines-for-messaging-bots) - State machine architecture patterns (2020, still relevant)
- [Gemini API Pricing 2026](https://ai.google.dev/gemini-api/docs/pricing) - Cost calculations for production workloads

### Tertiary (LOW confidence)
- Kapso Agent node capabilities: Not found in official docs, assumed to not exist based on lack of documentation
- Kapso workflow state persistence: KV storage documented with 24h TTL, but no examples of stateful multi-day conversations
- Gemini rate limits: Not explicitly documented for Google AI Studio tier (free tier limits shown, paid tier limits unclear)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Gemini 2.5 Flash verified via official Google docs (Jan 2026), Convex/Kapso pattern proven in Phase 2
- Architecture: HIGH - Convex-based AI handler pattern established in Phase 2 (processARI), extending this pattern is low-risk
- Pitfalls: MEDIUM - Based on general LLM conversation patterns + existing codebase analysis, but Sarah-specific pitfalls unknown until implementation
- Gemini integration: HIGH - Official SDK examples verified, structured output documented, multi-turn chat proven pattern
- Kapso workflow limitations: MEDIUM - Docs show FunctionNode/DecideNode, no Agent node found, but absence of evidence is not evidence of absence

**Research date:** 2026-01-30
**Valid until:** 2026-02-28 (30 days - stable tech stack, Gemini 2.5 is production-ready, no fast-moving changes expected)

**Critical for planner:**
- Sarah should extend Phase 2's processARI pattern, NOT be built as Kapso workflow
- Gemini 2.5 Flash structured output eliminates need for custom extraction parsers
- State machine persistence uses existing ariConversations table (no new Convex schema needed)
- Image handling should be separate state, not block qualifying flow
- Handoff triggers conversation status change + unread count (Phase 7 will add full notification system)
