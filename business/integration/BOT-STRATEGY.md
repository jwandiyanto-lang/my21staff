# Bot Strategy: ARI University Counseling Bot

**Date:** January 29, 2025
**Purpose:** Multi-stage lead qualification and consultation booking bot

---

## Executive Summary

**Bot Goal:** Qualify university counseling leads, collect key data (age, documents, objections), and route qualified leads to human consultants.

**Why ARI (Not Kapso Workflows):** 10-stage conversation with complex data capture, state management, and objection handling - perfect fit for ARI's capabilities.

**Key Differentiator:** Capture rejection reasons and feedback to improve product offerings.

---

## Complete Conversation Flow

### Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     University Counseling Bot Flow              │
└─────────────────────────────────────────────────────────────────┘

1. GREETING (Within 24h window - FREE reply)
   Bot: "Hi! Thanks for reaching out. Have you filled our
        questionnaire yet?"
   ├─ Yes → Go to stage 2 (QUALIFICATION)
   └─ No  → Go to stage 2 (QUALIFICATION)

2. QUALIFICATION (Data Capture)
   Bot: "Great! To help you better, could you tell me:
        1. How old are you?
        2. Which documents do you have? (Select all that apply)
           [ ] Passport
           [ ] CV/Resume
           [ ] Transcript/Diploma
           [ ] English Certificate"

   Store: {
     age: number,
     documents: string[],
     documentCount: number
   }

   Evaluate: {
     ✓ 4 documents + young age (18-25) → Stage 6 (HANDOVER)
     ✓ English cert + 2 other docs → Stage 6 (HANDOVER)
     ✗ Else → Stage 3 (Q&A)
   }

3. Q&A (Build Trust + 1-2 Questions)
   Bot: "Thanks! Before we continue, do you have any questions
        about our services? I'm happy to help."

   Track: {
     questionsAnswered: number (count),
     qaHistory: [{question, answer, source}]
   }

   After 1-2 questions:
   Bot: "Would you like a 1-on-1 consultation with our
        education consultant? It's completely free and very
        helpful - many students find it valuable!"

   ├─ Yes → Stage 6 (HANDOVER)
   └─ No  → Stage 4 (COMMUNITY + OBJECTION)

4. COMMUNITY + OBJECTION (Capture Feedback)
   Bot: "That's completely okay! We have a community where
        we share regular updates and you can ask questions
        in detail there. Would you like me to send you the link?"

   Store: {
     communityOffered: true
   }

   Then:
   Bot: "May I ask why aren't you interested in the 1-on-1?
        It's very helpful and we'd love to understand how
        to improve our service."

   Capture: {
     objection: string ('price', 'no_money', 'timing', 'not_ready',
                        'already_has_advisor', 'prefer_self_study', etc.),
     objectionDetails: string,
     circleBackAttempts: number
   }

   Evaluate objection:
   ├─ Can overcome → Stage 5 (CIRCLE BACK - one attempt only)
   └─ Can't overcome → Stage 7 (COMMUNITY FALLBACK)

5. CIRCLE BACK (One Attempt Only - Not Pushy)
   Bot: "I understand {objection}. Many students felt the same
        way, but after the consultation, they found it really
        valuable for their application journey. Are you sure
        you don't want to try it?"

   ├─ Yes (changed mind) → Stage 6 (HANDOVER)
   └─ No (second rejection) → Stage 7 (COMMUNITY FALLBACK)

6. HANDOFF (Route to Human)
   Bot: "Excellent! Let me connect you with our education
        consultant. They'll be with you shortly to help you
        with your university application."

   Actions:
   - Set conversation.status = 'handover'
   - Tag contact as 'hot_lead'
   - Mark qualified = true
   - Notify human team
   - Stop bot responses

7. COMMUNITY FALLBACK (Final State)
   Bot: "No problem at all! Here's our community link:
        [community_link]. Feel free to join anytime - we
        share updates and you can ask questions there.
        Best of luck with your applications!"

   Actions:
   - Set conversation.status = 'open'
   - Tag contact with objection tag
   - Store feedback for product improvement
   - Stop active selling (future: drip campaigns)
```

---

## State Machine Definition

### States and Transitions

```typescript
type BotState =
  | 'greeting'           // Initial welcome
  | 'qualification'      // Collect age + documents
  | 'q_and_a'            // Answer questions, pitch consultation
  | 'objection_handling'  // Capture objection, offer community
  | 'circle_back'        // One attempt to overcome objection
  | 'handoff'            // Qualified, route to human
  | 'community_fallback' // Not interested, community link
  | 'ended';             // Conversation complete

type StateTransition = {
  from: BotState;
  to: BotState;
  trigger: string;
  condition?: (context: QualificationContext) => boolean;
}

