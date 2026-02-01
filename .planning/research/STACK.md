# Stack Research: Kapso Workflow Integration

**Domain:** WhatsApp workflow automation and message event processing
**Researched:** 2026-02-01
**Confidence:** HIGH

## Executive Summary

Kapso provides WhatsApp messaging infrastructure but **workflow configurations are NOT editable via API** — they must be managed manually through the Kapso Dashboard. The platform excels at message transport and webhook delivery but has intentional limitations on programmatic workflow modification.

**Critical finding:** Based on existing codebase evidence and documentation analysis, Kapso workflows are created and edited via Dashboard UI, not API. The milestone's goal of "workflow management UI (edit Kapso workflows from dashboard)" conflicts with Kapso's architecture.

**Recommended approach:** Build workflow configuration UI that generates instructions for manual Kapso Dashboard setup, not direct API integration. Automate what Kapso exposes (message handling, contact management) and provide guided workflow setup for what it doesn't (prompt editing, trigger configuration).

## Recommended Stack

### Core Integration Points

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Kapso Webhook API | v24.0 | Inbound message delivery | Already integrated and proven (v2.0 production), delivers message events with conversation context |
| Kapso REST API | v1 | Send messages, list conversations | Existing custom client (`src/lib/kapso-client.ts`) handles conversations, contacts, messaging |
| Convex HTTP Endpoints | Production | Webhook receiver + state storage | Already receiving webhooks at `/webhook/kapso`, stores all message data in Convex tables |
| Next.js API Routes | 15 | Proxy layer for Kapso calls | Existing routes at `/api/kapso/conversations`, `/api/kapso/send` handle auth + CORS |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@kapso/whatsapp-cloud-api` | Latest | TypeScript SDK for WhatsApp Cloud API | If migrating from custom client to official SDK (currently using custom client) |
| Zod | Latest | Validate webhook payloads | Add schema validation before processing webhook data (currently using `v.any()`) |

### What Kapso DOES Provide

| Capability | API Endpoint | Current Usage | Notes |
|------------|--------------|---------------|-------|
| Message webhooks | POST to your endpoint | ✅ Active at `https://intent-otter-212.convex.cloud/webhook/kapso` | Delivers `{ message, conversation, phone_number_id }` payload |
| Send messages | POST `/projects/{id}/conversations/{id}/messages` | ✅ Via custom KapsoClient | Supports text, templates, media |
| List conversations | GET `/projects/{id}/conversations` | ✅ Via `/api/kapso/conversations` route | Returns conversation metadata, status, timestamps |
| Get messages | GET `/projects/{id}/conversations/{id}/messages` | ✅ Via KapsoClient.getMessages() | Paginated message history |
| Contact management | GET/PATCH `/projects/{id}/contacts` | ⚠️ Partially implemented | SDK supports customerId filtering |

### What Kapso DOES NOT Provide

| Feature | Why Not Available | Workaround |
|---------|-------------------|------------|
| Edit workflow prompts via API | Workflows are UI-configured assets | Generate setup instructions, user applies manually in Dashboard |
| Update AI model selection via API | Model config tied to workflow nodes | Provide dropdown of recommended models, user selects in Dashboard |
| Modify trigger conditions via API | Trigger logic is workflow structure | Export workflow JSON spec, user imports in Dashboard |
| Retrieve workflow metadata via API | No `GET /workflows` endpoint found | Store workflow IDs in Convex, reference in UI |

## Installation

```bash
# Already installed (no new packages needed)
# Existing stack handles all available Kapso capabilities

# Optional: If migrating to official SDK
npm install @kapso/whatsapp-cloud-api

# Recommended: Add webhook validation
npm install zod
```

## Architecture Integration

### Current Kapso Integration Flow

```
Inbound WhatsApp Message
         ↓
Kapso Workflow Execution
         ↓
Webhook POST → Convex HTTP endpoint
         ↓
processWebhook (internalMutation)
         ↓
Creates/updates: contacts, conversations, messages
         ↓
Dashboard real-time sync (Convex subscriptions)
```

### Webhook Payload Structure

**Kapso v2 format** (currently used):
```typescript
{
  "message": {
    "id": "wamid.xxx",
    "from": "628139250849",
    "type": "text" | "image" | "video" | "document",
    "text": { "body": "message content" },
    "timestamp": "1706774400"
  },
  "conversation": {
    "id": "kapso-conv-id",
    "phone_number": "628139250849",
    "status": "active" | "ended",
    "last_active_at": "2026-02-01T10:00:00Z"
  },
  "phone_number_id": "957104384162113"
}
```

