# Sarah Bot - Handoff to Human Sales

## Overview

**Purpose:** Define when and how Sarah notifies human sales team for follow-up.

This is a **notification-only handoff**. Sarah does NOT transfer the conversation - she sends a structured notification to the sales team with all context, then continues nurturing if needed.

---

## Universal Handoff Triggers

These triggers apply across **ALL phases** (A, B, C, D).

| Trigger Type | Keywords/Signals (ID) | Keywords/Signals (EN) | Tag |
|--------------|----------------------|----------------------|-----|
| **Explicit Request** | "sales", "konsultan", "human", "manusia", "operator" | "sales", "consultant", "human", "person", "operator" | `user_requested` |
| **Pricing Deep Dive** | "detail harga", "biaya setup", "quote" | "pricing details", "setup cost", "quote" | `pricing_inquiry` |
| **Demo Request** | "demo", "coba", "trial", "test" | "demo", "try", "trial", "test drive" | `demo_request` |
| **Technical Question** | "API", "integration", "cara setup", "onboarding" | "API", "integration", "how to setup", "onboarding" | `technical_question` |
| **Competitor Mention** | "bandingkan", "vs [tool]", "bedanya apa" | "compare with", "vs [tool]", "what's the difference" | `competitor_comparison` |
| **Urgency Signal** | "urgent", "emergency", "butuh sekarang" | "urgent", "emergency", "need it now" | `urgent_lead` |
| **Decision Maker** | "owner", "CEO", "founder", "aku yang putuskan" | "I'm the owner", "CEO", "founder", "I decide" | `decision_maker_confirmed` |
| **Buying Signal** | "mau beli", "siap signup", "how to pay" | "ready to buy", "want to signup", "how to pay" | `buying_signal` |

---

## Phase-Specific Triggers

### Phase 1: Greeting & Gathering

**Immediate Handoff If:**
- User explicitly asks for sales/human
- User says they're ready to buy/signup
- User mentions urgent/emergency problem

**Continue Gathering If:**
- User is just browsing
- User answers questions normally
- No urgency signals detected

---

### Phase 2: Interest Discovery

**Handoff If:**
- User requests pricing details (after showing interest)
- User asks for demo
- User mentions they have budget approval
- User says they're the decision maker
- User compares with competitor

**Continue to Phase 3 If:**
- User expresses interest but not ready to commit
- User wants to "think about it" → trigger nurturing
- Lead score is warm (40-69)

---

### Phase 3: Closing

**Handoff If:**
- **Positive Close:** User says "yes", "sure", "let's do it", "sip", "siap" to any closing technique
- **After Circle Back:** User engages positively to Pillar 1-5 questions
- **Nurturing Re-engagement:** User responds to any follow-up touch (Touch 2-6)
- **Lead Score ≥ 70:** Hot lead regardless of response

**Continue Nurturing If:**
- User says "think about it" → enter follow-up sequence
- User doesn't respond to Touch 1 → wait for Touch 2 (24h)

---

## Lead Score Thresholds

| Score Range | Temperature | Handoff Action | Suggested Response |
|-------------|-------------|----------------|-------------------|
| **70-100** | HOT | ✅ Immediate handoff | Reply within 15 minutes |
| **40-69** | WARM | ✅ Handoff if explicit request | Reply within 2 hours |
| **0-39** | COLD | ❌ No handoff | Marketing list only |

---

## Handoff Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SENDS MESSAGE                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Universal Triggers?  │
                │  (sales/demo/pricing) │
                └───────────────────────┘
                     │              │
                    YES            NO
                     │              │
                     ▼              ▼
            ┌──────────────┐   ┌─────────────────┐
            │   HANDOFF    │   │ Check Lead Score │
            │  (user tag)  │   └─────────────────┘
            └──────────────┘         │
                                ┌────┴────┐
                                ▼         ▼
                          Score ≥70?  Score <70
                               │         │
                              YES       NO
                               │         │
                               ▼         ▼
                    ┌──────────────┐  ┌──────────────┐
                    │   HANDOFF    │  │ No Handoff   │
                    │ (hot lead)   │  │ Continue Bot  │
                    └──────────────┘  └──────────────┘
