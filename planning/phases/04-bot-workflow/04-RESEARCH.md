# Phase 4: Bot Workflow - Research

**Researched:** 2026-01-25
**Domain:** WhatsApp chatbot qualification workflow, conversation state management
**Confidence:** HIGH

## Summary

Phase 4 builds on the verified dual-AI system (Mouth + Brain) to implement Eagle's specific qualification workflow. The existing `processARI` flow already handles message reception, AI response generation, and lead scoring. What's missing is structured conversation flow logic that guides leads through greeting -> qualification -> routing to Community or Consultation.

The key insight is that **conversation state should be managed through prompt engineering and the ariConversations.context field**, not a separate state machine library. The Brain already analyzes conversations and determines `state` and `next_action` - we need to make the Mouth act on these decisions.

**Primary recommendation:** Enhance `buildMouthSystemPrompt` in `convex/ai/context.ts` to include conversation state, collected data, and explicit instructions for the current flow phase.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Place)
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| Grok-3 API | convex/ai/mouth.ts | Conversational responses | Working |
| Grok-3 API | convex/ai/brain.ts | Lead analysis & scoring | Working |
| ariConversations | convex/schema.ts | State + context storage | Working |
| ariMessages | convex/schema.ts | Conversation history | Working |
| processARI | convex/kapso.ts | Orchestration flow | Working |

### Supporting (Needs Enhancement)
| Component | Location | Purpose | Enhancement Needed |
|-----------|----------|---------|-------------------|
| buildMouthSystemPrompt | convex/ai/context.ts | System prompt builder | Add state-aware prompts |
| ariConversations.context | convex/schema.ts | Form answers, doc status | Define structure |
| ariConfig | convex/schema.ts | Community link storage | Already has community_link |

### No New Libraries Needed
The existing stack handles all requirements:
- State tracking: ariConversations.state + context field
- Flow logic: Brain's next_action determines routing
- Notification: Convex scheduler for human alerts
- FAQ: Prompt engineering with Eagle knowledge

## Architecture Patterns

### Pattern 1: Prompt-Driven Conversation Flow

**What:** Encode conversation state and instructions directly in the system prompt
**When to use:** When using powerful LLMs that can follow complex instructions
**Source:** Existing implementation in eagle-ari-journey.md

```typescript
// convex/ai/context.ts
export function buildMouthSystemPrompt(
  botName: string,
  contactName: string,
  language: string,
  state: string,           // NEW: "greeting" | "qualifying" | "routing"
  context: QualificationContext,  // NEW: collected data
  ariConfig: AriConfig     // NEW: workspace config
): string {
  const isIndonesian = language === "id";

  // State-specific instructions
  let stateInstructions = "";
  switch (state) {
    case "greeting":
      stateInstructions = buildGreetingInstructions(isIndonesian);
      break;
    case "qualifying":
      stateInstructions = buildQualifyingInstructions(context, isIndonesian);
      break;
    case "routing":
      stateInstructions = buildRoutingInstructions(ariConfig, isIndonesian);
      break;
  }

  return `${basePersona}

## CURRENT STATE: ${state}
${stateInstructions}

## COLLECTED DATA
${formatCollectedData(context)}

