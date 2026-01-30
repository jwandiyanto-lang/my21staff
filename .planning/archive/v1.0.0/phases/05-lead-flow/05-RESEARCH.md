# Phase 5: Lead Flow - Research

**Researched:** 2026-01-26
**Domain:** Webhook integration, CRM data flow, production verification
**Confidence:** HIGH

## Summary

Phase 5 connects n8n webhook delivery to Convex CRM in production, verifying the complete lead capture pipeline with real data. The existing implementation from Phase 6 (legacy numbering) provides a solid foundation—the HTTP endpoint at `/webhook/n8n` and `createLead` mutation are already deployed. This phase focuses on **production verification** rather than new development.

The standard approach for webhook integration follows a three-layer architecture: HTTP action receives and validates the webhook, mutations handle data persistence with duplicate detection, and contact records flow into the CRM with proper status tracking. The existing code implements all core patterns correctly: workspace resolution by slug, phone normalization to E.164 format, duplicate prevention via indexed queries, and structured metadata storage.

**Primary recommendation:** Verify the existing n8n → Convex integration in production using real Google Form submissions from Eagle Overseas, then validate that leads appear correctly in the Contact Database with proper status transitions from "new" to qualified states.

## Standard Stack

The established libraries/tools for webhook and CRM integration:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex | Current | Backend database + HTTP actions | Real-time sync, built-in HTTP routing, serverless |
| n8n | Current | Workflow automation platform | Visual workflow builder, extensive integrations |
| Convex HTTP Router | Built-in | HTTP endpoint management | Native to Convex, handles routing and actions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Web Crypto API | Built-in | Signature verification (if needed) | Webhook security validation |
| libphonenumber-js | Latest | Phone number validation | Complex international phone parsing (optional) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Convex HTTP | Express/Fastify | More control but requires separate server deployment |
| Custom phone normalization | libphonenumber-js | Library adds bundle size but handles edge cases better |
| n8n | Zapier/Make | n8n is self-hosted, more cost-effective for high volume |

**Installation:**
Already installed. No additional packages required for Phase 5.

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── http.ts              # HTTP routes including /webhook/n8n
├── n8n.ts               # Lead creation mutation
├── contacts.ts          # Contact queries and mutations
└── schema.ts            # Database schema with contacts table
```

### Pattern 1: Three-Layer Webhook Architecture
**What:** Separation of HTTP handling, business logic, and data persistence
**When to use:** All webhook integrations
**Example:**
```typescript
// Layer 1: HTTP Action (http.ts)
http.route({
  path: "/webhook/n8n",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();

    // Resolve workspace by slug
    const workspace = await ctx.runQuery(api.workspaces.getBySlug, {
      slug: "eagle-overseas"
    });

    // Call mutation with resolved workspace
    const result = await ctx.runMutation(api.n8n.createLead, {
      workspace_id: workspace._id,
      ...payload
    });

    return new Response(JSON.stringify(result), { status: 200 });
  })
});

// Layer 2: Business Logic (n8n.ts)
export const createLead = mutation({
  args: { workspace_id, name, phone, email, lead_score, metadata },
  handler: async (ctx, args) => {
    const normalizedPhone = normalizePhone(args.phone);

    // Duplicate detection
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", q =>
        q.eq("workspace_id", workspace_id).eq("phone", normalizedPhone)
      )
      .first();

    if (existing) {
      return { success: true, status: "exists", contact_id: existing._id };
    }

    // Create new contact
    const contactId = await ctx.db.insert("contacts", { ... });
    return { success: true, status: "created", contact_id: contactId };
  }
});

// Layer 3: Data Access (schema.ts)
contacts: defineTable({
  workspace_id: v.id("workspaces"),
  phone: v.string(),
  phone_normalized: v.optional(v.string()),
  lead_status: v.string(),
  metadata: v.optional(v.any()),
  // ...
}).index("by_workspace_phone", ["workspace_id", "phone"])
```
**Source:** [Clerk Webhooks: Data Sync with Convex](https://clerk.com/blog/webhooks-data-sync-convex)

### Pattern 2: Idempotent Lead Creation
**What:** Duplicate detection prevents creating the same lead twice
**When to use:** All webhook endpoints (webhooks may retry on failure)
**Example:**
```typescript
// Check for existing contact FIRST
const existing = await ctx.db
  .query("contacts")
  .withIndex("by_workspace_phone", q =>
    q.eq("workspace_id", args.workspace_id).eq("phone", normalizedPhone)
  )
  .first();