// Transition rules
const TRANSITIONS: StateTransition[] = [
  // Greeting → Qualification (always)
  { from: 'greeting', to: 'qualification', trigger: 'user_responds' },

  // Qualification → Branch
  {
    from: 'qualification',
    to: 'handoff',
    trigger: 'qualified',
    condition: (ctx) => isHighlyQualified(ctx)
  },
  {
    from: 'qualification',
    to: 'q_and_a',
    trigger: 'not_qualified',
    condition: (ctx) => !isHighlyQualified(ctx)
  },

  // Q&A → Branch
  {
    from: 'q_and_a',
    to: 'handoff',
    trigger: 'consultation_yes',
    condition: (ctx) => ctx.sales?.consultationInterest === true
  },
  {
    from: 'q_and_a',
    to: 'objection_handling',
    trigger: 'after_2_questions',
    condition: (ctx) => (ctx.sales?.questionsAnswered || 0) >= 2
  },

  // Objection Handling → Branch
  {
    from: 'objection_handling',
    to: 'circle_back',
    trigger: 'objection_captured',
    condition: (ctx) => canOvercomeObjection(ctx.sales?.objection)
  },
  {
    from: 'objection_handling',
    to: 'community_fallback',
    trigger: 'objection_no_workaround',
    condition: (ctx) => !canOvercomeObjection(ctx.sales?.objection)
  },

  // Circle Back → Branch
  {
    from: 'circle_back',
    to: 'handoff',
    trigger: 'changed_mind',
    condition: (ctx) => ctx.sales?.consultationInterest === true
  },
  {
    from: 'circle_back',
    to: 'community_fallback',
    trigger: 'second_rejection',
    condition: (ctx) => (ctx.sales?.circleBackAttempts || 0) >= 1
  },
];
```

---

## Data Schema

### 1. Conversation Context Structure

```typescript
interface QualificationContext {
  // === Qualification Data ===
  qualification?: {
    age: number | null;
    documents: string[];
    documentCount: number;
    isQualified: boolean;
    qualifiedAt?: number;
    qualifiedReason?: string;  // Why qualified (for analytics)
  };

  // === Sales Conversation Data ===
  sales?: {
    // Q&A tracking
    questionsAnswered: number;
    qaHistory: Array<{
      question: string;
      answer: string;
      timestamp: number;
      source: 'kb' | 'ai' | 'community_link';
    }>;

    // Consultation offer
    consultationOffered: boolean;
    consultationOfferedAt?: number;
    consultationInterest: boolean | null;

    // Community offer
    communityOffered: boolean;
    communityOfferedAt?: number;

    // Objection handling
    objection: string | null;
    objectionDetails: string | null;
    objectionCapturedAt?: number;
    canOvercome: boolean;

    // Circle back (one attempt only)
    circleBackAttempts: number;
    circleBackAt?: number;
    circleBackSuccess: boolean | null;
  };

  // === Analytics Data ===
  analytics?: {
    stateTransitions: BotState[];
    transitionTimestamps: Record<string, number>;
    conversationDuration: number;
    qualificationPath: string;
    finalOutcome: 'handoff' | 'community' | 'disengaged';
  };
}
```

### 2. Contact Metadata Structure

```typescript
interface ContactMetadata {
  // === Qualification Data ===
  age?: number;
  location?: string;
  documents_collected?: string[];
  qualification_date?: number;
  qualification_status?: 'qualified' | 'not_qualified' | 'partial';

  // === Sales/Objection Data ===
  objection?: string;
  objection_details?: string;
  objection_date?: number;
  consultation_interest?: boolean;
  community_offered?: boolean;

  // === Source Tracking ===
  source?: 'whatsapp_bot';
  bot_conversation_id?: string;
  first_engagement?: number;
}
```

### 3. Database Schema Updates

```sql
-- Update to ariConversations table:
ALTER TABLE ariConversations ADD COLUMN context JSONB DEFAULT '{}';

