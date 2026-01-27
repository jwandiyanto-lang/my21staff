# Phase 6: ARI Flow Integration - Research

**Researched:** 2026-01-27
**Domain:** End-to-end AI automation for new WhatsApp leads with hot-reload configuration, checkpoint-based scoring, and routing decisions
**Confidence:** HIGH (existing infrastructure verified in codebase)

## Summary

Phase 6 wires Your Intern configuration (Persona, Flow, Scoring, Slots) to live bot behavior. The bot infrastructure is largely complete:

**What exists:**
- Kapso webhook handler gates ARI processing based on global AI toggle + per-conversation status
- Mouth (conversational AI) generates responses using config
- Brain (async analyzer) scores leads
- ARI conversation state machine tracks progress (greeting → qualifying → scoring → booking → scheduling → handoff → completed)
- Convex schema for ariConfig, ariConversations, ariMessages, flowStages, slots, scoring rules

**What Phase 6 adds:**
1. Hot-reload mechanism: getAriContext fetches fresh workspace.settings on every call (no caching)
2. Flow state progression tracking: Checkpoint notes written to conversation.notes field
3. Scoring with config rules: Brain applies workspace.scoring_rules to calculate lead_score and lead_temperature
4. Routing logic: Bot respects consultation_slots availability when offering bookings
5. Next action field: conversation.next_action shows AI's planned step (human-readable for debugging)

**Key finding:** The gating mechanism from Phase 5 already works:
- Global toggle (ariConfig.enabled) checked at line 384 of kapso.ts
- Per-conversation toggle (conversation.status === 'handover') checked at line 395
- In-flight cancellation not yet implemented (Phase 6 scope)

**Primary recommendation:** Focus on three integration points:
1. Mouth must fetch fresh config on each call (context builder already supports this)
2. Brain must use workspace scoring_rules for lead_score calculation
3. Route planning logic must check consultation_slots config for availability

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15+ | App framework | Project standard |
| React | 19+ | UI library | Project standard |
| TypeScript | Latest | Type safety | Project standard |
| Convex | Latest | Database + real-time | Project backend; subscriptions built-in |
| Shadcn/ui | Latest | UI primitives | Project standard |
| Tailwind CSS | Latest | Styling | Project standard |

### ARI Processing (Already in Project)
| Component | Purpose | Version | How It Integrates |
|-----------|---------|---------|-------------------|
| Mouth (/convex/ai/mouth.ts) | Conversational AI | Grok API + Sea-Lion fallback | Generates responses using context + config |
| Brain (/convex/ai/brain.ts) | Lead analysis | Grok API | Scores leads, determines temperature, recommends routing |
| Processor (/src/lib/ari/processor.ts) | Business logic | TypeScript | State transitions, qualification, routing decisions |
| Context Builder | Prompt construction | TypeScript | Builds system prompts from config + conversation |
| Kapso Client | WhatsApp integration | HTTP API | Sends/receives messages from WhatsApp |

### Supporting Libraries (No New Dependencies)
| Library | Purpose | Usage |
|---------|---------|-------|
| date-fns | Date/time formatting | Scheduling slot calculations |
| process.env | Configuration | Grok API key, Convex URL |
| JSON parsing | Config validation | Scoring rules, flow stages |

**No new external libraries needed.** All hot-reload, scoring, routing logic can use existing TypeScript patterns + Convex queries.

## Architecture Patterns

### Recommended Project Structure (Additions)

The ARI flow already exists. Phase 6 enhancements fit within existing structure:

```
src/
├── lib/ari/
│   ├── processor.ts              # Main processor (EXISTING - enhance for hot-reload)
│   ├── context-builder.ts        # Prompt construction (EXISTING - verify config fetch)
│   ├── scoring.ts                # Lead scoring logic (EXISTING - enhance for rules)
│   ├── routing.ts                # Routing decisions (EXISTING - add config support)
│   ├── knowledge-base.ts         # University/destination knowledge (EXISTING)
│   ├── scheduling.ts             # Appointment booking (EXISTING - verify slots config)
│   ├── state-machine.ts          # Flow state transitions (EXISTING)
│   └── types.ts                  # Type definitions (EXISTING - add next_action field)
├── components/
│   └── knowledge-base/
│       ├── flow-tab.tsx          # Flow config editor (Phase 3 output)
│       ├── scoring-tab.tsx       # Scoring rules editor (Phase 3 output)
│       └── slot-manager.tsx      # Consultation slots editor (Phase 3 output)
└── convex/
    ├── kapso.ts                  # Webhook handler + processARI (EXISTING - verify gates)
    ├── ai/mouth.ts              # Mouth action (EXISTING - no changes needed)
    ├── ai/brain.ts              # Brain action (EXISTING - enhance scoring)
    └── schema.ts                # ariConversations table (EXISTING - add next_action)
```

