# Convex Performance Spike - Setup & Usage

**Phase:** v3.0 Performance & Speed - Convex Spike
**Date:** 2026-01-21
**Goal:** Validate Convex as a data layer replacement for Supabase

---

## What's Been Done

### 1. Schema Created (`convex/schema.ts`)
- Tables matching Supabase: `workspaces`, `workspaceMembers`, `contacts`, `conversations`, `messages`, `contactNotes`
- All indexes defined for fast lookups (phone lookup, workspace scoping)
- `supabaseId` field stored on all records for migration reference

### 2. Auth Config (`convex/auth.config.ts`)
- Supabase JWT provider configured
- Uses Supabase JWKS endpoint for token verification
- Convex will accept Supabase-issued JWTs

### 3. Authorization Helpers (`convex/lib/auth.ts`)
- `requireWorkspaceMembership()` - Workspace-scoped access control
- `requireAuthentication()` - Basic auth check
- Replaces Supabase RLS policies

### 4. Contact Queries (`convex/contacts.ts`)
- `getByPhone()` - Look up contact by phone number
- `getContextByPhone()` - Full CRM context for AI personalization

### 5. HTTP Action (`convex/http/contacts.ts`)
- `getByPhone()` - HTTP endpoint with CRM_API_KEY auth
- `getContextByPhoneBypass()` - Internal query for API key auth

### 6. Migration Mutations (`convex/migrate.ts`)
- Internal mutations for each table type
- Called by migration script

### 7. Scripts
- `scripts/migrate-convex.ts` - Copy data from Supabase to Convex
- `scripts/benchmark.ts` - Compare Supabase vs Convex performance

---

## Setup Steps

### 1. Create a Convex Project

```bash
npx convex dev
```

Follow the CLI prompts to create a new Convex project.

### 2. Add Environment Variables

Add to `.env.local`:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
CONVEX_DEPLOYMENT=your-deployment-id

# Supabase (already exists)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Key (already exists)
CRM_API_KEY=your-crm-api-key
```

### 3. Deploy the Convex Schema

```bash
npx convex dev
```

This will:
- Generate TypeScript types from schema
- Deploy schema to Convex development backend
- Start local Convex development server

### 4. Migrate Data (Optional)

To run the performance comparison, you'll need real data in Convex:

```bash
# Update scripts/benchmark.ts with your test phone number
# Then run:
tsx scripts/migrate-convex.ts
```

This copies all workspaces, contacts, conversations, messages, and notes from Supabase to Convex.

---

## Running the Benchmark

### 1. Update Test Data

Edit `scripts/benchmark.ts`:

```typescript
const TEST_WORKSPACE_ID = "25de3c4e-b9ca-4aff-9639-b35668f0a48e"; // Eagle Overseas
const TEST_PHONE = "6281234567890"; // Replace with real phone from your DB
```

### 2. Run Direct Database Benchmark

```bash
tsx scripts/benchmark.ts
```

This runs:
- 50 Supabase queries (direct)
- 50 Convex queries (direct)
- Comparison statistics

### 3. Run API Route Benchmark

First, start the Next.js dev server:

```bash
npm run dev
```

Then in another terminal:

```bash
tsx scripts/benchmark.ts
```

This also tests the API routes with HTTP overhead.

---

## Decision Criteria

Proceed with Convex migration if:

| Metric | Supabase Current | Target | Convex Result |
|---------|-----------------|---------|----------------|
| P95 Response Time | 2000-6000ms | < 500ms | **Decision point** |
| Query Count | 4 per request | < 2 | **Decision point** |

**Go ahead with migration if:** Convex P95 < 500ms AND at least 50% faster than Supabase
**Optimize Supabase instead if:** Results are comparable (< 20% difference)

---

## File Structure

```
convex/
├── schema.ts              # Database schema
├── auth.config.ts         # Supabase JWT provider config
├── lib/
│   └── auth.ts          # Authorization helpers
├── contacts.ts           # Contact queries
├── http/
│   └── contacts.ts      # HTTP endpoints
└── migrate.ts           # Migration mutations

scripts/
├── migrate-convex.ts    # Data migration script
└── benchmark.ts          # Performance comparison

src/app/api/contacts/
└── by-phone-convex/     # Next.js API route using Convex
    └── route.ts
```

---

## Next Steps (After Spike)

If Convex wins:
1. Migrate core tables (contacts, conversations, messages)
2. Update inbox to use Convex real-time subscriptions
3. Migrate remaining tables
4. Remove Supabase data queries

If Supabase optimization wins:
1. Apply nested queries where possible
2. Add database indexes on hot paths
3. Implement column selection (select only needed fields)
4. Consider connection pooling

---

## Sources

- [Convex Documentation](https://docs.convex.dev)
- [Convex Custom JWT Auth](https://docs.convex.dev/auth/advanced/custom-jwt)
- [Convex Schema Reference](https://docs.convex.dev/database/schemas)
