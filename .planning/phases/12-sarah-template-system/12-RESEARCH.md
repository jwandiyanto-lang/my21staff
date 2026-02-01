# Phase 12: Sarah Template System - Research

**Researched:** 2026-02-01
**Domain:** Convex Schema + React Form Integration + Kapso Workflow Configuration
**Confidence:** HIGH

## Summary

Researched how to implement a customer configuration layer for Sarah bot within the existing my21staff architecture. The phase requires:

1. **Convex schema design** for per-workspace Sarah configuration storage
2. **React form integration** within existing Clerk-based team page
3. **Kapso workflow updates** to load configuration dynamically at runtime
4. **Security validation** to prevent cross-workspace data access

**Primary recommendation:** Use proven patterns from existing codebase (settingsBackup.ts, contacts API, team page structure) to implement 4-field configuration UI integrated into existing `/[workspace]/team` page with Convex storage and Kapso function node for runtime config loading.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex | Current | Database + Real-time APIs | Already integrated, handles schema validation, indexes, mutations/queries with TypeScript types |
| Clerk | Current | Authentication + Organizations | Already managing workspace/org context, provides userId/orgId validation |
| React Hook Form | Not yet used | Form validation | Industry standard for TypeScript forms, minimal re-renders, schema validation support |
| Zod | Not yet used | Schema validation | TypeScript-first schema validation, integrates with React Hook Form |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Shadcn/ui | Current | UI components | Already used for Cards, Inputs, Selects - reuse existing components |
| date-fns | Current | Date formatting | Already imported in sync-status-indicator.tsx |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod + React Hook Form | Manual validation | React Hook Form + Zod provides better TypeScript inference and reusable schema |
| Convex mutations | Direct API routes | Convex mutations provide automatic auth context and real-time subscriptions |

**Installation:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── sarah/
│   ├── getConfig.ts         # Query for reading config
│   └── updateConfig.ts      # Mutation for updating config
│
src/app/(dashboard)/[workspace]/team/
├── page.tsx                 # MODIFY: Add SarahConfigCard above Team Members
└── components/
    └── sarah-config-card.tsx # NEW: Configuration form component
```

### Pattern 1: Convex Schema with Optional Nested Objects
**What:** Define configuration table with required workspace_id and optional config fields
**When to use:** Per-workspace settings that may not exist initially
**Example:**
```typescript
// Source: convex/schema.ts patterns (lines 171-182 ariConfig, 665-673 botConfig)
sarahConfigs: defineTable({
  workspace_id: v.id("workspaces"),
  bot_name: v.string(),                    // Required, default "Your Intern"
  language: v.string(),                    // Required, "id" | "en"
  pronoun: v.string(),                     // Required, "Kamu" | "Anda"
  trial_link: v.string(),                  // Required, must be valid URL
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_workspace", ["workspace_id"]),
```

### Pattern 2: Clerk Auth in API Routes with Dev Mode Support
**What:** Verify user authentication while supporting offline dev mode
**When to use:** All API routes that modify workspace data
**Example:**
```typescript
// Source: src/app/api/contacts/route.ts (lines 13-50)
function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function POST(request: NextRequest) {
  if (isDevMode()) {
    // Return mock data without auth check
    return NextResponse.json({ success: true, mockData: MOCK_CONFIG })
  }

  // Production: Verify authentication
  const { userId, orgId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate workspace ownership
  const workspace = await fetchQuery(api.workspaces.getById, { id: workspaceId })
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // Proceed with mutation
}
```

### Pattern 3: Convex Query/Mutation Naming Convention
**What:** Use descriptive function names exported from domain-specific files
**When to use:** All Convex backend functions
**Example:**
```typescript
// Source: convex/settingsBackup.ts (lines 8-38, 43-59)

// Query: convex/sarah/getConfig.ts
export const getConfig = query({
  args: {
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("sarahConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .first();

    // Return default config if none exists
    if (!config) {
      return {
        bot_name: "Your Intern",
        language: "id",
        pronoun: "Kamu",
        trial_link: "https://my21staff.com/trial",
      };
    }

    return config;
  },
});

// Mutation: convex/sarah/updateConfig.ts
export const updateConfig = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    bot_name: v.string(),
    language: v.string(),
    pronoun: v.string(),
    trial_link: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("sarahConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        bot_name: args.bot_name,
        language: args.language,
        pronoun: args.pronoun,
        trial_link: args.trial_link,
        updated_at: now,
      });
      return { success: true, configId: existing._id };
    } else {
      const configId = await ctx.db.insert("sarahConfigs", {
        workspace_id: args.workspace_id,
        bot_name: args.bot_name,
        language: args.language,
        pronoun: args.pronoun,
        trial_link: args.trial_link,
        created_at: now,
        updated_at: now,
      });
      return { success: true, configId };
    }
  },
});
```

### Pattern 4: React Component Integration into Existing Page
**What:** Add configuration UI as new Card before existing Clerk component
**When to use:** Extending existing dashboard pages without breaking layouts
**Example:**
```typescript
// Source: src/app/(dashboard)/[workspace]/team/page.tsx structure