-- Update to contacts table (metadata field):
-- metadata JSONB already exists, just add these keys:
{
  "age": 22,
  "location": "Jakarta",
  "documents_collected": ["passport", "cv", "transcript", "english_cert"],
  "objjection": "price",
  "objection_details": "No money right now, maybe in 6 months",
  "objection_date": 1706536800000,
  "consultation_interest": false,
  "community_offered": true
}
```

---

## Qualification Logic

### High-Quality Lead Criteria

```typescript
function isHighlyQualified(context: QualificationContext): boolean {
  const { qualification } = context;
  if (!qualification) return false;

  const { age, documents, documentCount } = qualification;

  // Criteria 1: All 4 documents + young age
  const hasAllDocs = documentCount >= 4;
  const isYoung = age && age <= 25;

  if (hasAllDocs && isYoung) {
    qualification.qualifiedReason = 'all_docs_young_age';
    return true;
  }

  // Criteria 2: English cert + 2 other documents
  const hasEnglish = documents.includes('english_cert');
  const hasTwoOthers = documentCount >= 2;

  if (hasEnglish && hasTwoOthers) {
    qualification.qualifiedReason = 'english_plus_two';
    return true;
  }

  return false;
}
```

### Document List

```typescript
const DOCUMENT_TYPES = [
  {
    key: 'passport',
    label: 'Passport',
    description: 'Valid passport or national ID',
    required: true,
  },
  {
    key: 'cv',
    label: 'CV/Resume',
    description: 'Current CV or resume',
    required: true,
  },
  {
    key: 'transcript',
    label: 'Transcript/Diploma',
    description: 'Academic transcripts or diploma certificate',
    required: true,
  },
  {
    key: 'english_cert',
    label: 'English Certificate',
    description: 'IELTS, TOEFL, or other English proficiency proof',
    required: false,  // Bonus
  },
];
```

### Objection Types

```typescript
const OBJECTION_CATEGORIES = [
  {
    key: 'price',
    label: 'Price / Cost',
    canOvercome: true,
    counterArguments: [
      'We offer flexible payment plans',
      'Free consultation first - no commitment',
      'Many students find ROI worth the investment',
    ],
  },
  {
    key: 'no_money',
    label: 'No Budget',
    canOvercome: false,
    counterArguments: [],  // Respect this, don't push
  },
  {
    key: 'timing',
    label: 'Bad Timing',
    canOvercome: true,
    counterArguments: [
      'We can schedule for when you\'re ready',
      'Consultation helps you plan timeline',
    ],
  },
  {
    key: 'not_ready',
    label: 'Not Ready Yet',
    canOvercome: true,
    counterArguments: [
      'Consultation helps you prepare',
      'No pressure - just information',
    ],
  },
  {
    key: 'already_has_advisor',
    label: 'Has Advisor',
    canOvercome: false,
    counterArguments: [],  // Respect their choice
  },
  {
    key: 'prefer_self_study',
    label: 'Prefers Self Study',
    canOvercome: false,
    counterArguments: [],  // Offer community instead
  },
  {
    key: 'need_info',
    label: 'Needs More Information',
    canOvercome: true,
    counterArguments: [
      'Consultation is exactly for that - free info session',
      'Community also has lots of resources',
    ],
  },
];
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### 1.1 Update Context Schema

**File: `convex/ai/context.ts`**

```typescript
// Add to existing QualificationContext interface
export interface QualificationContext {
  // ... existing fields ...

  // NEW: University counseling specific
  qualification?: {
    age: number | null;
    documents: string[];
    documentCount: number;
    isQualified: boolean;
    qualifiedReason?: string;
    qualifiedAt?: number;
  };

  sales?: {
    questionsAnswered: number;
    qaHistory: Array<{
      question: string;
      answer: string;
      timestamp: number;
      source: 'kb' | 'ai' | 'community';
    }>;
    consultationOffered: boolean;
    consultationOfferedAt?: number;
    consultationInterest: boolean | null;
    communityOffered: boolean;
    communityOfferedAt?: number;
    objection: string | null;
    objectionDetails: string | null;
    objectionCapturedAt?: number;
    canOvercome: boolean;
    circleBackAttempts: number;
    circleBackAt?: number;
    circleBackSuccess: boolean | null;
  };

  analytics?: {
    stateTransitions: string[];
    transitionTimestamps: Record<string, number>;
    conversationDuration: number;
    qualificationPath: string;
    finalOutcome: 'handoff' | 'community' | 'disengaged';
  };
}
```

#### 1.2 Add Helper Functions

**File: `convex/ai/context.ts`**

```typescript
// Qualification logic
export function evaluateQualification(
  context: QualificationContext
): { qualified: boolean; reason: string } {
  const qual = context.qualification;
  if (!qual || !qual.age || qual.documents.length === 0) {
    return { qualified: false, reason: 'insufficient_data' };
  }

  // Check criteria
  const hasAllDocs = qual.documentCount >= 4;
  const isYoung = qual.age <= 25;

  if (hasAllDocs && isYoung) {
    return { qualified: true, reason: 'all_docs_young_age' };
  }

  const hasEnglish = qual.documents.includes('english_cert');
  const hasTwoOthers = qual.documentCount >= 2;

  if (hasEnglish && hasTwoOthers) {
    return { qualified: true, reason: 'english_plus_two' };
  }

  return { qualified: false, reason: 'not_qualified' };
}

// Objection handling
export function canOvercomeObjection(objection: string | null): boolean {
  if (!objection) return false;

  const canOvercomeMap: Record<string, boolean> = {
    'price': true,
    'timing': true,
    'not_ready': true,
    'need_info': true,
    'no_money': false,
    'already_has_advisor': false,
    'prefer_self_study': false,
  };

  return canOvercomeMap[objection] || false;
}

// State transition helper
export function getNextState(
  currentState: string,
  context: QualificationContext
): string {
  // Implement state machine logic
  // See "State Machine Definition" section above
}
```

### Phase 2: Update The Mouth Prompts (Week 2)

**File: `convex/ai/context.ts` - `buildMouthSystemPrompt`**

