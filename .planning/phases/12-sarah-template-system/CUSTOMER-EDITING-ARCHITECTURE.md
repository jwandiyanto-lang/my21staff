# Customer-Side Sarah Bot Editing Architecture

**Created:** 2026-02-01
**Context:** Phase 12 (Sarah Template System) - SARAH-04, SARAH-05
**Question:** How will customers (SMEs using my21staff) customize Sarah bot?

---

## Problem Statement

The my21staff platform now has a production-ready Sarah bot for lead qualification. We need to enable **customers** (business owners who sign up for my21staff) to:

1. Customize Sarah's persona (tone, language, pronouns)
2. Modify conversation flow (slot questions, order)
3. Adjust qualification criteria (pain keywords, handoff triggers)
4. Set closing strategies (trial link URL, custom offers)
5. Duplicate Sarah bot for different use cases (sales vs support)

**Key constraint:** Customers are non-technical SME owners who won't use CLI or API directly.

---

## Architecture Options

### Option 1: Multi-Tenant Kapso (Each Customer = Separate Kapso Project)

**How it works:**
- Each my21staff customer gets their own Kapso project
- Customer accesses Kapso Dashboard directly via embedded iframe or redirect
- Sarah workflow template duplicated to customer's Kapso project on signup
- Customer edits workflow graph in Kapso UI