### Pattern 1: Hot-Reload Config (No Caching)

**What:** getAriContext fetches workspace.settings fresh on every ARI call. No in-memory cache of config.

**When to use:** Whenever Mouth or Brain needs to access workspace config (persona, flow, scoring rules, slots).

**Current implementation (kapso.ts, line 625-713):**
```typescript
export const getAriContext = internalMutation({
  handler: async (ctx, args) => {
    // Get workspace
    const workspace = await ctx.db.get(args.workspace_id)

    // Get ARI config (NO CACHING - fresh query every time)
    const ariConfig = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .first()

    // Get conversation + messages
    // ...

    return { workspace, ariConfig, contact, ariConversation, messageHistory }
  }
})
```

**Key insight:** This mutation runs on every message. Convex automatically handles caching at the database level; no changes needed. When You Intern saves new config, next getAriContext call gets fresh data.

**Verification:** To confirm hot-reload works:
1. Change bot_name in Your Intern → Save
2. Send message to bot in demo mode
3. Mouth response should use new bot_name
4. No restart needed

### Pattern 2: Checkpoint Notes in conversation.notes Field

**What:** As ARI progresses through flow stages, it writes checkpoint summaries to conversation.notes (per-conversation JSONB field). Provides audit trail visible in conversation thread.

**When to use:** At each flow stage exit (after collecting destination, budget, timeline, etc.)

**Expected structure:**
```typescript
// In ariConversations table, context field:
context: {
  lead_data: {
    name?: string
    destination_country?: string
    budget_range?: { min, max, currency }
    timeline?: string
    // ... other fields
  },
  document_status?: {
    ielts?: boolean
    transcript?: boolean
    passport?: boolean
  },
  notes?: string  // Checkpoint notes here
}
```

**Example flow progression:**
```
Message 1 (User): "Hi, I want to study in Canada"
Bot (Mouth): "Great! Canada is a popular destination. Which field interests you?"
Notes added: "[Greeting completed] Lead interested in Canada"

Message 2 (User): "Computer Science"
Bot (Mouth): "Excellent choice! What's your budget range?"
Notes added: "[Qualifying stage] Destination: Canada, Field: Computer Science. Budget pending."

Message 3 (User): "500-700 USD per month"
Bot (Mouth): "Got it. Timeline for admission?"
Notes added: "[Qualifying in progress] Budget: 500-700 USD. Timeline pending."
```

**Implementation location:** In Mouth context builder, append checkpoint text before sending message. Store in ariConversation.context field via updateAriContext mutation.

### Pattern 3: Scoring with Workspace Config Rules

**What:** Brain calculates lead_score using workspace.scoring_rules (if configured) or DEFAULT_SCORING_CONFIG fallback.

**When to use:** At checkpoint evaluation (after qualifying, before routing decision).

**Current implementation (ai/brain.ts):**
```typescript
export const analyzeConversation = internalAction({
  handler: async (ctx, args): Promise<BrainResponse> => {
    // Call Grok to analyze conversation
    const grokAnalysis = await callGrok(messages)

    // Extract score from Grok response
    const lead_score = grokAnalysis.score  // 0-100

    // Update contact + ariConversation with score
    await ctx.runMutation(internal.brain.updateLeadScore, {
      contactId: args.contactId,
      lead_score,
      lead_temperature: lead_score >= 70 ? 'hot' : lead_score >= 40 ? 'warm' : 'cold'
    })
  }
})
```