```typescript
// Add state-specific prompts
const STATE_PROMPTS: Record<string, string> = {
  greeting: `You are a friendly education consultant assistant.
    Start with a warm welcome.
    Ask: "Hi! Thanks for reaching out to my21staff. Have you filled our questionnaire yet?"
    Keep it brief and friendly.`,

  qualification: `You are collecting information to help with university applications.
    Ask: "Great! To help you better, could you tell me:
      1. How old are you?
      2. Which documents do you have? (Select all that apply)
         • Passport
         • CV/Resume
         • Transcript/Diploma
         • English Certificate"

    Collect and store:
    - Age (number)
    - List of documents they have

    Be patient and friendly. If they ask about why, explain:
    "This helps us understand your profile and recommend the best universities for you."`,

  q_and_a: `You are building trust and answering questions before offering consultation.

    CURRENT CONTEXT:
    - Age: {age}
    - Documents: {documents}
    - Questions answered so far: {count}

    GUIDELINES:
    - Answer questions briefly and helpfully
    - Use knowledge base information if available
    - After 1-2 questions, transition to consultation pitch
    - Don't answer more than 2-3 questions before pitching

    Consultation pitch: "Would you like a 1-on-1 consultation with our education consultant? It's completely free and very helpful - many students find it valuable for their application journey."`,

  objection_handling: `You are capturing feedback and offering community.

    If they haven't received community link yet:
    "That's completely okay! We have a community where we share regular updates and you can ask questions in detail there. Would you like me to send you the link?"

    Then ask: "May I ask why aren't you interested in the 1-on-1? It's very helpful and we'd love to understand how to improve our service."

    Capture their objection sincerely. Thank them for their feedback.
    Be empathetic, not pushy.`,

  circle_back: `You are making ONE attempt to overcome their objection.

    Current objection: {objection}

    GUIDELINES:
    - Make ONE attempt only
    - Be respectful, not pushy
    - Acknowledge their concern
    - Share how others with similar concern found it valuable
    - Ask: "Are you sure you don't want to try it?"

    If they say no again: Respect and move to community.`,

  handoff: `Great! They're interested. Transfer to human.
    Say: "Excellent! Let me connect you with our education consultant. They'll be with you shortly to help you with your university application."

    STOP - do not send more messages.`,

  community_fallback: `Final state - offer community and end positively.
    Say: "No problem at all! Here's our community link: {community_link}. Feel free to join anytime - we share updates and you can ask questions there. Best of luck with your applications!"

    STOP - do not send more messages.`,
};

// Update buildMouthSystemPrompt function
export function buildMouthSystemPrompt(
  botName: string,
  contactName: string,
  language: string,
  state: string,
  context: QualificationContext,
  communityLink: string
): string {
  const statePrompt = STATE_PROMPTS[state] || '';

  let basePrompt = `You are ${botName}, a friendly education consultant for my21staff.

You are helping ${contactName || 'there'} with university application inquiries.

CONVERSATION STATE: ${state}

${statePrompt}

IMPORTANT RULES:
- Be friendly and brief
- Don't be pushy or salesy
- Respect their decisions
- Capture key information (age, documents, objections)
- If they seem unsure, offer community
- After "no" twice, accept gracefully`;

  // Add state-specific context
  if (state === 'q_and_a' && context.qualification) {
    basePrompt += `

CURRENT PROFILE:
- Age: ${context.qualification.age || 'not provided'}
- Documents: ${context.qualification.documents.join(', ') || 'none provided'}`;
  }

  if (state === 'circle_back' && context.sales?.objection) {
    basePrompt += `

THEIR OBJECTION: ${context.sales.objection}
${getCounterArgument(context.sales.objection)}`;
  }

  if (state === 'community_fallback' && communityLink) {
    basePrompt += `

COMMUNITY LINK: ${communityLink}`;
  }

  return basePrompt;
}

function getCounterArgument(objection: string | null): string {
  const arguments: Record<string, string> = {
    'price': 'Many students were concerned about cost too, but after the free consultation they found it very valuable for planning their budget and timeline.',
    'timing': 'No problem! We can schedule the consultation for whenever works best for you - even next month.',
    'not_ready': 'Completely understandable! The consultation is just to help you prepare - no commitment required.',
    'need_info': 'That\'s exactly what the consultation is for - a free information session to answer all your questions.',
  };

  return arguments[objection || ''] || '';
}
```

### Phase 3: Database Mutations (Week 2)

**File: `convex/ari.ts`**