## RULES
- Ask ONE question per message
- Keep responses to 1-2 sentences
- NO emojis
- Mirror the customer's language (ID/EN)`;
}
```

### Pattern 2: Context Field Structure

**What:** Define explicit schema for ariConversations.context
**When to use:** When tracking qualification progress across messages

```typescript
// Type definition (not runtime schema - context is v.any())
interface QualificationContext {
  // Phase 1: Basic info
  collected: {
    full_name?: string;
    email?: string;
    destination_country?: string;  // Australia, Canada, UK, USA
    education_level?: string;      // SMA, S1, S2
    current_activity?: string;     // Kerja, Kuliah, Gap Year
    reason?: string;
    budget?: string;
  };
  // Phase 2: Documents
  documents: {
    passport?: boolean | null;     // true/false/null (not asked)
    cv?: boolean | null;
    english_test?: boolean | null;
    english_score?: number | null; // IELTS score if available
    transcript?: boolean | null;
  };
  // Routing decision
  routing?: {
    offered_at?: number;
    choice?: "community" | "consultation" | null;
    community_link_sent?: boolean;
    consultation_requested_at?: number;
  };
}
```

### Pattern 3: Brain-Driven State Transitions

**What:** Let the Brain analyze and transition states; Mouth just follows
**When to use:** This is the existing architecture - enhance it

```typescript
// convex/ai/brain.ts - already returns:
interface BrainAnalysis {
  lead_score: number;
  temperature: "hot" | "warm" | "cold";
  state: "greeting" | "qualifying" | "scheduling" | "handoff";
  next_action: "continue_bot" | "offer_consultation" | "offer_community" | "handoff_human";
  reasoning: string;
}

// Enhancement: Make processARI check next_action and trigger routing
if (brainAnalysis.next_action === "offer_community") {
  // Next Mouth response should include community link
}
if (brainAnalysis.next_action === "offer_consultation") {
  // Next Mouth response should offer consultation
}
if (brainAnalysis.next_action === "handoff_human") {
  // Trigger human notification
}
```

### Anti-Patterns to Avoid

- **External state machine library:** Overkill - LLM prompts handle flow naturally
- **Rigid decision trees:** Too brittle - let AI interpret context
- **Separate FAQ database:** Use ariDestinations + prompt engineering instead
- **Complex handoff protocols:** Simple scheduler.runAfter for notifications

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conversation state | Custom FSM library | ariConversations.state + Brain | Already designed for this |
| Flow transitions | Hardcoded rules | Brain's next_action analysis | AI understands context better |
| Document extraction | Regex parsing | Brain analysis with JSON output | LLM handles natural language |
| Time-based greeting | Custom logic | Already in mouth.ts | Time zones handled |
| Human notification | Custom notification system | Convex scheduler.runAfter | Built-in, reliable |

**Key insight:** The existing Mouth+Brain architecture handles flow naturally. Enhancement, not replacement.

## Common Pitfalls

### Pitfall 1: Over-Engineering State Machine

**What goes wrong:** Building a complex FSM with many states and transitions
**Why it happens:** Traditional chatbot thinking
**How to avoid:** Let the LLM handle flow through prompt context
**Warning signs:** Creating more than 4-5 states

### Pitfall 2: Asking Multiple Questions

**What goes wrong:** Bot asks "What's your name, destination, and budget?"
**Why it happens:** Efficiency thinking
**How to avoid:** Enforce "ONE question per message" in prompt
**Warning signs:** User confusion, incomplete answers

### Pitfall 3: Ignoring Brain Analysis

**What goes wrong:** Bot doesn't act on Brain's next_action recommendation
**Why it happens:** Brain runs async, results not used
**How to avoid:** Check Brain's last analysis before Mouth generates response
**Warning signs:** Hot leads not offered consultation

### Pitfall 4: Missing Handoff Notification

**What goes wrong:** User requests consultation, human never notified
**Why it happens:** No notification mechanism implemented
**How to avoid:** Trigger notification immediately when consultation requested
**Warning signs:** Users waiting, no follow-up

### Pitfall 5: Context Field Overflow

**What goes wrong:** Context field grows unbounded with conversation history
**Why it happens:** Storing too much in context
**How to avoid:** Only store structured qualification data, not messages
**Warning signs:** Database performance issues

## Code Examples

### Enhanced System Prompt with State

```typescript
// convex/ai/context.ts
function buildGreetingInstructions(isIndonesian: boolean): string {
  if (isIndonesian) {
    return `TUGAS SAAT INI: Sapa dan kenalan
- Sapa dengan ramah sesuai waktu (pagi/siang/sore/malam)
- Tanya nama lengkap kalau belum tau
- Tanya negara tujuan kuliah
- JANGAN tanya semua sekaligus, satu per satu

CONTOH:
"siang kak! mau kuliah di luar negeri ya? boleh tau namanya siapa?"
"oke kak [nama]! negara tujuannya kemana nih?"`;
  }
  return `CURRENT TASK: Greet and get to know
- Greet warmly based on time of day
- Ask for full name if unknown
- Ask for destination country
- Ask ONE thing at a time`;
}