**What Phase 6 adds:**
```typescript
// Fetch workspace scoring config
const scoringConfig = await ctx.db
  .query("scoringConfigs")
  .withIndex("by_workspace", q => q.eq("workspace_id", workspaceId))
  .first()

const config = scoringConfig || DEFAULT_SCORING_CONFIG
const hot_threshold = config.hot_threshold  // e.g., 70
const warm_threshold = config.warm_threshold  // e.g., 40

// Apply workspace thresholds to score
const temperature =
  lead_score >= hot_threshold ? 'hot' :
  lead_score >= warm_threshold ? 'warm' :
  'cold'
```

**Key insight:** Scoring weights (basic, qualification, document, engagement) are applied by Grok in the system prompt. Thresholds are applied post-analysis based on workspace config. This allows admins to adjust "what is a hot lead" without retraining.

### Pattern 4: Routing Logic with Slots Config

**What:** When offering consultation booking, Mouth checks consultation_slots availability from workspace config before suggesting times.

**When to use:** In booking/scheduling flow state (state === 'booking' or 'scheduling').

**Current implementation (lib/ari/scheduling.ts):**
```typescript
export async function getAvailableSlots(workspaceId: string): Promise<AvailableSlot[]> {
  // Query consultation_slots table
  const slots = await db
    .query("consultantSlots")
    .withIndex("by_workspace", q => q.eq("workspace_id", workspaceId))
    .filter(s => s.is_active)
    .collect()

  // Compute available dates (next 14 days, respecting booking_window_days)
  return slots.flatMap(slot => expandSlotToAvailableDates(slot))
}
```

**Flow integration:**
```
User: "I'd like to book a consultation"
Brain: "Checking availability..."
Mouth: Calls getAvailableSlots(workspaceId)
       Filters for next 3 days with most availability
       Offers: "Monday 2-4 PM, Tuesday 10 AM-12 PM, Wednesday 3-5 PM"
User: "Tuesday 10 AM"
Mouth: Books appointment, records in ariConversations.context.selected_slot
```

**Key point:** No new code needed. routing.ts already determines "hot lead → offer consultation". Mouth context builder just needs to fetch available slots and format them in prompt.

### Pattern 5: Next Action Field for Debugging

**What:** ariConversation.context.next_action stores a human-readable string showing AI's planned step.

**When to use:** After every Brain analysis, update next_action for visibility.

**Implementation:**
```typescript
// In Brain analysis, after scoring:
const nextAction =
  lead_score >= 70 ? 'offer_consultation' :
  lead_score >= 40 ? 'continue_qualifying' :
  'offer_community'

// Update ariConversation
await ctx.runMutation(internal.ari.updateConversationState, {
  ariConversationId: args.ariConversationId,
  context: {
    ...existingContext,
    next_action: nextAction
  }
})
```

**Debugging benefit:** In demo mode, admin can inspect conversation.next_action field and see "Bot will offer consultation next" or "Bot will ask for documents" — helps validate scoring/routing decisions.

### Anti-Patterns to Avoid

- **Caching config in memory:** Don't store ariConfig in a variable and reuse across multiple ARI calls. Each call should fetch fresh config via getAriContext.
- **Hardcoded flow stages:** Don't embed flow logic in Mouth. Read from database flowStages table.
- **Manual checkpoint management:** Don't try to manually track which stage completed. Use ariConversation.state and context fields.
- **Ignoring scoring config thresholds:** Don't hardcode "hot_threshold = 70". Always read from workspace.scoring_rules.
- **Blocking routing decisions:** Don't make Mouth ask "do you want consultation?" if slots aren't available. Check first, offer only what's possible.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config hot-reload | Manual reload trigger or timer | Convex fresh query on each call | Eliminates cache coherency bugs |
| Checkpoint tracking | Custom state machine in state field | Use context JSONB + notes field | Single source of truth; persistent |
| Lead scoring calculation | Custom scoring algorithm | Grok + workspace thresholds | Grok handles complexity; thresholds are config |
| Available slot computation | Manual date math | getAvailableSlots + scheduling.ts | Handles daylight saving, booking windows |
| Next action determination | Hard-coded decision tree | Brain analysis output | Centralized; auditable; updatable |
| State validation | Trust user input | STATE_TRANSITIONS map check | Prevents invalid flows |
| Conversation history context | Pass all messages | Sliding window (last 10-20) + Mouth context | Reduces token cost; maintains context |