```

---

## Handoff Notification Schema

### What Gets Sent to Sales Team

```typescript
interface HandoffNotification {
  // === CONTACT INFO ===
  contact_phone: string;        // WhatsApp number
  contact_name?: string;        // From Phase 1
  domisili?: string;            // From Phase 1

  // === BUSINESS CONTEXT ===
  business_type?: string;       // From Phase 1
  business_duration?: string;   // From Phase 1
  team_size?: number;           // From Phase 1

  // === PAIN POINTS & INTEREST ===
  pain_points?: string[];       // From Phase 2
  main_interest?: string;       // From Phase 2
  priority?: string;            // From Phase 2

  // === LEAD SCORING ===
  lead_score: number;           // 0-100
  lead_temperature: 'hot' | 'warm' | 'lukewarm' | 'cold';
  urgency_level: 'high' | 'medium' | 'low';

  // === HANDOFF CONTEXT ===
  handoff_triggered_at: Date;
  handoff_reason: string;       // e.g., "user_requested", "demo_request", "hot_lead_auto"
  handoff_phase: 'phase1' | 'phase2' | 'phase3' | 'nurturing';

  // === CLOSING JOURNEY (Phase 3 only) ===
  closing_technique_used?: 'assumptive' | 'summary' | 'scarcity' | 'self-service';
  objection_raised?: string;    // What they objected to
  circle_back_pillar?: number;  // Which pillar was used
  follow_up_touch?: number;     // Which touch re-engaged them

  // === CONVERSATION ===
  transcript: string[];         // Full chat history
  language: 'id' | 'en';

  // === SUGGESTED ACTION ===
  suggested_action: 'call_immediately' | 'send_demo_link' | 'reply_within_15min' | 'reply_within_2hr';
  message_to_user?: string;     // What user last saw

  // === METADATA ===
  conversation_started_at: Date;
  message_count: number;
}
```

---

## Action Guidelines for Human Sales

| Suggested Action | When to Use | Response SLA | What to Do |
|-----------------|-------------|--------------|------------|
| **call_immediately** | Hot lead + urgent signal | Call within 15 min | Phone call + WhatsApp |
| **send_demo_link** | Demo request | Send within 15 min | WhatsApp demo link + calendar invite |
| **reply_within_15min** | Hot lead, buying signal | Reply within 15 min | WhatsApp message to continue conversation |
| **reply_within_2hr** | Warm lead, technical Q | Reply within 2 hours | WhatsApp with answer/clarification |

---

## Handoff Message Templates

### What Sarah Says to User (Before Notification)

**For Hot Lead (Immediate):**
```
Indonesian: "Sip! Data sudah saya catat. Konsultan kami akan hubungi dalam 15 menit ya."
English: "Great! I've recorded your info. Our consultant will reach out within 15 minutes."
```

**For Demo Request:**
```
Indonesian: "Siapkan! Tim saya akan kirim link demo segera ya."
English: "Got it! My team will send the demo link shortly."
```

**For Warm Lead:**
```
Indonesian: "Oke, tim saya akan follow up ya untuk detail lebih lanjut."
English: "Okay, my team will follow up for more details."
```

---

## Sales Team Response Flow

### 1. Receive Notification

Sales team gets notification via:
- **Kapso Webhook** → Convex database
- **Email notification** (optional backup)
- **Dashboard alert** (if built)

### 2. Review Context

Read the `HandoffNotification` to understand:
- Who they are (name, business, location)
- What they want (pain points, interest)
- How hot they are (lead score, temperature)
- What triggered handoff (reason)

### 3. Take Action

Follow `suggested_action`:
- `call_immediately` → Call + WhatsApp
- `send_demo_link` → Share Calendly/demo link
- `reply_within_15min` → Continue conversation in WhatsApp
- `reply_within_2hr` → Answer question + offer to continue

### 4. Update Status

After human engages:
- Update `contact.lead_status` to `human_engaged`
- Tag with `sales_team_member` (who handled)
- Track outcome in Convex

---

## Technical Implementation

### Kapso Workflow Setup

**Trigger:** Sarah Agent Node output

**Function Node:** Detect handoff trigger

```javascript
// In Kapso Function Node
function shouldHandoff(conversationState, userMessage) {
  const triggers = {
    explicit: /sales|konsultan|human|manusia|consultant|operator/i,
    demo: /demo|coba|trial|test/i,
    pricing: /harga|pricing|biaya|cost|quote/i,
    urgent: /urgent|emergency|butuh sekarang|immediately/i,
    buying: /mau beli|ready to buy|signup|how to pay/i
  };

  for (const [type, pattern] of Object.entries(triggers)) {
    if (pattern.test(userMessage)) {
      return {
        shouldHandoff: true,
        reason: `${type}_triggered`,
        suggestedAction: getSuggestedAction(type, conversationState.lead_score)
      };
    }
  }

  // Check lead score
  if (conversationState.lead_score >= 70) {
    return {
      shouldHandoff: true,
      reason: 'hot_lead_auto',
      suggestedAction: 'reply_within_15min'
    };
  }

  return { shouldHandoff: false };
}

