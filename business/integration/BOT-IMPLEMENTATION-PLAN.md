# Bot Implementation Plan
**Date:** 2026-01-29
**Goal:** Implement multi-stage university counseling bot for Eagle Overseas

---

## Executive Summary

**What We're Building:**
A 7-stage conversational bot that:
1. Greets new leads
2. Qualifies them (age + documents)
3. Answers questions & offers consultation
4. Captures objections if they decline
5. Attempts one circle-back
6. Routes qualified leads to humans
7. Offers community to unqualified leads

**Why This Matters:**
- Automates 70% of initial lead qualification
- Captures valuable objection data for product improvement
- Routes only high-quality leads to human consultants
- Costs ~$0.008 per conversation (98.7% profit margin)

---

## Current State Analysis

### What We Have ✅
- ✅ `ariConfig` table - bot configuration storage
- ✅ `ariConversations` table - conversation state tracking
- ✅ Kapso webhook integration - receives messages
- ✅ `kapso:processARI` - bot message handler
- ✅ State machine support - `state` field in ariConversations
- ✅ Context storage - `context` field for data capture
- ✅ Grok API integration - AI model ready

### What's Missing ❌
- ❌ State-specific prompts for 7 stages
- ❌ Qualification logic (age + documents evaluation)
- ❌ Objection capture & handling
- ❌ Circle-back logic (one attempt only)
- ❌ Handoff trigger automation
- ❌ Knowledge base for Q&A
- ❌ Analytics dashboard
- ❌ Bot configuration UI (Your Intern page)

---

## Implementation Phases

### Phase 1: Core State Machine (Day 1-2)
**Goal:** Get the 7-stage conversation flow working

#### Tasks:
1. **Update schema for extended context**
   - Add `qualification` object (age, documents, isQualified)
   - Add `sales` object (questionsAnswered, objection, consultationInterest)
   - Add `analytics` object (stateTransitions, finalOutcome)

2. **Create state transition helpers**
   - `evaluateQualification()` - determine if qualified
   - `canOvercomeObjection()` - check if objection can be addressed
   - `getNextState()` - state machine logic

3. **Implement state-specific mutations**
   - `updateQualificationData()` - store age + documents
   - `trackQAAndOfferConsultation()` - track questions answered
   - `captureObjection()` - store objection details
   - `handleCircleBack()` - one attempt logic
   - `markForHandoff()` - route to human

**Deliverable:** Bot can navigate through all 7 states based on user responses

---

### Phase 2: Prompts & Brain Logic (Day 2-3)
**Goal:** Make the bot sound natural and follow the strategy

#### Tasks:
1. **Create state-specific system prompts**
   - Greeting: "Hi! Have you filled our questionnaire?"
   - Qualification: "Tell me your age and which documents you have"
   - Q&A: Answer questions, then offer consultation
   - Objection: Capture why they're not interested
   - Circle Back: One gentle attempt to overcome
   - Handoff: "Let me connect you with a consultant"
   - Community: "Here's our community link"

2. **Update Brain analysis**
   - Detect when user provides age
   - Detect document mentions (passport, CV, transcript, English cert)
   - Detect objection keywords (price, timing, not ready, etc.)
   - Detect yes/no to consultation offer
   - Detect state change triggers

3. **Test conversation flows**
   - Highly qualified path: greeting → qualification → handoff (3 steps)
   - Standard path: greeting → qualification → Q&A → consultation yes → handoff (5 steps)
   - Objection path: greeting → qualification → Q&A → consultation no → objection → circle back → community (7 steps)

**Deliverable:** Bot has natural conversations and transitions smoothly between states

---

### Phase 3: Knowledge Base (Day 3-4)
**Goal:** Bot can answer common questions

#### Tasks:
1. **Seed FAQ entries**
   - Services: "What do you offer?" "Is consultation free?"
   - Universities: "Which countries?" "Which programs?"
   - Requirements: "What documents?" "IELTS score needed?"
   - Timeline: "When to apply?" "How long does it take?"
   - Pricing: "How much?" "Payment plans?"

2. **Implement KB search in Mouth**
   - Before calling AI, search KB for relevant answers
   - Inject KB context into prompt if found
   - Track which questions were answered from KB (for analytics)

**Deliverable:** Bot answers questions accurately using KB before offering consultation

---

### Phase 4: Bot Configuration Script (Day 4)
**Goal:** Set up Eagle Overseas bot with proper config

#### Tasks:
1. **Create setup script**
   ```typescript
   // scripts/setup-bot.ts
   - Upsert ariConfig for Eagle Overseas workspace
   - Bot name: "Ari"
   - Greeting style: "friendly"
   - Language: "en" (English)
   - Community link: [Eagle's Telegram group]
   ```

2. **Seed knowledge base entries**
   - Run script to insert 20+ FAQ entries
   - Categorize by topic
   - Mark all as active

3. **Test bot activation**
   - Send test message to Eagle's WhatsApp
   - Verify bot responds with greeting
   - Check state transitions in database

**Deliverable:** Eagle Overseas bot is live and responding

---

### Phase 5: Analytics Dashboard (Day 5)
**Goal:** Track bot performance and objection insights

#### Tasks:
1. **Create analytics queries**
   - `getBotMetrics()` - total conversations, handoffs, conversion rate
   - `getObjectionTrends()` - breakdown by objection type
   - `getQualificationStats()` - avg age, document distribution

2. **Build dashboard component**
   - Card: Total Conversations
   - Card: Qualified Handoffs (with %)
   - Card: Avg Age (qualified leads)
   - Chart: Objection Breakdown
   - Chart: Document Distribution
   - Table: Recent Objections (for product insights)

3. **Add to Your Intern page**
   - New tab: "Analytics"
   - Real-time metrics
   - Date range filter (last 7/30/90 days)