**Processing flow** (`convex/kapso.ts` lines 90-200):
1. Webhook receives payload
2. Find workspace by `phone_number_id`
3. Normalize phone number (strip non-digits)
4. Create/update contact record
5. Create/update conversation record
6. Store message with metadata
7. Return 200 OK (< 500ms response time)

### Workflow Configuration Storage

**Current approach** (`.kapso-project.env`):
```bash
KAPSO_PROJECT_ID=1fda0f3d-a913-4a82-bc1f-a07e1cb5213c
KAPSO_WORKFLOW_ID=6cae069e-7d5c-4fbb-834d-79e1f66e4672
KAPSO_WORKFLOW_NAME=Rules Engine - Keyword Triggers
KAPSO_TRIGGER_ID=bdf48a18-4c39-453a-8a81-e7d14a18fe35
```

**Where workflows are actually configured:**
- Workflow nodes: Kapso Dashboard UI (manual)
- AI prompts: Embedded in Function nodes (manual)
- Trigger conditions: AI Decide node config (manual)
- Environment variables: Workflow settings panel (manual)

**Evidence from codebase:**
- Phase 3 documentation: "Status: BLOCKED - Kapso API authentication failing" + "Workaround: Manual setup via Kapso Dashboard"
- KAPSO-DASHBOARD-SETUP.md: 13-step manual workflow creation guide
- No `PUT /workflows` or `PATCH /workflows` API calls in codebase
- Existing workflows (Sarah, Brain) created via Dashboard, not API

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Manual workflow setup with UI guidance | Kapso API workflow management | If Kapso adds workflow API endpoints (not available as of 2026-02-01) |
| Store workflow config in Convex | Store in Kapso metadata fields | If workflow config needs to be queryable from dashboard (current approach) |
| Custom KapsoClient | `@kapso/whatsapp-cloud-api` SDK | If standardizing on official SDK vs custom implementation |
| Webhook to Convex HTTP | Kapso Function nodes calling Convex | Already using webhook pattern (proven, working) |

## What NOT to Build

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Direct workflow API integration | Kapso doesn't expose workflow edit endpoints | UI that generates setup instructions + workflow JSON templates |
| Custom webhook delivery system | Kapso handles this reliably | Use existing `/webhook/kapso` endpoint |
| Polling for new messages | Webhooks push messages instantly | Keep webhook-driven architecture |
| Custom WhatsApp media hosting | Kapso provides media URLs | Use `fetchMediaUrl()` helper (already in codebase) |
| Workflow node execution engine | Kapso executes workflows | Call workflows via message sending, let Kapso handle execution |

## Integration Patterns

### Pattern 1: Webhook-Driven Lead Creation

**Current implementation** (milestone requirement: "Automatically create/update leads on every WhatsApp message"):

Already working in `convex/kapso.ts`:
```typescript
export const processWebhook = internalMutation({
  handler: async (ctx, args) => {
    // 1. Extract phone from webhook
    const phone = message.from || conversation?.phone_number;
    const normalized = phone.replace(/\D/g, "");

    // 2. Find or create contact (deduped by phone)
    let contact = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", workspaceId).eq("phone", normalized)
      )
      .first();

    if (!contact) {
      const contactId = await ctx.db.insert("contacts", {
        workspace_id: workspaceId,
        phone: normalized,
        name: contactName || kapsoName || "Unknown",
        created_at: now,
        // ... other fields
      });
      contact = await ctx.db.get(contactId);
    }

    // 3. Update last activity
    await ctx.db.patch(contact._id, {
      lastActivityAt: now,
      updated_at: now,
    });
  }
});
```

**No changes needed** — lead creation already happens automatically on every message.

### Pattern 2: Workflow Settings UI (New Milestone Feature)

**What CAN be built:**
```typescript
// Convex schema addition
defineTable("workflowSettings", {
  workspace_id: v.id("workspaces"),
  workflow_type: v.string(), // "sarah" | "brain" | "rules_engine"
  config: v.object({
    // User-editable fields
    ai_model: v.string(), // "gemini-2.5-flash" | "grok-4.1-fast"
    system_prompt: v.string(),
    temperature: v.number(),
    max_tokens: v.number(),
    // Workflow-specific
    keywords: v.optional(v.array(v.string())),
    auto_reply_templates: v.optional(v.object({})),
  }),
  kapso_workflow_id: v.string(), // Reference to Kapso workflow
  kapso_workflow_name: v.string(),
  last_synced_at: v.number(),
  sync_status: v.string(), // "manual_setup_required" | "synced"
})
```

**UI flow:**
1. User edits settings in my21staff dashboard
2. System saves to Convex `workflowSettings` table
3. UI shows "Sync to Kapso" button with status
4. On click: Generate workflow JSON + show copy-paste instructions
5. User applies changes in Kapso Dashboard
6. User clicks "I've updated Kapso" → mark as synced