**Pros:**
- ✅ Full isolation between customers
- ✅ Customers get native Kapso workflow editing UI
- ✅ No custom UI needed (leverage Kapso's existing UX)
- ✅ Kapso handles versioning, rollback, execution logs

**Cons:**
- ❌ Expensive (Kapso pricing per project - need to verify cost model)
- ❌ Complex onboarding (customer needs Kapso account + my21staff account)
- ❌ Hard to enforce brand consistency across customer bots
- ❌ No central visibility into customer bot performance
- ❌ Difficult to push Sarah updates to all customers

**Cost estimate:** Unknown - need to check Kapso pricing for multi-project usage

**Recommended for:** Enterprise plans only (if Kapso pricing allows)

---

### Option 2: Single Kapso Project with Customer Configuration Layer

**How it works:**
- All customers share single my21staff Kapso project
- Sarah workflow uses dynamic configuration pulled from Convex database
- Build custom UI in my21staff dashboard for bot editing
- Configuration stored as JSON per workspace in Convex
- Kapso workflow fetches config at runtime via API call

**Example Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ my21staff Dashboard (Next.js)                           │
│                                                          │
│  [Sarah Bot Settings Page]                              │
│   ├─ Persona Editor (tone, language, pronouns)          │
│   ├─ Slot Questions Editor (drag-and-drop reorder)      │
│   ├─ Keywords Editor (pain triggers, handoff phrases)   │
│   └─ Closing Strategy (trial link, custom message)      │
│                                                          │
│  On Save: Update Convex record                          │
│  ↓                                                       │
│  workspaces/{workspace_id}/sarah_config                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Convex Database                                         │
│                                                          │
│  sarahConfigs table:                                    │
│  {                                                       │
│    workspace_id: "ws_123",                              │
│    persona: {                                            │
│      name: "Sarah",                                      │
│      pronoun: "Kamu",                                    │
│      tone: "professional",                               │
│      max_chars: 140,                                     │
│      language: "id"                                      │
│    },                                                    │
│    slots: [                                              │
│      { id: "name", question_id: "Boleh tau nama?" },    │
│      { id: "business_type", question_id: "Bidang apa?" }│
│    ],                                                    │
│    handoff_keywords: ["human", "manusia", "sales"],     │
│    trial_link: "https://my21staff.com/demo"             │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Kapso Workflow (Single Shared Instance)                │
│                                                          │
│  [start] → [load-config function]                       │
│             ↓                                            │
│             Fetch config from Convex API                │
│             workspace_id from context.whatsapp.profile  │
│             ↓                                            │
│          [sarah_agent]                                  │
│             system_prompt: Templated with {{vars}}      │
│             Uses: vars.persona, vars.slots, etc.        │
│             ↓                                            │
│          [send_trial_link]                              │
│             message: Uses vars.trial_link               │
└─────────────────────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Create Convex Schema:**
   ```typescript
   // convex/schema.ts
   sarahConfigs: defineTable({
     workspace_id: v.string(),
     persona: v.object({
       name: v.string(),
       pronoun: v.string(), // "Kamu" or "Anda"
       tone: v.string(),    // "professional", "casual", "friendly"
       max_chars: v.number(),
       language: v.string(), // "id" or "en"
       no_emojis: v.boolean()
     }),
     slots: v.array(v.object({
       id: v.string(),      // "name", "business_type"
       question_id: v.string(),
       question_en: v.string(),
       order: v.number(),
       required: v.boolean()
     })),
     pain_keywords: v.array(v.string()),
     handoff_keywords: v.array(v.string()),
     closing: v.object({
       strategy: v.string(), // "if_i_will_you", "direct_ask"
       trial_link: v.string(),
       custom_message_id: v.optional(v.string()),
       custom_message_en: v.optional(v.string())
     }),
     created_at: v.number(),
     updated_at: v.number()
   }).index("by_workspace", ["workspace_id"])
   ```

2. **Build Settings UI in Dashboard:**
   ```
   src/app/[workspace]/settings/sarah/page.tsx

   Components:
   - PersonaEditor: Edit name, pronoun, tone, char limit
   - SlotEditor: Drag-and-drop slot reordering, edit questions
   - KeywordsEditor: Add/remove pain and handoff keywords
   - ClosingEditor: Edit trial link and closing message
   - PreviewPanel: Live preview of Sarah's behavior
   ```

3. **Update Kapso Workflow:**
   ```javascript
   // Add load-config function node BEFORE sarah_agent

   async function handler(request, env) {
     const { context } = await request.json();
     const workspace_id = context.whatsapp.profile.workspace_id;

     // Fetch config from Convex
     const config = await fetch(
       `https://intent-otter-212.convex.cloud/sarah/config?workspace_id=${workspace_id}`
     ).then(r => r.json());

     // Build dynamic system prompt
     const system_prompt = buildPrompt(config);

     return new Response(JSON.stringify({
       vars: {
         system_prompt,
         trial_link: config.closing.trial_link,
         persona: config.persona,
         slots: config.slots
       }
     }));
   }
   ```

4. **Make Agent Node Use Dynamic Prompt:**
   ```
   sarah_agent node config:
   {
     "system_prompt": "{{vars.system_prompt}}",
     "provider_model_id": "882b9077-896e-473c-9fc0-d7af9ae0b093",
     ...
   }
   ```

**Pros:**
- ✅ Cost-effective (single Kapso project for all customers)
- ✅ Central control over Sarah behavior and updates
- ✅ Custom UI tailored for non-technical users
- ✅ Easy to track customer bot performance (single dashboard)
- ✅ Can push Sarah updates to all customers instantly

**Cons:**
- ❌ Need to build custom UI (development effort)
- ❌ Limited to configuration options we expose (less flexible than Option 1)
- ❌ All customers share same Kapso execution environment (potential scaling issues)
- ❌ Need to carefully handle workspace_id routing to prevent cross-customer data leaks

**Cost estimate:**
- Development: ~40 hours (UI + Convex schema + workflow update)
- Kapso: Single project cost (current rate)

**Recommended for:** Standard and Pro plans (most customers)

---

### Option 3: Hybrid Template Duplication + Configuration Layer

**How it works:**
- Default: Customers use Option 2 (shared Kapso project with config layer)
- Enterprise customers can opt into Option 1 (dedicated Kapso project)
- Use Kapso Platform API to duplicate Sarah template to customer's project
- my21staff dashboard shows different UI based on customer plan

**Pros:**
- ✅ Flexibility for different customer tiers
- ✅ Enterprise customers get full control
- ✅ Standard customers get simple config UI

**Cons:**
- ❌ Complex to maintain two systems
- ❌ Need API automation for template duplication
- ❌ Higher operational overhead

**Cost estimate:**
- Development: ~60 hours (Option 2 + duplication logic)
- Kapso: Variable (single project + per-enterprise projects)

**Recommended for:** If we have clear enterprise demand

---

## Recommendation

**For Phase 12 (Sarah Template System):**

I recommend **Option 2: Single Kapso Project with Customer Configuration Layer**

**Reasons:**

1. **Cost-effective:** Single Kapso project scales for all customers
2. **User-friendly:** Custom UI tailored for non-technical SME owners
3. **Maintainable:** Central control over Sarah behavior and updates
4. **Proven pattern:** Similar to how Intercom, Drift, etc. handle chatbot customization

**Phase 12 Implementation Plan:**

### Task 1: Document Sarah Template (SARAH-04)

Create `business_21/03_bots/Sarah-Template.md` with:
- Default persona configuration (JSON schema)
- Default slot definitions with translations (ID + EN)
- Default pain/handoff keywords
- Default closing strategy
- Configuration reference for developers

### Task 2: Build Configuration Layer (SARAH-05)

**2a. Convex Schema**
- Create `sarahConfigs` table (schema above)
- Create API endpoints: `sarah/config`, `sarah/updateConfig`
- Seed default config on workspace creation

**2b. Kapso Workflow Update**
- Add `load-config` function node before `sarah_agent`
- Update `sarah_agent` to use `{{vars.system_prompt}}`
- Update `send_trial_link` to use `{{vars.trial_link}}`
- Test with multiple workspace_id values

**2c. Dashboard UI**
- Create `/[workspace]/settings/sarah` page
- Build PersonaEditor component
- Build SlotEditor component (with drag-and-drop)
- Build KeywordsEditor component
- Build ClosingEditor component
- Add PreviewPanel for live testing

**2d. Template Duplication Script**
- Create `scripts/duplicate-sarah-workflow.mjs` (kapso-automation skill)
- For future use when we expand to Option 3

---

## Migration Path

**Phase 12 (Current Milestone v2.0.1):**
- Implement Option 2 for all customers
- Document template for future use

**Phase 14+ (Future Milestone v2.1 or v3.0):**
- Add Option 1 for Enterprise tier (if demand exists)
- Build self-service template marketplace

---

## Testing Strategy

**For Phase 13 (Production Validation):**

1. **Create test workspace in Convex**
2. **Configure custom Sarah settings:**
   - Change pronoun to "Anda"
   - Reorder slots (business_type → name → location)
   - Add custom pain keyword "susah"
   - Change trial link to custom URL
3. **Send test messages to +62 813-1859-025**
4. **Verify Sarah uses custom configuration**
5. **Switch back to default config**
6. **Verify Sarah reverts to original behavior**

---

## Security Considerations

**Workspace Isolation:**
- Always derive `workspace_id` from authenticated context (Clerk user → organization)
- Never trust `workspace_id` from request body
- Validate customer can only edit their own workspace config

**Configuration Validation:**
- Sanitize custom questions (prevent XSS in prompt injection)
- Validate trial link URLs (whitelist domains)
- Limit handoff keywords (max 20 keywords, max 50 chars each)
- Validate persona fields (max_chars between 50-200)

**Rate Limiting:**
- Limit config updates to 10 per hour per workspace
- Prevent abuse of Convex API calls

---

## Future Enhancements (Post-v2.0.1)

1. **A/B Testing:** Allow customers to test multiple Sarah configurations
2. **Template Marketplace:** Pre-built Sarah templates for different industries
3. **Analytics Dashboard:** Show Sarah performance metrics per config
4. **Version Control:** Allow customers to revert to previous configs
5. **Multi-Language Support:** Auto-translate slot questions to multiple languages

---

## Files to Create

```
.planning/phases/12-sarah-template-system/
├── 12-01-PLAN.md                           # Execution plan
├── CUSTOMER-EDITING-ARCHITECTURE.md        # This document
└── SARAH-TEMPLATE-SPEC.md                  # JSON schema for template