**Deliverable:** Dashboard shows bot performance and objection insights

---

## Technical Implementation Details

### State Machine Transitions

```
greeting
  ↓ (user responds)
qualification
  ├─ (highly qualified: age ≤ 25 + 4 docs OR English + 2 docs)
  │  → handoff
  └─ (not qualified)
     → q_and_a
        ├─ (consultation yes)
        │  → handoff
        └─ (consultation no after 1-2 questions)
           → objection_handling
              ├─ (can overcome: price, timing, not_ready, need_info)
              │  → circle_back
              │     ├─ (changed mind)
              │     │  → handoff
              │     └─ (still no)
              │        → community_fallback → ended
              └─ (can't overcome: no_money, already_has_advisor, prefer_self_study)
                 → community_fallback → ended
```

### Data Structures

**ariConversations.context:**
```json
{
  "qualification": {
    "age": 22,
    "documents": ["passport", "cv", "transcript", "english_cert"],
    "documentCount": 4,
    "isQualified": true,
    "qualifiedReason": "all_docs_young_age",
    "qualifiedAt": 1706536800000
  },
  "sales": {
    "questionsAnswered": 2,
    "qaHistory": [
      {
        "question": "Which universities do you support?",
        "answer": "We specialize in UK, Australia, Canada...",
        "timestamp": 1706536900000,
        "source": "kb"
      }
    ],
    "consultationOffered": true,
    "consultationOfferedAt": 1706537000000,
    "consultationInterest": true
  },
  "analytics": {
    "stateTransitions": ["greeting", "qualification", "handoff"],
    "transitionTimestamps": {
      "greeting": 1706536700000,
      "qualification": 1706536800000,
      "handoff": 1706537100000
    },
    "conversationDuration": 400000,
    "qualificationPath": "highly_qualified",
    "finalOutcome": "handoff"
  }
}
```

---

## Testing Strategy

### Manual Test Cases

1. **Happy Path (Highly Qualified)**
   - User: "Hi"
   - Bot: Greets, asks about questionnaire
   - User: "I'm 22 and have passport, CV, transcript, and IELTS"
   - Bot: Recognizes highly qualified → immediate handoff
   - ✅ State: greeting → qualification → handoff
   - ✅ Contact marked as hot lead

2. **Standard Path (Consultation Yes)**
   - User: "Hi"
   - Bot: Greets
   - User: "I'm 23 and have passport and CV"
   - Bot: Not highly qualified → asks questions
   - User: "How much does it cost?"
   - Bot: Answers from KB, offers consultation
   - User: "Yes, I'd like a consultation"
   - Bot: Handoff
   - ✅ State: greeting → qualification → q_and_a → handoff

3. **Objection Path (Circle Back Success)**
   - User: "Hi"
   - Bot: Greets
   - User: "I'm 24, have passport"
   - Bot: Q&A → offers consultation
   - User: "No thanks, too expensive"
   - Bot: Captures objection, offers community
   - Bot: Circles back ("Many felt same way, found it valuable...")
   - User: "Actually, okay let's try"
   - Bot: Handoff
   - ✅ State: greeting → qualification → q_and_a → objection → circle_back → handoff

4. **Community Fallback Path**
   - User: "Hi"
   - Bot: Greets
   - User: "I'm 26, have passport only"
   - Bot: Q&A → offers consultation
   - User: "No, I prefer self-study"
   - Bot: Captures objection (can't overcome)
   - Bot: Offers community link, ends positively
   - ✅ State: greeting → qualification → q_and_a → objection → community_fallback → ended

---

## Success Metrics

### Bot Performance Targets
- **Response Time:** < 5 seconds
- **Conversation Duration:** < 10 minutes to handoff
- **Qualified Lead Rate:** > 30%
- **Data Capture Rate:** > 90% (age + documents)

### Business Impact Targets
- **Lead Quality:** > 70% of handoffs convert to paid customers
- **Cost Per Qualified Lead:** < $0.01 (vs $50-100 for ads)
- **Objection Insights:** 100% captured and categorized
- **Product Iteration:** Quarterly reviews based on objection data

---

## Risk Mitigation

### Potential Issues & Solutions

1. **Bot too pushy → Low engagement**
   - Solution: Respectful tone, accept "no" after 2 attempts
   - Monitor: Track drop-off rates per state

2. **Users don't provide age/documents → Stuck in qualification**
   - Solution: Gentle reminders, offer to skip if hesitant
   - Fallback: Proceed to Q&A after 2 attempts

3. **KB answers are inaccurate → Trust issues**
   - Solution: Human review of all KB entries
   - Monitor: Track consultation → paid conversion rate

4. **Too many community fallbacks → Low ROI**
   - Solution: Adjust qualification criteria
   - A/B test: Different thresholds for "highly qualified"

---

## Timeline

| Day | Focus | Tasks | Outcome |
|-----|-------|-------|---------|
| 1 | Schema & Mutations | Update context schema, create 5 mutations | State machine works |
| 2 | Prompts & Brain | State-specific prompts, Brain analysis logic | Natural conversations |
| 3 | Knowledge Base | Seed 20+ FAQ entries, KB search integration | Bot answers questions |
| 4 | Bot Setup Script | Create setup script, configure Eagle bot | Bot is live |
| 5 | Analytics | Queries + dashboard UI | Performance tracking |

**Total:** 5 days from start to production

---

## Next Steps

### Immediate Actions
1. ✅ Read BOT-STRATEGY.md (done)
2. ✅ Analyze current codebase (done)
3. ✅ Create implementation plan (done)
4. ⏳ Get approval to proceed
5. ⏳ Start Phase 1 (Core State Machine)

---

*Plan created: 2026-01-29*
*Ready for execution: Awaiting user approval*