**What CANNOT be built:**
- Automatic sync from my21staff to Kapso (no API)
- Fetch current Kapso workflow config (no API)
- Validate settings match Kapso state (no API)

### Pattern 3: Daily Activity Summaries (New Milestone Feature)

**Implementation approach:**
```typescript
// Convex scheduled function (runs daily)
export const generateDailyActivitySummary = internalAction({
  handler: async (ctx, args) => {
    const workspaces = await ctx.runQuery(api.workspaces.listActive);

    for (const workspace of workspaces) {
      // 1. Query messages from last 24h
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      const messages = await ctx.runQuery(api.messages.getByWorkspace, {
        workspaceId: workspace._id,
        since: yesterday,
      });

      // 2. Generate summary (use Grok Brain bot)
      const summary = await generateSummaryWithGrok({
        messages,
        workspace,
      });

      // 3. Create lead note with summary
      await ctx.runMutation(api.leads.addNote, {
        workspaceId: workspace._id,
        noteType: "daily_summary",
        content: summary,
        metadata: {
          message_count: messages.length,
          date: new Date().toISOString().split('T')[0],
        },
      });
    }
  }
});
```

**Trigger mechanism:**
- Option 1: Convex cron (if available)
- Option 2: Vercel cron calling Convex HTTP endpoint
- Option 3: User-initiated from dashboard "Generate Summary" button

## Rate Limits & Quotas

**Known from codebase + Kapso behavior:**
- Webhook delivery: No rate limit (push-based)
- Message sending: Not documented, but tested at ~10 msg/second in production
- API calls: 429 responses observed, retry with exponential backoff recommended

**Recommendations:**
```typescript
// Add to KapsoClient
private async requestWithRetry<T>(
  endpoint: string,
  options?: RequestInit,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15 | Kapso webhook delivery | No issues (standard HTTP POST) |
| Convex HTTP routes | Kapso v2 payload format | Already handling in production |
| Custom KapsoClient | Kapso API v1 endpoints | Working in production (`api.kapso.so/v1`) |
| `@kapso/whatsapp-cloud-api` | Kapso proxy endpoints | Not yet tested, SDK is optional |

## Migration Path (If Needed)

**Current custom client → Official SDK:**
```typescript
// Before (custom)
const client = new KapsoClient({
  apiKey: settings.kapso_api_key,
  projectId: workspaceId
});
const conversations = await client.listConversations();

// After (official SDK)
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';
const client = new WhatsAppClient({
  baseUrl: 'https://api.kapso.ai/meta/whatsapp',
  kapsoApiKey: settings.kapso_api_key,
});
const result = await client.conversations.list({ projectId: workspaceId });
```

**When to migrate:**
- Official SDK adds features not in custom client
- Need WhatsApp Cloud API parity (templates, flows)
- Kapso deprecates v1 API endpoints

**When to keep custom client:**
- Current implementation works reliably
- No new features needed from SDK
- Migration effort not justified by benefits

## Sources

**HIGH Confidence:**
- [Kapso TypeScript SDK](https://www.npmjs.com/package/@kapso/whatsapp-cloud-api) — Official SDK documentation, API methods
- [Kapso API & Webhooks](https://docs.kapso.ai/docs/integrations/api-webhooks) — Webhook events, message buffering
- Existing codebase: `convex/kapso.ts`, `src/lib/kapso-client.ts`, `.kapso-project.env` — Production implementation evidence
- Phase 3 documentation: `.planning/phases/03-sarah-chat-bot/KAPSO-DASHBOARD-SETUP.md` — 13-step manual workflow setup guide

**MEDIUM Confidence:**
- [Kapso Quickstart](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/introduction) — SDK initialization patterns
- Web search results: Kapso workflow management 2026 — Confirmed no programmatic workflow editing

**LOW Confidence:**
- Workflow API endpoints — Not found in documentation or codebase (absence of evidence)
- Rate limit specifics — Not documented, inferred from 429 responses

**Evidence of API limitations:**
1. Phase 3 RESEARCH.md states: "Status: BLOCKED - Kapso API authentication failing" with "Workaround: Manual setup via Kapso Dashboard"
2. KAPSO-DASHBOARD-SETUP.md provides 13-step manual workflow creation guide
3. No `PUT /workflows`, `PATCH /workflows`, or `GET /workflows` calls in entire codebase
4. Workflow JSON files (`.planning/phases/*/kapso-*-workflow.json`) are documentation, not API payloads
5. Web search for "Kapso API workflows update configuration" returns only metadata update endpoint (name/category), not node/prompt editing

---

*Stack research for: Kapso workflow integration and message automation*
*Researched: 2026-02-01*
*Valid for: v2.0.1 milestone planning*