function buildQualifyingInstructions(
  context: QualificationContext,
  isIndonesian: boolean
): string {
  const docs = context.documents || {};
  const nextDoc = !docs.passport ? "passport" :
                  !docs.cv ? "CV" :
                  !docs.english_test ? "IELTS/TOEFL" :
                  !docs.transcript ? "ijazah/transkrip" : null;

  if (isIndonesian) {
    return `TUGAS SAAT INI: Kumpulkan info dokumen
${nextDoc ? `- Tanya tentang ${nextDoc}: "Oh iya kak, ${nextDoc}nya udah punya belum?"` : "- Semua dokumen sudah ditanya"}
- Kalau belum punya, bilang gpp bisa dibantu nanti
- Kalau sudah lengkap, tawarkan next step`;
  }
  return `CURRENT TASK: Collect document info
${nextDoc ? `- Ask about ${nextDoc}` : "- All documents asked"}`;
}

function buildRoutingInstructions(
  ariConfig: { community_link?: string },
  isIndonesian: boolean
): string {
  if (isIndonesian) {
    return `TUGAS SAAT INI: Tawarkan pilihan next step
- PILIHAN 1: Konsultasi 1-on-1 (berbayar, langsung dengan konsultan)
- PILIHAN 2: Gabung komunitas (gratis, update harian)
${ariConfig.community_link ? `- Link komunitas: ${ariConfig.community_link}` : ""}

CONTOH:
"oke kak jadi untuk next step, mau langsung konsultasi 1-on-1 atau gabung komunitas dulu? di komunitas ada update tiap hari soal beasiswa dan tips kuliah luar negeri"`;
  }
  return `CURRENT TASK: Offer next steps
- Option 1: 1-on-1 consultation (paid)
- Option 2: Join community (free)`;
}
```

### Human Notification on Consultation Request

```typescript
// convex/kapso.ts - add after Brain analysis
async function handleConsultationRequest(
  ctx: ActionCtx,
  workspaceId: Id<"workspaces">,
  contactId: Id<"contacts">,
  ariConversationId: Id<"ariConversations">
) {
  // Update context to mark consultation requested
  await ctx.runMutation(internal.kapso.updateAriContext, {
    ariConversationId,
    updates: {
      routing: {
        consultation_requested_at: Date.now(),
      },
    },
  });

  // Mark for handoff
  await ctx.runMutation(internal.ai.brain.updateConversationState, {
    ariConversationId,
    state: "handoff",
    handoff_at: Date.now(),
    handoff_reason: "consultation_requested",
  });

  // Schedule notification (could be email, webhook, or in-app)
  await ctx.scheduler.runAfter(0, internal.notifications.notifyHuman, {
    workspaceId,
    contactId,
    reason: "consultation_requested",
    priority: "high",
  });
}
```

### FAQ Handling via Prompt

```typescript
// Embed FAQ knowledge directly in system prompt
function buildEagleFAQ(): string {
  return `## FAQ KNOWLEDGE (gunakan untuk jawab pertanyaan)

TENTANG EAGLE:
- Eagle Overseas Indonesia = agen studi luar negeri
- Visa success rate: 98%
- Fokus: karir dan potensi mahasiswa, bukan komisi universitas

LAYANAN:
- Perencanaan studi strategis
- Bimbingan beasiswa
- Review esai motivasi
- Persiapan IELTS/TOEFL
- Pendampingan visa
- Optimasi CV & LinkedIn

NEGARA TUJUAN:
- Australia: Melbourne Uni, UNSW, Monash
- Canada: UBC, UofT, McGill
- UK: Oxford, Cambridge, Imperial
- USA: Harvard, MIT, Stanford

KALAU DITANYA HARGA/BIAYA:
- Bilang: "untuk detail biaya, nanti tim kita yang jelaskan langsung ya kak"
- JANGAN kasih angka spesifik

KALAU DITANYA HAL YANG GA TAU:
- Bilang: "bentar ya saya tanya dulu ke tim, nanti saya kabarin"`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rule-based chatbots | LLM-driven conversation | 2023-2024 | Natural conversations |
| Separate FSM | Prompt-encoded state | 2024-2025 | Simpler architecture |
| Hardcoded FAQ | RAG/prompt injection | 2024-2025 | Dynamic knowledge |
| Manual handoff | AI-detected handoff | 2025-2026 | Faster escalation |

**WhatsApp 2026 Policy Note:** Meta prohibits general-purpose AI chatbots from Jan 15, 2026. Eagle's bot is compliant because it's purpose-specific (education consulting qualification) with clear human handoff options.

## Open Questions

1. **Notification Mechanism**
   - What we know: Need to notify human when consultation requested
   - What's unclear: Email? In-app notification? SMS? Webhook to n8n?
   - Recommendation: Start with in-app (update conversation status, increment unread), add email later

2. **Community Link Delivery**
   - What we know: ariConfig has community_link field
   - What's unclear: Send as separate message? Include in response? Interactive button?
   - Recommendation: Include in bot response text, no separate message

3. **Conversation Reset**
   - What we know: Some leads may return after days/weeks
   - What's unclear: When to reset qualification progress?
   - Recommendation: Don't reset - continue from last state. If stale (>7 days), greeting can acknowledge "kita sempet ngobrol sebelumnya ya kak"

## Sources

### Primary (HIGH confidence)
- `/home/jfransisco/Desktop/21/my21staff/convex/ai/context.ts` - Existing prompt builders
- `/home/jfransisco/Desktop/21/my21staff/convex/ai/brain.ts` - Brain analysis structure
- `/home/jfransisco/Desktop/21/my21staff/convex/kapso.ts` - processARI orchestration
- `/home/jfransisco/Desktop/21/my21staff/business/bots/eagle-studenthub-bot.md` - Ari persona
- `/home/jfransisco/Desktop/21/my21staff/business/clients/eagle/eagle-ari-journey.md` - Detailed flow

### Secondary (MEDIUM confidence)
- [WhatsApp's 2026 AI Policy](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban) - Policy compliance
- [Finite State Machines in Chatbots](https://www.haptik.ai/tech/finite-state-machines-to-the-rescue/) - FSM patterns
- [Chatbot Human Handoff Guide](https://www.gptbots.ai/blog/chat-bot-to-human-handoff) - Handoff patterns

### Tertiary (LOW confidence)
- General LLM prompt engineering best practices from training data

## Metadata

**Confidence breakdown:**
- Architecture patterns: HIGH - based on existing codebase analysis
- State management: HIGH - existing schema supports this
- Notification: MEDIUM - mechanism not yet decided
- FAQ handling: HIGH - prompt engineering is standard approach

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain)

---

## Implementation Checklist for Planner

Based on this research, the planner should create tasks for:

1. **Enhance buildMouthSystemPrompt** - Add state-aware instructions
2. **Define QualificationContext structure** - Document + use in context field
3. **Update processARI** - Check Brain's next_action before Mouth response
4. **Add greeting flow** - Name + destination collection
5. **Add qualifying flow** - Document checklist (one per message)
6. **Add routing flow** - Community vs Consultation offer
7. **Implement human notification** - On consultation request
8. **Add Eagle FAQ to prompts** - Services, destinations, policies
9. **E2E test** - Full qualification flow verification