```typescript
// Add new mutations for tracking

/**
 * Update qualification data (from qualification stage).
 */
export const updateQualificationData = mutation({
  args: {
    ariConversationId: v.id("ariConversations"),
    age: v.number(),
    documents: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.ariConversationId);
    if (!conversation) return;

    const documentCount = args.documents.length;
    const evaluation = evaluateQualification({
      qualification: {
        age: args.age,
        documents: args.documents,
        documentCount,
      },
    });

    // Update ariConversation context
    const now = Date.now();
    await ctx.db.patch(args.ariConversationId, {
      context: {
        ...conversation.context,
        qualification: {
          age: args.age,
          documents: args.documents,
          documentCount,
          isQualified: evaluation.qualified,
          qualifiedReason: evaluation.reason,
          qualifiedAt: evaluation.qualified ? now : undefined,
        },
        analytics: {
          ...(conversation.context?.analytics || {}),
          stateTransitions: [
            ...(conversation.context?.analytics?.stateTransitions || []),
            'qualification',
          ],
          transitionTimestamps: {
            ...(conversation.context?.analytics?.transitionTimestamps || {}),
            qualification: now,
          },
        },
      },
      updated_at: now,
    });

    // Also update contact metadata
    if (conversation.contact_id) {
      const contact = await ctx.db.get(conversation.contact_id);
      if (contact) {
        await ctx.db.patch(contact._id, {
          metadata: {
            ...contact.metadata,
            age: args.age,
            documents_collected: args.documents,
            qualification_date: now,
            qualification_status: evaluation.qualified ? 'qualified' : 'partial',
          },
          updated_at: now,
        });
      }
    }

    // Return next state
    return {
      nextState: evaluation.qualified ? 'handoff' : 'q_and_a',
      isQualified: evaluation.qualified,
    };
  },
});

/**
 * Track Q&A and consultation offer.
 */
export const trackQAAndOfferConsultation = mutation({
  args: {
    ariConversationId: v.id("ariConversations"),
    question: v.string(),
    answer: v.string(),
    source: v.string(),
    offeredConsultation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.ariConversationId);
    if (!conversation) return;

    const now = Date.now();
    const sales = conversation.context?.sales || {};
    const currentCount = sales.questionsAnswered || 0;

    await ctx.db.patch(args.ariConversationId, {
      context: {
        ...conversation.context,
        sales: {
          ...sales,
          questionsAnswered: currentCount + 1,
          qaHistory: [
            ...(sales.qaHistory || []),
            {
              question: args.question,
              answer: args.answer,
              timestamp: now,
              source: args.source,
            },
          ],
          consultationOffered: args.offeredConsultation,
          consultationOfferedAt: args.offeredConsultation ? now : undefined,
        },
      },
      updated_at: now,
    });
  },
});

/**
 * Capture objection and offer community.
 */
export const captureObjection = mutation({
  args: {
    ariConversationId: v.id("ariConversations"),
    objection: v.string(),
    details: v.optional(v.string()),
    offeredCommunity: v.boolean(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.ariConversationId);
    if (!conversation) return;

    const now = Date.now();
    const canOvercome = canOvercomeObjection(args.objection);

    await ctx.db.patch(args.ariConversationId, {
      context: {
        ...conversation.context,
        sales: {
          ...(conversation.context?.sales || {}),
          objection: args.objection,
          objectionDetails: args.details,
          objectionCapturedAt: now,
          canOvercome,
          communityOffered: args.offeredCommunity,
          communityOfferedAt: args.offeredCommunity ? now : undefined,
        },
        analytics: {
          ...(conversation.context?.analytics || {}),
          stateTransitions: [
            ...(conversation.context?.analytics?.stateTransitions || []),
            'objection_handling',
          ],
          transitionTimestamps: {
            ...(conversation.context?.analytics?.transitionTimestamps || {}),
            objection_handling: now,
          },
        },
      },
      updated_at: now,
    });

    // Also update contact metadata
    if (conversation.contact_id) {
      const contact = await ctx.db.get(conversation.contact_id);
      if (contact) {
        await ctx.db.patch(contact._id, {
          metadata: {
            ...contact.metadata,
            objection: args.objection,
            objection_details: args.details,
            objection_date: now,
            community_offered: args.offeredCommunity,
          },
          updated_at: now,
        });
      }
    }

    // Return next state
    return {
      nextState: canOvercome ? 'circle_back' : 'community_fallback',
      canOvercome,
    };
  },
});

/**
 * Handle circle back attempt.
 */
export const handleCircleBack = mutation({
  args: {
    ariConversationId: v.id("ariConversations"),
    changedMind: v.boolean(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.ariConversationId);
    if (!conversation) return;

    const now = Date.now();
    const sales = conversation.context?.sales || {};
    const attempts = sales.circleBackAttempts || 0;

    await ctx.db.patch(args.ariConversationId, {
      context: {
        ...conversation.context,
        sales: {
          ...sales,
          circleBackAttempts: attempts + 1,
          circleBackAt: now,
          circleBackSuccess: args.changedMind,
          consultationInterest: args.changedMind,
        },
        analytics: {
          ...(conversation.context?.analytics || {}),
          stateTransitions: [
            ...(conversation.context?.analytics?.stateTransitions || []),
            'circle_back',
          ],
          transitionTimestamps: {
            ...(conversation.context?.analytics?.transitionTimestamps || {}),
            circle_back: now,
          },
          finalOutcome: args.changedMind ? 'handoff' : 'community',
          conversationDuration: now - (conversation.created_at || now),
        },
      },
      updated_at: now,
    });

    // If they changed mind, mark as qualified
    if (args.changedMind && conversation.contact_id) {
      const contact = await ctx.db.get(conversation.contact_id);
      if (contact) {
        await ctx.db.patch(contact._id, {
          metadata: {
            ...contact.metadata,
            consultation_interest: true,
          },
          lead_status: 'hot',
          updated_at: now,
        });
      }
    }

    return {
      nextState: args.changedMind ? 'handoff' : 'community_fallback',
    };
  },
});

/**
 * Mark for handoff to human.
 */
export const markForHandoff = mutation({
  args: {
    ariConversationId: v.id("ariConversations"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.ariConversationId);
    if (!conversation) return;

    const now = Date.now();

    // Update ariConversation
    await ctx.db.patch(args.ariConversationId, {
      state: 'handoff',
      lead_score: 80,
      lead_temperature: 'hot',
      context: {
        ...(conversation.context || {}),
        analytics: {
          ...(conversation.context?.analytics || {}),
          finalOutcome: 'handoff',
          conversationDuration: now - (conversation.created_at || now),
        },
      },
      handoff_at: now,
      handoff_reason: args.reason,
      updated_at: now,
    });

    // Mark regular conversation for human attention
    const regularConv = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contact_id", conversation.contact_id))
      .first();

    if (regularConv) {
      await ctx.db.patch(regularConv._id, {
        status: 'handover',
        unread_count: 1,
        updated_at: now,
      });
    }

    // Update contact
    if (conversation.contact_id) {
      const contact = await ctx.db.get(conversation.contact_id);
      if (contact) {
        await ctx.db.patch(contact._id, {
          lead_status: 'hot',
          lead_score: 80,
          tags: [...(contact.tags || []), 'hot_lead', 'bot_qualified'],
          metadata: {
            ...(contact.metadata || {}),
            consultation_interest: true,
            bot_qualified_date: now,
            bot_qualified_reason: args.reason,
          },
          updated_at: now,
        });
      }
    }
  },
});
```