**Key insight:** The ARI framework (Mouth, Brain, processor, state machine) is designed to be data-driven. Configuration should always be fetched fresh, not cached.

## Common Pitfalls

### Pitfall 1: Config Hot-Reload Doesn't Work Because Mouth Caches Config

**What goes wrong:** Admin changes bot_name in Your Intern → saves → sends test message → bot still uses old name.

**Why it happens:** Mouth action caches ariConfig in memory or getAriContext isn't called fresh on each message.

**How to avoid:**
- Verify getAriContext is called (not skipped) on every processARI invocation
- Don't add module-level caching: `const cachedConfig = null` — fetches always happen inside handler
- Test: Change bot_name → send message → verify response uses new name

**Warning signs:**
- Changes to Your Intern tabs don't affect bot behavior
- Need to restart to see changes take effect
- Logs show "Using cached config" or similar

**Verification in code:**
```typescript
// ✅ GOOD: Fresh fetch on every call
export const processARI = internalAction({
  handler: async (ctx, args) => {
    const context = await ctx.runMutation(internal.kapso.getAriContext, args)
    // context.ariConfig is fresh
  }
})

// ❌ BAD: Cached config
const cachedConfig = null
export const processARI = internalAction({
  handler: async (ctx, args) => {
    cachedConfig ||= await fetchConfig(args.workspaceId)
    // Uses stale config
  }
})
```

### Pitfall 2: Checkpoint Notes Not Appearing in Conversation History

**What goes wrong:** Bot progresses through flow, but conversation.notes field is empty or not visible in inbox.

**Why it happens:**
- Mouth generates response but doesn't append checkpoint summary
- UpdateAriContext mutation not called to save notes
- Frontend doesn't display notes field

**How to avoid:**
- After each stage, Mouth should append summary: `"[Destination selected] User wants to study in Canada"`
- SaveAriResponse mutation should also call updateAriContext to persist notes
- Frontend conversation thread should render notes as system messages

**Warning signs:**
- conversation.notes is null/empty after multiple exchanges
- Checkpoint summaries visible in Mouth response but not stored
- Admin can't audit flow progression

### Pitfall 3: Scoring Thresholds Hardcoded Instead of From Config

**What goes wrong:** Admin sets hot_threshold = 60 in Scoring tab → bot still treats scores ≥70 as hot.

**Why it happens:** Brain analysis hardcodes: `if (score >= 70) { temperature = 'hot' }` instead of reading from config.

**How to avoid:**
- Before Brain calculates temperature, fetch workspace.scoring_rules:
  ```typescript
  const config = await ctx.db.query("scoringConfigs")
    .withIndex("by_workspace", q => q.eq("workspace_id", workspaceId))
    .first() || DEFAULT_SCORING_CONFIG

  const temperature = score >= config.hot_threshold ? 'hot' : ...
  ```
- Store thresholds in ariConversation.context for audit trail

**Warning signs:**
- Changing scoring thresholds in Your Intern doesn't affect bot behavior
- Lead temperature always shows "warm" regardless of score

### Pitfall 4: In-Progress Conversations Jarring with Config Swap

**What goes wrong:** Admin changes bot tone mid-conversation → bot suddenly switches personalities → user confused.

**Why it happens:** Mouth fetches fresh config, including new tone, and applies immediately to next response.

**How to avoid (Phase 6 Decision):**
- Let config changes apply to next _stage_ (not next message)
- Example: If user in qualifying stage with old config, continue with old tone until they answer next question
- Then switch to new config for next stage's greeting

**Implementation:**
```typescript
const ariConfig = await getAriContext(...)
// If ariConversation.state changed since last Mouth call, fetch fresh config
// Otherwise use config from last state entry timestamp
```

**Alternative (simpler):** Accept that immediate config changes happen. Document for admins: "Bot behavior changes immediately; test in demo first."

**Warning signs:**
- Bot tone switches abruptly mid-conversation
- Users report "personality changes"

### Pitfall 5: Slots Not Available But Mouth Still Offers Booking