export default function TeamPage() {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const { organization, isLoaded } = useOrganization()

  // Loading state
  if (!isLoaded) return <LoadingSkeleton />

  // No organization state
  if (!organization) return <NoOrgAlert />

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage team members and their access in {organization.name}
        </p>
      </div>

      {/* NEW: Sarah Config Card */}
      <SarahConfigCard workspaceId={organization.id} isDevMode={isDevMode} />

      {/* EXISTING: Team Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <OrganizationProfile appearance={{...}} routing="hash" />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Pattern 5: Kapso Function Node for Config Loading
**What:** Add function node before agent node to fetch configuration from external API
**When to use:** Dynamic workflow configuration based on customer/workspace context
**Example:**
```javascript
// Source: Kapso docs - Functions cheatsheet
// https://docs.kapso.ai/docs/functions/overview

// In Kapso workflow graph:
// [start] → [load-config] → [sarah_agent] → [send_trial_link]

// load-config function node implementation:
async function handler(request, env) {
  const { execution_context } = await request.json();

  // Extract workspace_id from conversation context
  // Kapso provides phone_number - we need to map to workspace_id
  const phone_number_id = execution_context.conversation?.phone_number_id;

  // Fetch config from Convex API
  const response = await fetch(
    `https://intent-otter-212.convex.cloud/api/sarah/config?phone_id=${phone_number_id}`,
    {
      headers: {
        'Authorization': `Bearer ${env.CONVEX_API_KEY}`
      }
    }
  );

  const config = await response.json();

  // Return variables for downstream nodes
  return new Response(JSON.stringify({
    vars: {
      bot_name: config.bot_name,
      language: config.language,
      pronoun: config.pronoun,
      trial_link: config.trial_link,
      // Build system prompt with config
      system_prompt: buildSystemPrompt(config)
    }
  }));
}

// Update sarah_agent node config:
{
  "system_prompt": "{{vars.system_prompt}}",
  "provider_model_id": "882b9077-896e-473c-9fc0-d7af9ae0b093"
}

// Update send_trial_link node:
{
  "message": "Great! Here's your trial link: {{vars.trial_link}}"
}
```

### Anti-Patterns to Avoid
- **Don't store workspace_id in request body without validation:** Always derive from Clerk auth context
- **Don't trust client-provided workspace_id:** Validate user has access to workspace via Clerk orgId
- **Don't fetch config on every message:** Kapso function node runs once per conversation start, cache result
- **Don't expose Convex mutation directly to client:** Use Next.js API route as middleware for auth checks

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Manual onChange handlers with useState | React Hook Form + Zod | Handles validation, errors, dirty state, TypeScript inference automatically |
| Workspace ownership check | Custom JWT parsing | Clerk auth() helper | Clerk validates session, provides userId/orgId, handles token refresh |
| Per-workspace data isolation | Manual WHERE clauses | Convex indexes with by_workspace pattern | Indexes enforce isolation, prevent accidental cross-tenant queries |
| URL validation | Regex patterns | Zod z.string().url() | Handles edge cases (ports, IPv6, IDN domains) correctly |
| Dev mode mock data | Separate mock API server | Environment variable check in route handlers | Simpler, no network dependency, faster tests |

**Key insight:** Convex handles database-level isolation via indexes, Clerk handles authentication, React Hook Form handles form state - don't rebuild these systems manually.

## Common Pitfalls

### Pitfall 1: Trusting Client-Provided workspace_id
**What goes wrong:** Client sends `workspace_id` in request body, API uses it directly without validation
**Why it happens:** Assuming client is trusted, not validating ownership
**How to avoid:**
```typescript
// WRONG:
const { workspace_id } = await request.json()
await updateConfig(workspace_id, config) // ❌ No validation

// RIGHT:
const { userId, orgId } = await auth()
const workspace = await fetchQuery(api.workspaces.getByClerkOrgId, { clerk_org_id: orgId })
if (!workspace) throw new Error('Unauthorized')
await updateConfig(workspace._id, config) // ✅ Validated ownership
```
**Warning signs:** No auth() call in API route, workspace_id from request.json() used directly

### Pitfall 2: Missing Dev Mode Checks in New Components
**What goes wrong:** New component uses Convex useQuery without dev mode fallback, breaks offline demo
**Why it happens:** Forgetting to add isDevMode check when copying component patterns
**How to avoid:**
```typescript
// In ALL new components that use Convex:
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

if (isDevMode) {
  return <ComponentWithMockData data={MOCK_SARAH_CONFIG} />
}

const config = useQuery(api.sarah.getConfig, { workspace_id: workspaceId })
```
**Warning signs:** Component works at `/eagle-overseas` but throws errors at `/demo`

### Pitfall 3: Index Missing for Workspace Queries
**What goes wrong:** Query by workspace_id scans entire table, performance degrades at scale
**Why it happens:** Adding table without adding index to schema
**How to avoid:**
```typescript
// ALWAYS add .index("by_workspace", ["workspace_id"]) to tables with workspace_id
sarahConfigs: defineTable({
  workspace_id: v.id("workspaces"),
  // ... other fields
})
  .index("by_workspace", ["workspace_id"]), // ✅ Required for performance
```
**Warning signs:** Slow queries as data grows, Convex dashboard shows full table scans

### Pitfall 4: Not Handling Missing Configuration Gracefully
**What goes wrong:** Query returns null, component crashes with "Cannot read property of null"
**Why it happens:** Assuming config always exists, new workspaces have no config initially
**How to avoid:**
```typescript
// In Convex query:
const config = await ctx.db.query("sarahConfigs")...first();

// Return defaults if none exists
if (!config) {
  return DEFAULT_SARAH_CONFIG;
}

return config;
```
**Warning signs:** New workspaces see blank forms or error states

### Pitfall 5: Kapso Function Node Can't Map phone_number_id to workspace_id
**What goes wrong:** Function node receives phone_number_id from Kapso but needs workspace_id for Convex
**Why it happens:** No mapping between Kapso phone_number_id and my21staff workspace_id
**How to avoid:**
```typescript
// Store kapso_phone_id in workspaces table (already exists in schema line 12)
// Query by phone_id instead of workspace_id:

// Convex endpoint: convex/sarah/getConfigByPhone.ts
export const getConfigByPhone = query({
  args: {
    phone_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Find workspace by Kapso phone ID
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_kapso_phone", (q) => q.eq("kapso_phone_id", args.phone_id))
      .first();

    if (!workspace) return DEFAULT_CONFIG;

    // Find config by workspace
    const config = await ctx.db
      .query("sarahConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspace._id))
      .first();

    return config || DEFAULT_CONFIG;
  },
});

// Kapso function node calls:
// https://intent-otter-212.convex.cloud/api/sarah/configByPhone?phone_id={phone_number_id}
```
**Warning signs:** Kapso workflow fails to load config, all customers get default config

## Code Examples

Verified patterns from official sources:

### Convex Mutation with Upsert Pattern
```typescript
// Source: convex/settingsBackup.ts pattern (lines 8-38)
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateConfig = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    bot_name: v.string(),
    language: v.string(),
    pronoun: v.string(),
    trial_link: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find existing config
    const existing = await ctx.db
      .query("sarahConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        bot_name: args.bot_name,
        language: args.language,
        pronoun: args.pronoun,
        trial_link: args.trial_link,
        updated_at: now,
      });
      return { success: true, configId: existing._id };
    } else {
      // Insert new
      const configId = await ctx.db.insert("sarahConfigs", {
        workspace_id: args.workspace_id,
        bot_name: args.bot_name,
        language: args.language,
        pronoun: args.pronoun,
        trial_link: args.trial_link,
        created_at: now,
        updated_at: now,
      });
      return { success: true, configId };
    }
  },
});
```

### Next.js API Route with Clerk Auth
```typescript
// Source: src/app/api/contacts/route.ts pattern (lines 104-157)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace, bot_name, language, pronoun, trial_link } = body

    // Validation
    if (!workspace || !bot_name || !language || !pronoun || !trial_link) {
      return NextResponse.json(
        { error: 'All fields required' },
        { status: 400 }
      )
    }

    // Verify authentication
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify workspace ownership
    const workspaceData = await fetchQuery(api.workspaces.getById, {
      id: workspace,
    })

    if (!workspaceData) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Update config via Convex mutation
    const result = await fetchMutation(api.sarah.updateConfig, {
      workspace_id: workspaceData._id as any,
      bot_name,
      language,
      pronoun,
      trial_link,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('POST /api/sarah/config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### React Component with Dev Mode Support
```typescript
// Source: src/components/settings/sync-status-indicator.tsx pattern (lines 21-41)
"use client"

import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SarahConfigCardProps {
  workspaceId: string
}

export function SarahConfigCard({ workspaceId }: SarahConfigCardProps) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  // Dev mode: use mock data
  if (isDevMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your AI Team</CardTitle>
          <CardDescription>Configure your AI assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Bot Name</Label>
              <Input value="Your Intern (Demo)" disabled />
            </div>
            <p className="text-sm text-muted-foreground">
              Offline mode - settings not saved
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Production: fetch from Convex
  const config = useQuery(api.sarah.getConfig, {
    workspace_id: workspaceId as any,
  })

  // Render form with config data
  // ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase RLS for multi-tenancy | Convex indexes with workspace_id | v2.0 migration | Simpler queries, better TypeScript inference |
| Manual form validation | React Hook Form + Zod | Not yet adopted | Will reduce boilerplate and improve type safety |
| Separate API for config | Convex HTTP endpoints | Convex supports both | Can use Convex HTTP for Kapso function nodes |
| Environment-specific builds | Dev mode flag | Current architecture | Enables truly offline demo without mocking servers |

**Deprecated/outdated:**
- Supabase auth (replaced with Clerk)
- Supabase RLS policies (replaced with Convex workspace_id indexes)
- Manual phone normalization (now handled by findOrCreateContactWebhook helper)

## Open Questions

Things that couldn't be fully resolved:

1. **Kapso Function Node HTTP Authentication**
   - What we know: Kapso function nodes can call external APIs
   - What's unclear: How to securely authenticate Convex API calls from Kapso
   - Recommendation: Create public Convex HTTP endpoint at `/api/sarah/configByPhone?phone_id={id}` that doesn't require auth (phone_id itself is the auth key - only workspace owner knows their phone_id)

2. **Default Config Initialization Timing**
   - What we know: New workspaces need default Sarah config
   - What's unclear: When to create default config (on workspace creation or on first access?)
   - Recommendation: Create on first access (query returns defaults if none exists, user can save to persist)

3. **Config Update Propagation to Active Conversations**
   - What we know: Config changes saved to Convex immediately
   - What's unclear: Do active Kapso conversations pick up new config mid-conversation?
   - Recommendation: Config loaded once per conversation at start (documented limitation - restart conversation to use new config)

## Sources

### Primary (HIGH confidence)
- Convex schema patterns: `/home/jfransisco/Desktop/21/my21staff/convex/schema.ts` (lines 1-920)
- Convex mutation patterns: `/home/jfransisco/Desktop/21/my21staff/convex/settingsBackup.ts` (full file)
- Next.js API route patterns: `/home/jfransisco/Desktop/21/my21staff/src/app/api/contacts/route.ts` (full file)
- Team page structure: `/home/jfransisco/Desktop/21/my21staff/src/app/(dashboard)/[workspace]/team/page.tsx` (full file)
- Dev mode patterns: `/home/jfransisco/Desktop/21/my21staff/src/components/settings/sync-status-indicator.tsx` (lines 21-41)

### Secondary (MEDIUM confidence)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) - Database schema design
- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions) - Transaction patterns
- [Kapso Functions Cheatsheet](https://docs.kapso.ai/docs/functions/overview) - Function node configuration
- [React Hook Form Advanced Usage](https://react-hook-form.com/advanced-usage) - Form validation patterns
- [Multi-Tenant Next.js Guide](https://nextjs.org/docs/app/guides/multi-tenant) - Workspace isolation

### Tertiary (LOW confidence)
- WebSearch results for React form validation (multiple blog posts, not official docs)
- WebSearch results for multi-tenancy (general patterns, not specific to this stack)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use except React Hook Form (proven pattern)
- Architecture: HIGH - Patterns verified from existing codebase files
- Pitfalls: HIGH - Based on existing code comments and error handling patterns
- Kapso integration: MEDIUM - Function node pattern verified from docs, but HTTP auth approach needs testing

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable stack, no fast-moving dependencies)