### Phase 4: Knowledge Base (Week 3)

#### 4.1 Knowledge Base Categories

**Create in Convex or Kapso:**

| Category | Sample Questions |
|----------|------------------|
| **Services** | What do you offer? How does consultation work? Is it free? |
| **Universities** | Which universities? What countries? What programs? |
| **Requirements** | What documents do I need? IELTS score? GPA requirements? |
| **Timeline** | When should I apply? Intake periods? Deadlines? |
| **Pricing** | How much? Payment plans? Scholarships? |
| **Process** | How long does it take? Success rate? |

#### 4.2 Sample FAQ Entries

**File: `convex/ari.ts` - Seed data**

```typescript
// Sample knowledge base entries
const SAMPLE_KNOWLEDGE_ENTRIES = [
  {
    category_id: 'services',
    title: 'What services do you offer?',
    content: `We offer comprehensive university application support:
    • 1-on-1 consultation with education experts
    • University selection based on your profile
    • Application document review
    • Essay/statement of purpose guidance
    • Visa application assistance
    • Pre-departure orientation`,
    is_active: true,
  },
  {
    category_id: 'services',
    title: 'Is the consultation free?',
    content: `Yes! Our initial 1-on-1 consultation is completely free and no-obligation. We'll discuss your goals, review your profile, and recommend universities that fit your needs.`,
    is_active: true,
  },
  {
    category_id: 'universities',
    title: 'Which countries do you support?',
    content: `We specialize in universities in:
    • United Kingdom
    • Australia
    • Canada
    • United States
    • New Zealand
    • Netherlands

    We have partnerships with universities across these countries and can help you find the best fit.`,
    is_active: true,
  },
  {
    category_id: 'requirements',
    title: 'What documents do I need?',
    content: `For most applications, you'll need:
    • Valid Passport or National ID
    • CV/Resume
    • Academic Transcripts / Diploma Certificate
    • English Proficiency Certificate (IELTS, TOEFL, etc.)

    Some universities may require additional documents like portfolios or recommendation letters.`,
    is_active: true,
  },
  {
    category_id: 'pricing',
    title: 'How much does it cost?',
    content: `Our services are flexible. The initial consultation is free. After that, we offer different packages based on your needs - from basic application review to full support. We can discuss this in your consultation!`,
    is_active: true,
  },
  {
    category_id: 'process',
    title: 'How long does the application process take?',
    content: `Timeline varies by country and university:
    • UK: 6-9 months before start date
    • Australia: 4-6 months
    • Canada: 6-12 months
    • US: 8-12 months

    It's best to start early! We'll help you create a timeline.`,
    is_active: true,
  },
];
```

#### 4.3 Knowledge Base Search

**File: `convex/ai/mouth.ts` - Add to `generateMouthResponse`**

```typescript
// Before calling AI, search knowledge base
const searchResults = await ctx.runQuery(
  internal.ai.knowledgeBase.search,
  {
    workspaceId: args.workspaceId,
    query: args.userMessage,
    limit: 3,
  }
);