if (existing) {
  // Return success with "exists" status (not an error)
  return { success: true, status: "exists", contact_id: existing._id };
}

// Only create if not found
const contactId = await ctx.db.insert("contacts", { ... });
```
**Why:** n8n and most webhook providers retry failed requests. Without idempotency, retries create duplicates.

### Pattern 3: Phone Normalization to E.164
**What:** Convert phone numbers to consistent international format (+[CC][Number])
**When to use:** All phone number storage and matching
**Example:**
```typescript
function normalizePhone(phone: string): string {
  // Remove whitespace and special characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Indonesian-specific: 0812 → +6281
  if (cleaned.startsWith("0")) {
    return "+62" + cleaned.substring(1);
  }

  // Add + if missing: 6281 → +6281
  if (cleaned.startsWith("62") && !cleaned.startsWith("+")) {
    return "+" + cleaned;
  }

  return cleaned;
}
```
**Source:** [E.164 Phone Number Format Guide](https://www.sent.dm/resources/e164-phone-format)

### Pattern 4: CRM Status Workflow
**What:** Lead progression through defined statuses with clear transitions
**When to use:** All CRM implementations
**Status values:**
- `new` - Just entered the system (initial state from n8n)
- `qualified` - Passed qualification criteria (from bot workflow)
- `consultation` - Requested 1-on-1 consultation (hot lead)
- `community` - Directed to free community (nurture path)
- `converted` - Became a customer
- `lost` - No longer viable

**Example:**
```typescript
// Initial creation (n8n webhook)
await ctx.db.insert("contacts", {
  lead_status: "new",
  lead_score: args.lead_score,
  // ...
});