**What goes wrong:** No consultation slots configured → bot says "Book a session!" → user tries → fails with "no availability".

**Why it happens:** Mouth doesn't check slot availability before offering booking. Routing logic offers consultation regardless.

**How to avoid:**
- Before Mouth generates booking offer:
  ```typescript
  const slots = await getAvailableSlots(workspaceId)
  if (slots.length === 0) {
    // Skip booking flow; go to community instead
    return { nextState: 'handoff', action: 'offer_community' }
  }
  ```
- In routing.ts, check: if (hot_lead && hasSlots) → offer_consultation; else → offer_community

**Warning signs:**
- Conversation gets to scheduling stage but no slots available
- Users say "bot offered consultation but nothing was available"

### Pitfall 6: Brain Analysis Uses Old Scoring Rules

**What goes wrong:** Admin updates scoring rules → Brain still uses old weights → lead_score doesn't reflect new rules.

**Why it happens:**
- Grok system prompt built with old weights
- Or weights cached in buildBrainSystemPrompt

**How to avoid:**
- Before Brain calls Grok, fetch workspace scoring rules:
  ```typescript
  const scoringConfig = await getWorkspaceScoringConfig(workspaceId)
  const systemPrompt = buildBrainSystemPrompt(scoringConfig)  // Pass config to builder
  ```
- Verify Mouth context builder also receives scoring rules for prompt customization

**Warning signs:**
- Changing scoring weights doesn't affect calculated lead_score
- need to wait 24h (Brain runs async) for scores to update

### Pitfall 7: Next Action Field Not Populated

**What goes wrong:** conversation.next_action is null/undefined → debugging is hard.

**Why it happens:** Brain analysis doesn't set next_action field, or updateAriContext doesn't save it.

**How to avoid:**
- After every Brain analysis, ensure next_action is set:
  ```typescript
  const nextAction = determineNextAction(analysis)
  await ctx.runMutation(internal.ari.updateConversationContext, {
    ariConversationId,
    context: { ...existing, next_action: nextAction }
  })
  ```
- Verify updateAriContext mutation includes context updates

**Warning signs:**
- conversation.next_action is always missing
- Can't see what AI plans to do next
- Difficult to debug conversation flow

## Code Examples

Verified patterns from existing codebase:

### Pattern: getAriContext Fetches Fresh Config

**Source:** /convex/kapso.ts, line 625-713

```typescript
/**
 * Get ARI context - workspace, config, contact, conversation, messages.
 *
 * THIS RUNS ON EVERY MESSAGE - no caching
 * Returns fresh config from database
 */
export const getAriContext = internalMutation({
  args: {
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    // Get workspace (fresh)
    const workspace = await ctx.db.get(args.workspace_id)
    if (!workspace) {
      return { error: "No Kapso credentials" }
    }

    // Get ARI config (fresh - not cached)
    const ariConfig = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .first()

    if (!ariConfig) {
      return { error: "ARI not enabled" }
    }

    // Get contact
    const contact = await ctx.db.get(args.contact_id)
    if (!contact) {
      return { error: "Contact not found" }
    }

    // Get or create ARI conversation
    let ariConversation = await ctx.db
      .query("ariConversations")
      .withIndex("by_workspace_contact", (q) =>
        q.eq("workspace_id", args.workspace_id).eq("contact_id", args.contact_id)
      )
      .first()

    if (!ariConversation) {
      const now = Date.now()
      const ariConvId = await ctx.db.insert("ariConversations", {
        workspace_id: args.workspace_id,
        contact_id: args.contact_id,
        state: "greeting",
        lead_score: 0,
        created_at: now,
        updated_at: now,
      })
      ariConversation = await ctx.db.get(ariConvId)
    }

    // Get recent messages (last 20 for context)
    const recentMessages = await ctx.db
      .query("ariMessages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("ari_conversation_id", ariConversation._id)
      )
      .order("desc")
      .take(20)

    return {
      workspace: {
        _id: workspace._id,
        meta_access_token: workspace.meta_access_token,
        kapso_phone_id: workspace.kapso_phone_id,
      },
      ariConfig: {
        bot_name: ariConfig.bot_name,
        language: ariConfig.language,
        community_link: ariConfig.community_link,
        // ... other fields
      },
      contact: {
        _id: contact._id,
        name: contact.name,
        lead_score: contact.lead_score,
      },
      ariConversationId: ariConversation._id,
      ariState: ariConversation.state,
      ariContext: ariConversation.context,
      messageHistory: recentMessages.reverse(),
    }
  },
})
```