function getSuggestedAction(triggerType, leadScore) {
  if (triggerType === 'urgent' || leadScore >= 90) return 'call_immediately';
  if (triggerType === 'demo') return 'send_demo_link';
  if (leadScore >= 70) return 'reply_within_15min';
  return 'reply_within_2hr';
}
```

**Webhook Node:** Send to Convex

```javascript
// Kapso Webhook to Convex
{
  "url": "{{env.CONVEX_WEBHOOK_URL}}/handoff",
  "method": "POST",
  "body": {
    "contact_phone": "{{contact.phone}}",
    "handoff_reason": "{{function.reason}}",
    "suggested_action": "{{function.suggestedAction}}",
    "lead_score": "{{conversation.leadScore}}",
    "transcript": "{{conversation.transcript}}",
    // ... other fields
  }
}
```

---

## Convex Data Schema

```typescript
// In Convex schema.ts
schema.defineTable("handoff_notifications", {
  // IDs
  contactPhone: v.string(),
  handoffId: v.id("handoff_notifications"),

  // Trigger info
  handoffReason: v.string(),
  handoffPhase: v.string(),
  suggestedAction: v.string(),

  // Lead data
  leadScore: v.number(),
  leadTemperature: v.string(),
  urgencyLevel: v.string(),

  // Context
  businessType: v.optional(v.string()),
  painPoints: v.optional(v.array(v.string())),
  mainInterest: v.optional(v.string()),
  transcript: v.array(v.string()),
  language: v.string(),

  // Status
  status: v.string(), // "pending", "claimed", "completed", "no_response"
  claimedBy: v.optional(v.string()), // Sales team member
  claimedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  outcome: v.optional(v.string()), // "converted", "not_interested", "follow_up_later"

  // Timestamps
  handoffTriggeredAt: v.number(),
  conversationStartedAt: v.number(),
  messageCount: v.number(),
});
```

---

## Quick Reference

| Scenario | Should Handoff? | Reason | Action |
|----------|----------------|--------|--------|
| User says "sales please" | ✅ YES | Explicit request | Reply 15min |
| Lead score ≥ 70 | ✅ YES | Hot lead | Reply 15min |
| User requests demo | ✅ YES | Buying signal | Send demo link |
| User asks pricing details | ✅ YES | Sales qualified | Reply 15min |
| User responds to nurturing | ✅ YES | Re-engaged | Reply 2hr |
| Technical question | ✅ YES | Needs expert | Reply 2hr |
| Lead score 40-69 + no questions | ❌ NO | Not ready | Continue nurturing |
| Lead score < 40 | ❌ NO | Not qualified | Marketing list |

---

*Document: E-handoff-to-human.md*
*For Sarah Bot Human Sales Integration*