// Update after bot qualification
await ctx.db.patch(contact._id, {
  lead_status: "qualified",
  lead_score: recalculatedScore,
});
```
**Source:** [Lead Status Workflow Patterns](https://www.default.com/post/hubspot-lead-status-lifecycle-stages)

### Anti-Patterns to Avoid
- **Direct database writes from HTTP actions:** Always use mutations for data changes. HTTP actions should orchestrate, not mutate.
- **Throwing errors for duplicates:** Return success with "exists" status. Duplicates are expected behavior, not errors.
- **Storing raw phone numbers:** Always normalize to E.164 for consistent matching across sources.
- **Missing workspace resolution:** Don't hardcode workspace IDs. Use slug lookup for flexibility.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone number parsing | Custom regex for each country | E.164 normalization (simple) or libphonenumber-js (complex) | Country codes, area codes, and number lengths vary wildly. Indonesian 0812 vs +6281, US (555) vs +1555. |
| Webhook signature verification | Custom HMAC implementation | Web Crypto API `crypto.subtle.sign()` | Timing attacks, constant-time comparison, base64 encoding edge cases. Already implemented in existing code. |
| Duplicate detection | Application-level caching | Database index + query-first pattern | Race conditions on concurrent requests. Database indexes are atomic. |
| Lead scoring calculation | Inline if/else logic | Separate scoring module with config | Score criteria change frequently. Centralized config (like Eagle's n8n Code node) keeps logic testable. |

**Key insight:** Webhook integrations fail in production due to subtle issues (signature verification, duplicate handling, timeout limits). Use proven patterns and thoroughly test with real data before launch.

## Common Pitfalls

### Pitfall 1: Webhook Timeout (500 Errors)
**What goes wrong:** HTTP action takes too long to respond, webhook provider times out and retries
**Why it happens:** Expensive operations (external API calls, complex calculations) inside HTTP handler
**How to avoid:**
- Keep HTTP actions fast (<2 seconds)
- Use `ctx.scheduler.runAfter(0, internal.processor)` for async work
- Return 200 immediately after queuing background job
**Warning signs:** n8n execution logs show 500 errors but data eventually appears in CRM

### Pitfall 2: Duplicate Contacts from Retry Logic
**What goes wrong:** Same lead appears multiple times in Contact Database
**Why it happens:** n8n retries failed requests, and mutation creates new contact each time
**How to avoid:**
- Query for existing contact BEFORE inserting
- Use database index for fast lookup (`by_workspace_phone`)
- Return success response even if contact exists
**Warning signs:** Multiple contacts with identical phone numbers, created seconds apart

### Pitfall 3: Phone Number Mismatch (Lookup Failures)
**What goes wrong:** Lead created via n8n (phone: "+6281234567890") doesn't match WhatsApp messages (phone: "0812-3456-7890")
**Why it happens:** Inconsistent phone normalization across input sources
**How to avoid:**
- Normalize ALL phone numbers to E.164 format on write
- Use `phone_normalized` field for queries and matching
- Store original phone in `phone` field for display
**Warning signs:** Contacts exist but show as "new contact" when they message via WhatsApp

### Pitfall 4: Workspace Resolution in Wrong Layer
**What goes wrong:** Mutation hardcodes workspace ID, making it impossible to support multiple workspaces
**Why it happens:** Taking shortcuts during initial implementation
**How to avoid:**
- HTTP action resolves workspace by slug
- Mutation accepts `workspace_id` as parameter
- Keep mutation generic, HTTP handler specific
**Warning signs:** Need to duplicate entire mutation to add a second workspace

### Pitfall 5: Missing Production Environment Variables
**What goes wrong:** Webhook endpoint works in development but fails in production with "undefined" errors
**Why it happens:** Environment variables set in dev deployment but not in prod deployment
**How to avoid:**
- Use `npx convex env list --prod` to verify production variables
- Set secrets via Dashboard → Deployment Settings → Environment Variables
- Test with production deployment URL, not dev deployment
**Warning signs:** Works with `npx convex dev` but fails when deployed

### Pitfall 6: Production Verification with Test Data Only
**What goes wrong:** Integration passes testing but fails when real users submit forms
**Why it happens:** Test data doesn't represent edge cases (special characters, long names, invalid phone formats)
**How to avoid:**
- Test with real Google Form submissions (use actual form URL)
- Verify end-to-end: Form → n8n → Convex → CRM UI
- Check Contact Database for correct display of all fields
**Warning signs:** Test leads work perfectly, real leads show empty fields or errors

## Code Examples

Verified patterns from official sources:

### Webhook Endpoint with Workspace Resolution
```typescript
// Source: convex/http.ts (existing implementation)
http.route({
  path: "/webhook/n8n",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    try {
      const rawBody = await request.text();
      const payload = JSON.parse(rawBody);

      console.log("[n8n Webhook] Received lead data:", {
        name: payload.name,
        phone: payload.phone?.substring(0, 6) + "***",
      });

      // Resolve workspace by slug (hardcoded for Eagle)
      const workspace = await ctx.runQuery(api.workspaces.getBySlug, {
        slug: "eagle-overseas",
      });

      if (!workspace) {
        console.error("[n8n Webhook] Workspace 'eagle-overseas' not found");
        return new Response(JSON.stringify({ error: "Workspace not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Call createLead mutation
      const result = await ctx.runMutation(api.n8n.createLead, {
        workspace_id: workspace._id,
        name: payload.name || "Unknown",
        phone: payload.phone,
        email: payload.email || undefined,
        lead_score: payload.lead_score || 0,
        metadata: payload.metadata || undefined,
      });

      const duration = Date.now() - startTime;
      console.log(`[n8n Webhook] Processed lead in ${duration}ms:`, result);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[n8n Webhook] Error after ${duration}ms:`, error);

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});
```

### Idempotent Lead Creation Mutation
```typescript
// Source: convex/n8n.ts (existing implementation)
export const createLead = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    lead_score: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const normalizedPhone = normalizePhone(args.phone);

    console.log("[n8n] Processing lead:", {
      workspace_id: args.workspace_id,
      name: args.name,
      phone: normalizedPhone,
    });

    // Check if contact already exists by phone
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", args.workspace_id).eq("phone", normalizedPhone)
      )
      .first();

    if (existing) {
      console.log("[n8n] Contact already exists:", existing._id);
      return {
        success: true,
        status: "exists",
        contact_id: existing._id,
      };
    }

    // Create new contact
    const contactId = await ctx.db.insert("contacts", {
      workspace_id: args.workspace_id,
      phone: normalizedPhone,
      phone_normalized: normalizedPhone,
      name: args.name,
      email: args.email,
      lead_score: args.lead_score,
      lead_status: "new",
      tags: ["google-form"],
      source: "n8n",
      metadata: args.metadata || {},
      created_at: now,
      updated_at: now,
      supabaseId: "", // No Supabase ID for new contacts
    });

    console.log("[n8n] Contact created:", contactId);

    return {
      success: true,
      status: "created",
      contact_id: contactId,
    };
  },
});
```

### Production Verification Checklist
```bash
# Step 1: Verify production endpoint is accessible
curl -X POST https://intent-otter-212.convex.cloud/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "phone": "+6281234567890",
    "email": "test@example.com",
    "lead_score": 75,
    "metadata": {
      "form_answers": {
        "Level Bahasa Inggris": "Menengah",
        "Budget": "100-300jt",
        "Negara Tujuan": "UK"
      }
    }
  }'

# Step 2: Check Convex logs
# Dashboard → Deployments → Production → Logs
# Look for: "[n8n Webhook] Received lead data"

# Step 3: Verify in Contact Database
# https://my21staff.com/eagle-overseas/database
# Search for: "Test Lead" or phone number

# Step 4: Test duplicate detection
# Submit same request again, verify response shows "exists"

# Step 5: End-to-end test with real Google Form
# Submit actual form at Eagle's form URL
# Wait for n8n execution (check n8n logs)
# Verify lead appears in CRM with correct metadata
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous webhook processing | Async with scheduler | 2024+ | Prevents timeouts, faster response |
| Store phone as entered | E.164 normalization | Ongoing standard | Consistent matching across sources |
| Throw error on duplicate | Return success with "exists" | Webhook best practice | Prevents retry storms |
| Hardcode workspace ID in mutation | Resolve by slug in HTTP layer | Multi-tenant pattern | Easier to add workspaces |
| Manual testing only | End-to-end with real data | Production readiness | Catches edge cases early |

**Deprecated/outdated:**
- **Supabase integration:** Migrated to Convex in Phase 6 (legacy numbering), connection string no longer needed
- **ngrok for local testing:** Deferred to production testing due to connectivity issues (per PROJECT.md)

## Open Questions

Things that couldn't be fully resolved:

1. **n8n Retry Behavior**
   - What we know: n8n retries failed webhook requests automatically
   - What's unclear: Exact retry count and backoff strategy for Eagle's workflow
   - Recommendation: Check n8n workflow settings for retry configuration. Current idempotent design handles any retry pattern safely.

2. **Lead Score Recalculation**
   - What we know: n8n calculates initial score based on form answers
   - What's unclear: Whether CRM should recalculate score after bot qualification, or treat n8n score as authoritative
   - Recommendation: Keep n8n score as "form_score" in metadata, allow bot to set separate "engagement_score". Display max of both.

3. **Metadata Field Mapping**
   - What we know: Form answers stored in nested structure (`metadata.metadata.form_answers`)
   - What's unclear: Is double-nesting intentional or a data transformation quirk?
   - Recommendation: Verify current n8n workflow output structure. Phase 5 verification will surface any inconsistencies.

## Sources

### Primary (HIGH confidence)
- **Existing Implementation:** `convex/http.ts` and `convex/n8n.ts` - Already deployed and working from Phase 6 (legacy numbering)
- **Existing Schema:** `convex/schema.ts` - contacts table with proper indexes
- [HTTP Actions | Convex Developer Hub](https://docs.convex.dev/functions/http-actions) - Official Convex documentation
- [Clerk Webhooks: Data Sync with Convex](https://clerk.com/blog/webhooks-data-sync-convex) - Verified webhook patterns
- [E.164 Phone Number Format Guide](https://www.sent.dm/resources/e164-phone-format) - Phone normalization standard

### Secondary (MEDIUM confidence)
- [Webhook Testing Guide | Hookdeck](https://hookdeck.com/webhooks/guides/guide-troubleshooting-debugging-webhooks) - Production debugging strategies
- [n8n Error Handling Documentation](https://docs.n8n.io/flow-logic/error-handling/) - Retry and error workflow patterns
- [Lead Status Workflow Guide](https://www.default.com/post/hubspot-lead-status-lifecycle-stages) - CRM status progression patterns
- [CRM Lead Scoring Best Practices 2026](https://www.breakcold.com/blog/crm-lead-scoring) - Lead scoring methodology

### Tertiary (LOW confidence)
- [Webhook Testing Tools 2026](https://webhook.site/) - Testing tools reference (not needed for Phase 5)
- [Production Webhook Monitoring 2026](https://www.hooklistener.com/features) - Advanced monitoring (future consideration)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing implementation already deployed, just needs production verification
- Architecture: HIGH - Code follows Convex best practices, patterns verified in official docs and working integrations
- Pitfalls: HIGH - Based on known production issues from Phase 6 implementation and common webhook integration failures

**Research date:** 2026-01-26
**Valid until:** 60 days (stable patterns, core infrastructure already working)