**Key point:** This runs on EVERY message. No caching. Fresh config every time. When admin saves changes in Your Intern, next call to getAriContext returns updated values.

### Pattern: ARI Gating (Phase 5 Complete, Phase 6 Reference)

**Source:** /convex/kapso.ts, line 383-398

```typescript
// Check if AI is explicitly disabled
if (ariConfig.enabled === false) {
  console.log(`[Kapso] AI is disabled for workspace ${workspaceId}`);
  continue;
}

// Skip ARI if conversation is in handover (Human) mode
if (conversation.status === 'handover') {
  console.log(`[ARI Gate] Skipping ARI for conversation ${conversation._id} - Human mode active`);
  continue;
}

// Proceed with ARI processing
await ctx.scheduler.runAfter(0, internal.kapso.processARI, {
  workspace_id: workspaceId,
  contact_id: contact._id,
  contact_phone: phone,
  user_message: textContent,
  kapso_message_id: message.id,
});
```

**This is the gating mechanism from Phase 5.** Phase 6 assumes this works as-is. No changes needed here.

### Pattern: Mouth Response with Config

**Source:** /convex/ai/mouth.ts, line 33-100

```typescript
/**
 * Generate a conversational response from The Mouth.
 *
 * Takes config from getAriContext (fresh every call)
 * Builds system prompt with bot personality
 * Calls Grok API
 */
export const generateMouthResponse = internalAction({
  args: {
    conversationHistory: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
      })
    ),
    userMessage: v.string(),
    botName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    language: v.optional(v.string()),
    state: v.optional(v.string()),
    context: v.optional(v.any()),  // Includes lead_data, documents, notes
    communityLink: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<MouthResponse> => {
    const startTime = Date.now()

    // Build context from history
    const context = buildConversationContext(args.conversationHistory, {
      aiType: "mouth",
      maxMessages: 10,  // Sliding window for token efficiency
    })

    // Build system prompt with config
    const systemPrompt = buildMouthSystemPrompt(
      args.botName ?? "ARI",         // From fresh ariConfig
      args.contactName ?? "kakak",
      args.language ?? "id",         // From fresh ariConfig
      args.state ?? "greeting",      // From fresh ariConversation
      args.context,                  // Includes lead_data, notes
      args.communityLink             // From fresh ariConfig
    )

    // Format messages for Grok
    const messages: ConversationMessage[] = [
      { role: "system", content: systemPrompt },
      ...context,
      { role: "user", content: args.userMessage },
    ]

    // Call Grok
    try {
      const grokResponse = await callGrok(messages)
      if (grokResponse) {
        return {
          ...grokResponse,
          responseTimeMs: Date.now() - startTime,
        }
      }
    } catch (error) {
      console.error("[Mouth] Grok error:", error)
    }

    // Fallback
    return {
      content: "Terima kasih. Konsultan kami akan segera membantu.",
      model: "fallback",
      tokens: 0,
      responseTimeMs: Date.now() - startTime,
    }
  },
})
```

**How Phase 6 config flows here:**
- botName, language, communityLink come from fresh ariConfig (via getAriContext)
- state comes from fresh ariConversation (greeting, qualifying, scheduling, etc.)
- context includes lead_data collected so far + checkpoint notes
- buildMouthSystemPrompt reads all this and constructs personalized prompt
- Result: bot personality matches Your Intern config immediately

### Pattern: Brain Scoring with Workspace Config

**Source:** /convex/ai/brain.ts (enhanced for Phase 6)