business_21/03_bots/
└── Sarah-Template.md                       # Default template configuration

convex/
├── schema.ts                               # Add sarahConfigs table
└── sarah/
    ├── config.ts                           # Get config endpoint
    └── updateConfig.ts                     # Update config endpoint

src/app/[workspace]/settings/sarah/
├── page.tsx                                # Main settings page
└── components/
    ├── PersonaEditor.tsx
    ├── SlotEditor.tsx
    ├── KeywordsEditor.tsx
    ├── ClosingEditor.tsx
    └── PreviewPanel.tsx

.claude/skills/kapso-automation/scripts/
└── duplicate-sarah-workflow.mjs            # Future template duplication
```

---

## User Decisions (2026-02-01)

✅ **APPROVED: Option 2 - Single Kapso Project with Configuration Layer**

**Clarifications:**

1. **Pricing model:** Available on ALL plans (Standard, Pro, Enterprise)
2. **UI complexity:** START SIMPLE - 3-4 basic settings:
   - Bot name (customizable, default "Your Intern")
   - Language (Indonesian/English)
   - Pronoun (Kamu/Anda)
   - Trial link URL
3. **UI location:** Integrate into existing "Your team" tab (`/[workspace]/team`)
4. **Bot naming:** "Your Intern" is the default name, fully customizable by customer
5. **Enterprise demand:** Not applicable for v2.0.1

**UI Integration:**

Add new Card section in `/[workspace]/team` page:
```
[Team Management Header]

[Card: Your AI Team]           ← NEW
├─ Bot name input
├─ Language selector
├─ Pronoun selector
└─ Trial link input

[Card: Team Members]            ← EXISTING
└─ Clerk OrganizationProfile
```

---

**Next Step:**

Proceeding to `/gsd:plan-phase 12` with simplified scope.