// If found in KB, use that as context
if (searchResults.length > 0) {
  const kbContext = searchResults.map(r => `- ${r.title}: ${r.content}`).join('\n\n');
  systemPrompt += `\n\nRELEVANT FAQ:\n${kbContext}\n\nUse this information to answer their question.`;
}
```

### Phase 5: Analytics Dashboard (Week 3-4)

#### 5.1 Dashboard Queries

**File: `convex/analytics.ts` (new file)**

```typescript
/**
 * Get bot performance metrics for dashboard.
 */
export const getBotMetrics = query({
  args: {
    workspace_id: v.string(),
    date_from: v.optional(v.number()),
    date_to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all ARI conversations in date range
    const allConversations = await ctx.db
      .query("ariConversations")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();

    const filtered = allConversations.filter(conv => {
      const created = conv.created_at || 0;
      if (args.date_from && created < args.date_from) return false;
      if (args.date_to && created > args.date_to) return false;
      return true;
    });

    // Calculate metrics
    const totalConversations = filtered.length;
    const handoffs = filtered.filter(c => c.state === 'handoff').length;
    const communityFallbacks = filtered.filter(c => c.state === 'ended').length;

    // Extract objection data
    const objections = filtered
      .filter(c => c.context?.sales?.objection)
      .map(c => c.context!.sales!.objection!);

    const objectionCounts = objections.reduce((acc, obj) => {
      acc[obj] = (acc[obj] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Extract qualification data
    const qualified = filtered.filter(c => c.context?.qualification?.isQualified);
    const avgAge = qualified
      .map(c => c.context!.qualification!.age!)
      .reduce((sum, age) => sum + age, 0) / (qualified.length || 1);

    const documentCounts = qualified
      .map(c => c.context!.qualification!.documentCount)
      .reduce((acc, count) => {
        acc[count] = (acc[count] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    // Extract outcomes
    const outcomes = filtered
      .filter(c => c.context?.analytics?.finalOutcome)
      .map(c => c.context!.analytics!.finalOutcome!);

    const outcomeCounts = outcomes.reduce((acc, outcome) => {
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_conversations: totalConversations,
      handoffs,
      community_fallbacks: communityFallbacks,
      conversion_rate: totalConversations > 0 ? handoffs / totalConversations : 0,
      avg_age_qualified: Math.round(avgAge),
      objection_breakdown: objectionCounts,
      document_distribution: documentCounts,
      outcome_breakdown: outcomeCounts,
    };
  },
});

/**
 * Get objection trends for product improvement.
 */
export const getObjectionTrends = query({
  args: {
    workspace_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get contacts with objections
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .filter(q => q.field("metadata").objection != null)
      .take(limit);

    return contacts.map(c => ({
      contact_id: c._id,
      name: c.name,
      age: c.metadata?.age,
      location: c.metadata?.location,
      objection: c.metadata?.objection,
      objection_details: c.metadata?.objection_details,
      objection_date: c.metadata?.objection_date,
      documents_collected: c.metadata?.documents_collected,
    }));
  },
});
```

#### 5.2 Dashboard UI Components

**File: `src/components/analytics/bot-metrics.tsx` (new file)**

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export function BotMetrics({ workspaceId }: { workspaceId: string }) {
  const metrics = useQuery(api.analytics.getBotMetrics, {
    workspace_id: workspaceId,
    date_from: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
  })

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Conversations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_conversations}</div>
        </CardContent>
      </Card>

      {/* Handoffs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Qualified Handoffs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{metrics.handoffs}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round(metrics.conversion_rate * 100)}% conversion
          </p>
        </CardContent>
      </Card>

      {/* Avg Age */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Age (Qualified)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avg_age_qualified}</div>
          <p className="text-xs text-muted-foreground">years old</p>
        </CardContent>
      </Card>

      {/* Community Fallbacks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Community Fallbacks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{metrics.community_fallbacks}</div>
        </CardContent>
      </Card>

      {/* Objection Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Objection Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(metrics.objection_breakdown).map(([objection, count]) => (
              <div key={objection} className="flex justify-between">
                <span className="capitalize">{objection.replace('_', ' ')}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Document Distribution (Qualified Leads)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(metrics.document_distribution).map(([count, num]) => (
              <div key={count} className="flex justify-between">
                <span>{count} documents</span>
                <span className="font-bold">{num} leads</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Testing Checklist

### Manual Testing Scenarios

| Scenario | Expected Behavior | Status |
|----------|------------------|--------|
| **New message arrives** | Bot greets within 24h window | ☐ |
| **User provides age + all 4 docs** | Bot marks qualified, handoff | ☐ |
| **User provides age + 2 docs (inc. English)** | Bot marks qualified, handoff | ☐ |
| **User provides 1 doc only** | Bot asks questions, offers consultation | ☐ |
| **User asks "how much?"** | Bot answers from KB, then offers consultation | ☐ |
| **User says yes to consultation** | Bot marks for handoff | ☐ |
| **User says no to consultation** | Bot offers community, captures objection | ☐ |
| **Objection: "price"** | Bot circles back once, tries to overcome | ☐ |
| **Objection: "no money"** | Bot respects, offers community | ☐ |
| **User says no twice** | Bot accepts, offers community, stops | ☐ |
| **User changes mind after circle back** | Bot marks for handoff | ☐ |

### Edge Cases

| Edge Case | Expected Behavior | Status |
|----------|------------------|--------|
| User doesn't provide age | Bot asks again gently | ☐ |
| User provides invalid age | Bot clarifies, asks again | ☐ |
| User says "I don't have any docs yet" | Bot offers community, stays friendly | ☐ |
| User asks question not in KB | Bot answers generally, offers consultation | ☐ |
| User wants consultation but no docs | Bot accepts, marks for handoff (consultation interest = key) | ☐ |
| User is rude/abusive | Bot stays professional, offers community | ☐ |
| Multiple messages in quick succession | Bot handles each in context, doesn't break | ☐ |

---

## Cost Analysis

### ARI Costs (Grok API)

**Per Conversation (qualified):**
- Mouth: ~150 tokens × 6 exchanges = 900 tokens
- Brain: ~500 tokens × 1 analysis = 500 tokens
- **Total:** ~1400 tokens

**Per Conversation (not qualified, more Q&A):**
- Mouth: ~150 tokens × 10 exchanges = 1500 tokens
- Brain: ~500 tokens × 1 analysis = 500 tokens
- **Total:** ~2000 tokens

**Monthly Cost (1000 conversations):**
- 700 qualified @ 1400 tokens = 980K tokens
- 300 not qualified @ 2000 tokens = 600K tokens
- **Total:** 1.58M tokens × $5/1M = **~$7.90/month**

**Value:**
- Each qualified lead = ~$200-500 potential revenue
- $7.90 cost = **98.7% profit margin** (if lead worth $200)

---

## Timeline Summary

| Week | Tasks | Deliverables |
|------|-------|--------------|
| **1** | Update context schema, helper functions | `context.ts` updated with new types |
| **2** | Implement qualification mutations | `ari.ts` with new mutations |
| **2** | Update Mouth prompts for all stages | `mouth.ts` with state-specific prompts |
| **3** | Seed knowledge base entries | 20+ FAQ entries in database |
| **3** | Implement KB search integration | Q&A uses KB data |
| **3** | Create analytics queries | `analytics.ts` with metrics |
| **4** | Build dashboard UI components | `bot-metrics.tsx` |
| **4** | Test all conversation flows | Manual testing checklist complete |
| **4** | Deploy and monitor | Production rollout |

---

## Success Metrics

### Bot Performance

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Response Time** | < 5 seconds | Average from message to bot response |
| **Conversation to Handoff** | < 10 minutes | Time from greeting to qualified handoff |
| **Qualified Lead Rate** | > 30% | Handoffs / Total conversations |
| **Community Fallback Rate** | < 40% | Should aim for high qualification rate |
| **User Satisfaction** | N/A | Monitor via follow-up feedback |

### Business Impact

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Lead Quality** | > 70% conversion to paid | Qualified leads who become customers |
| **Data Capture** | > 90% complete | Age + documents captured for 90% of conversations |
| **Objection Insights** | 100% captured | All objections tracked and categorized |
| **Product Iteration** | Quarterly | Use objection data to improve offering |

---

## Key Takeaways

### Why ARI Is The Right Choice

1. ✅ **10-stage conversation** - Perfect for ARI's state machine
2. ✅ **Data capture requirements** - Context storage built-in
3. ✅ **Complex qualification logic** - Custom code needed
4. ✅ **Objection handling** - AI-powered, not rigid rules
5. ✅ **Analytics focus** - Track rejections, improve product

### What You're Building

**Not just a chatbot** - It's a:
- **Data collection engine** (age, docs, objections)
- **Lead qualification system** (multi-factor logic)
- **Product feedback loop** (objections → insights)
- **Consultation booking funnel** (route to humans)

### The Business Value

**Data you'll capture:**
- Age distribution of leads
- Document readiness by age group
- Most common objections (price, timing, etc.)
- Qualification paths that work best
- Conversion bottlenecks

**How it helps product:**
- Identify pricing objections → Offer payment plans
- See timing objections → Create urgency campaigns
- Track document gaps → Create resources to help
- Understand rejection patterns → Improve qualification criteria

---

*Document version: 1.0*
*Last updated: January 29, 2025*
*ARI Bot Specification for University Counseling Use Case*