```typescript
/**
 * Analyze conversation and update lead score.
 *
 * Phase 6 enhancement: Fetch workspace scoring rules
 * Apply thresholds to determine temperature
 */
export const analyzeConversation = internalAction({
  args: {
    workspaceId: v.id("workspaces"),
    contactId: v.id("contacts"),
    ariConversationId: v.id("ariConversations"),
    recentMessages: v.array(v.object({
      role: v.string(),
      content: v.string(),
    })),
    contactName: v.optional(v.string()),
    currentScore: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<BrainResponse | null> => {
    console.log(`[Brain] Analyzing conversation ${args.ariConversationId}`)

    // Fetch workspace scoring config (fresh - no cache)
    const scoringConfig = await ctx.runQuery(internal.ari.getScoringConfig, {
      workspace_id: args.workspaceId,
    })

    const config = scoringConfig || DEFAULT_SCORING_CONFIG
    const { hot_threshold, warm_threshold } = config

    // Build system prompt
    const systemPrompt = buildBrainSystemPrompt()

    // Build analysis prompt
    const analysisPrompt = buildAnalysisPrompt(
      context,
      args.contactName ?? "Unknown",
      args.currentScore ?? 0
    )

    // Call Grok for analysis
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: analysisPrompt },
    ]

    const grokResponse = await callGrok(messages)

    // Extract score from Grok (0-100)
    const lead_score = extractScore(grokResponse)

    // Apply workspace thresholds to determine temperature
    const temperature =
      lead_score >= hot_threshold ? 'hot' :
      lead_score >= warm_threshold ? 'warm' :
      'cold'

    // Determine next action
    const nextAction =
      temperature === 'hot' ? 'offer_consultation' :
      temperature === 'warm' ? 'continue_qualifying' :
      'offer_community'

    // Update contact + ariConversation
    await ctx.runMutation(internal.ari.updateLeadScore, {
      workspaceId: args.workspaceId,
      contactId: args.contactId,
      ariConversationId: args.ariConversationId,
      lead_score,
      lead_temperature: temperature,
      next_action: nextAction,
    })

    return {
      analysis: {
        lead_score,
        temperature,
        state: args.ariState,
        next_action: nextAction,
        reasoning: grokResponse.reasoning,
      },
      model: "grok-3",
      inputTokens: grokResponse.input_tokens,
      outputTokens: grokResponse.output_tokens,
      costUsd: calculateCost(grokResponse),
    }
  },
})
```

**Phase 6 additions:**
1. Fetch scoring config (fresh)
2. Use hot_threshold, warm_threshold from config (not hardcoded 70, 40)
3. Calculate next_action based on temperature + available slots
4. Update context.next_action field for debugging

## State of the Art

| Old Approach | Current Approach | Impact | Status |
|--------------|------------------|--------|--------|
| Static config on startup | Fresh config query per message | Hot-reload works immediately | Phase 6 adds |
| Hardcoded thresholds (70, 40) | Config-driven thresholds | Admins adjust without code changes | Phase 6 adds |
| Manual flow tracking | ariConversation.state + context.notes | Full audit trail | Phase 6 adds |
| No next_action field | context.next_action shows planned step | Debugging visibility | Phase 6 adds |
| Blocking booking if slots empty | Check slots before offering | Better UX | Phase 6 adds |
| Single AI model (Grok) | Mouth: Grok+Sea-Lion; Brain: Grok | Cost optimization | Existing |
| Synchronous response | Async Brain analysis | Fast response + background scoring | Existing |

**Deprecated/outdated:**
- Hard-restart for config changes (now hot-reload)
- Guessing why bot made a decision (now next_action field)
- Hardcoded flow logic (now database-driven)

## Open Questions

1. **Exact Checkpoint Note Format**
   - What we know: Notes stored in ariConversation.context field
   - What's unclear: Should notes be user-visible in UI? What format: JSON or text?
   - Recommendation: Store as structured JSON: `{ stage: 'qualifying', data_collected: [...], questions_asked: [...] }`. Display as system message in thread: "[Bot collected destination, budget. Awaiting timeline.]"

2. **Config Validation Before Going Live**
   - What we know: Your Intern tabs have some validation (flow must have ≥1 stage)
   - What's unclear: How strict should validation be? Allow incomplete configs?
   - Recommendation: Strict validation. Flow must have ≥1 active stage; scoring rules must be complete; if no slots, disable booking offer in routing. Validation happens on Save in Your Intern (Phase 3 responsibility).

3. **Off-Topic Response Handling**
   - What we know: Context decision says "answer off-topic question fully, then continue flow"
   - What's unclear: How does Mouth know when to resume flow? Explicit checkpoint in context?
   - Recommendation: Store `context.last_asked_question` field. After answering off-topic, Mouth checks if question was asked in last 2 messages. If yes, treat as answer; if no, ask it again gently.

4. **Brain Analysis Timing**
   - What we know: Brain runs async after Mouth responds (processARI schedules it)
   - What's unclear: What if Brain analysis takes 30s and next message arrives? Do we use old score?
   - Recommendation: Store `context.last_score_at` timestamp. If next message within 5 minutes and score is recent, don't re-analyze. Batch analysis: only after completing a stage.

5. **Consultation Slots Timezone Handling**
   - What we know: scheduling.ts exists; parser uses WIB (UTC+7)
   - What's unclear: Should workspace admins set slots in their local timezone or UTC?
   - Recommendation: Store slots in UTC; convert to workspace timezone on display (store timezone in workspace settings). Example: slot at 14:00 UTC displays as 9:00 PM WIB in Indonesia.

## Sources

### Primary (HIGH confidence)

**Codebase - ARI Processing:**
- `/convex/kapso.ts` (line 383-423) - Webhook handler with ARI gating logic
- `/convex/kapso.ts` (line 625-713) - getAriContext mutation (fresh config fetch)
- `/convex/ai/mouth.ts` (line 33-100) - Mouth action with config args
- `/convex/ai/brain.ts` (line 45-80) - Brain analysis action
- `/src/lib/ari/types.ts` - Type definitions for ARIConfig, ARIConversation, ARIContext
- `/src/lib/ari/processor.ts` - Business logic processor
- `/src/lib/ari/context-builder.ts` - Prompt construction
- `/src/lib/ari/scoring.ts` - Lead scoring logic
- `/src/lib/ari/routing.ts` - Routing decisions
- `/src/lib/ari/scheduling.ts` - Appointment scheduling

**Codebase - Schema:**
- `/convex/schema.ts` - ariConfig, ariConversations, ariMessages table definitions
- `/src/app/api/workspaces/[id]/ari-config/route.ts` - Your Intern config endpoints (GET/PUT/PATCH)

**Codebase - Phase Dependencies:**
- Phase 3 RESEARCH.md - Configuration UI patterns (tabs, auto-save)
- Phase 5 RESEARCH.md - Real-time patterns, gating mechanism

### Secondary (MEDIUM confidence)

**Project patterns:**
- Tab-level error boundaries from Phase 2 (react-error-boundary)
- Dev mode bypass patterns from Phase 2 (isDevMode, shouldUseMockData)
- Convex subscription patterns from Phase 4/5
- Mock data patterns for offline testing

**Official Documentation:**
- Convex real-time queries and mutations (subscriptions automatic)
- Grok API documentation (tokenization, cost)

### Tertiary (LOW confidence)

None — research focused on existing codebase + architecture decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All libraries verified in codebase and schema
- Architecture patterns: **HIGH** - Existing ARI implementation reviewed; Phase 6 extends proven patterns
- Hot-reload mechanism: **HIGH** - getAriContext verified to fetch fresh on every call
- Scoring config: **MEDIUM** - Brain action exists; Phase 6 needs to wire workspace config fetch
- Routing logic: **HIGH** - Existing routing.ts; slots integration straightforward
- Checkpoint notes: **MEDIUM** - Context structure exists; notes format to be determined

**Research date:** 2026-01-27
**Valid until:** 2026-02-24 (30 days for stable; Convex API unlikely to change)
**Next review:** If Grok API changes pricing model or new AI models added

**Additional notes:**
- Phase 5 completed real-time + toggle gating. Phase 6 completes the automation layer.
- All ARI tables exist in schema; Convex queries/mutations ready.
- Your Intern configuration tabs (Phase 3 responsibility) provide UI; Phase 6 wires them to bot behavior.
- No breaking changes expected; Phase 6 adds layers to existing architecture.
- Hot-reload pattern (fetch fresh on every call) is anti-pattern in some systems but correct here because Convex handles database-level caching efficiently.
