# Architecture

**Analysis Date:** 2026-01-30

## Pattern Overview

**Overall:** Multi-layer Next.js 15 application using **Convex backend-as-a-service** with **hybrid offline/online development mode**.

**Key Characteristics:**
- Server-rendered pages with client-side interactivity (App Router)
- Real-time data via Convex query subscriptions (`useQuery`)
- Dual authentication: Clerk (user) + Convex (backend)
- Dev mode bypasses auth and Convex for offline localhost testing (`NEXT_PUBLIC_DEV_MODE=true`)
- Kapso WhatsApp API integration via webhook handler
- Database is single source of truth (no parallel data stores)

## Layers

**Presentation (Components):**
- Purpose: React components for UI rendering
- Location: `src/components/`
- Contains: Page components, dialogs, forms, tables, analytics views
- Depends on: Hooks (queries/mutations), types, utilities
- Used by: Pages in `src/app/(dashboard)/` and public pages

**Page/Route Layer (Next.js):**
- Purpose: Server components that fetch data, client components that manage state
- Location: `src/app/(dashboard)/[workspace]/` (main dashboard), `src/app/api/` (REST endpoints)
- Contains: Page.tsx (server), `*-client.tsx` (client components), API routes
- Pattern: Server component fetches workspace → passes props to client component → client queries Convex
- Depends on: Convex API, Clerk auth, services
- Used by: Browser requests

**Backend API (REST Routes):**
- Purpose: Bridge between frontend, Convex, and external services (Kapso, Clerk)
- Location: `src/app/api/[domain]/[endpoint]/route.ts`
- Contains: Clerk authentication, request validation, Convex queries/mutations, Kapso API calls
- Patterns:
  - `GET /api/contacts` - fetch paginated contacts with dev mode mock
  - `POST /api/messages/send` - authenticate, send via Kapso, store in Convex
  - `POST /api/webhook/kapso` - receive WhatsApp messages, process with ARI, persist
- Depends on: Convex, Clerk, Kapso, ARI processor
- Used by: Frontend fetch calls

**Real-time Data (Convex):**
- Purpose: Database, query subscriptions, mutations, scheduled tasks
- Location: `convex/` (schema, queries, mutations, scheduled functions)
- Contains:
  - `schema.ts` - Convex table definitions (workspaces, contacts, conversations, messages, etc.)
  - `*.ts` - Query/mutation functions organized by domain (contacts.ts, conversations.ts, etc.)
  - `ai/` - ARI conversation logic (brain, mouth, context-builder)
  - `http.ts` - HTTP endpoint handlers for webhooks
- Depends on: Clerk for auth, external APIs
- Used by: Frontend queries, API routes, scheduled tasks

**Utilities & Libraries:**
- Purpose: Shared business logic, formatting, calculations
- Location: `src/lib/`
- Key subdirectories:
  - `ari/` - AI routing engine (processor, scoring, state-machine, routing)
  - `queries/` - React Query hooks (useContacts, useConversations, useWorkspaceSettings)
  - `auth/` - Workspace auth checks
  - `kapso/` - WhatsApp API client and webhook signature verification
  - `phone/` - Phone number normalization
  - `tickets/` - Support ticket workflow (email, transitions, types)
  - `email/` - Email rendering via React Email
  - `validations/` - Zod schemas for form/request validation
  - `mock-data.ts` - Dev mode fallback data (~2KB of mock contacts, conversations, users)
- Depends on: Types, external SDKs (Convex, Clerk, Kapso)
- Used by: Components, API routes, Convex functions

## Data Flow

**Message Inbound (WhatsApp → Dashboard):**

1. Kapso webhook receives message from Meta/WhatsApp
2. `POST /api/webhook/kapso` validates signature, normalizes phone
3. ARI processor (`processWithARI()`) determines handler (human, bot, escalate)
4. Convex mutations store: contact record, conversation, message, notes
5. Real-time: `useConversations` and `useMessages` subscriptions reflect new message
6. Inbox UI auto-updates via Convex query refresh

**Message Outbound (Dashboard → WhatsApp):**

1. User types in inbox, submits
2. `POST /api/messages/send` validates, gets conversation context
3. Message sent via Kapso API (`sendMessage()`)
4. Stored in Convex immediately (optimistic)
5. `useMessages` subscription reflects message on send
6. Contact's last_message_at updated for sort order

**Contact Management (Database View):**

1. Database page renders server component `/[workspace]/database/page.tsx`
2. Server fetches workspace (Convex: `getBySlug`)
3. Client component mounts with workspaceId
4. `useContacts` hook queries `GET /api/contacts?workspace=...&page=...`
5. API route checks dev mode → return MOCK_CONTACTS or Convex query
6. Table renders with filtering/sorting via client state
7. On contact update: `useUpdateContact` → `PATCH /api/contacts/[id]` → Convex mutation

**State Management:**

- **Server State:** Workspace data fetched on page load (cached via Next.js)
- **Client State:** Form inputs, filters, selected items (React useState)
- **Real-time State:** Convex subscriptions (messages, conversations, contacts) via `useQuery`
- **Cache State:** React Query manages API response caching with staleTime=2min for contacts
- **Dev Mode State:** `MOCK_CONTACTS`, `MOCK_CONVERSATIONS` used instead of Convex/API

## Key Abstractions

**Workspace (Multi-tenancy):**
- Purpose: Isolate data per SME client
- Examples: `convex/workspaces.ts`, `src/app/api/workspaces/[id]/`
- Pattern: All queries/mutations filtered by `workspace_id`, route includes workspace slug
- Permissions: User must be workspace member (checked in Convex)

**Conversation (Thread Container):**
- Purpose: Link contact to message history
- Examples: `convex/conversations.ts`, `src/components/inbox/message-thread.tsx`
- Pattern: One conversation per contact per workspace, created on first inbound message
- Tracks: status (open/closed/snoozed), assigned_to, unread_count, last_message_at

**Contact (Lead/Prospect):**
- Purpose: Single source of truth for leads
- Examples: `convex/contacts.ts`, `src/app/(dashboard)/[workspace]/database/database-client.tsx`
- Schema: phone (primary key), name, email, lead_score (0-100 from ARI), lead_status, tags, metadata
- Behavior: Created on first inbound message, updated by user edits and ARI scoring

**Message (Event Record):**
- Purpose: Immutable record of communication
- Examples: `convex/messages.ts`, `src/components/inbox/message-thread.tsx`
- Schema: direction (inbound/outbound), sender_type (contact/user/bot), content, message_type
- Pattern: Never updated/deleted, only created; kapo_message_id links to WhatsApp

**ARI (AI Routing Intelligence):**
- Purpose: Decide message handling (human reply, bot response, lead score)
- Examples: `src/lib/ari/processor.ts`, `convex/ai/`
- Pattern: Triggered on inbound messages, returns routing decision and contact metadata
- Exports: scoring (0-100), handler type, next action

## Entry Points

**Web App (Authenticated):**
- Location: `src/app/(dashboard)/[workspace]/page.tsx`
- Triggers: User sign-in, workspace selection
- Responsibilities: Render dashboard with stats, activity feed, onboarding

**Public Pages:**
- Location: `src/app/page.tsx` (landing), `src/app/pricing/page.tsx`
- Triggers: Unauthenticated users
- Responsibilities: Marketing content, sign-up CTA

**Admin Dashboard:**
- Location: `src/app/api/admin/clients/route.ts`
- Triggers: Admin user
- Responsibilities: Multi-tenant admin operations

**Webhook (Kapso/WhatsApp):**
- Location: `src/app/api/webhook/kapso/route.ts`
- Triggers: Incoming WhatsApp message to Kapso number
- Responsibilities: Verify signature, normalize phone, process with ARI, store data

**Cron Jobs:**
- Location: `src/app/api/cron/appointment-reminders/route.ts`
- Triggers: Scheduled task (Vercel)
- Responsibilities: Send reminder messages

## Error Handling

**Strategy:** Try-catch at API boundaries, user-facing toast notifications, server-side logging.

**Patterns:**

1. **API Route Errors:**
   - Catch exceptions, log masked payload (PII protection)
   - Return `NextResponse.json({ error: '...' }, { status: 4xx/5xx })`
   - Frontend receives error and shows toast

   Example from `POST /api/messages/send`:
   ```typescript
   try {
     const conversation = await convex.query(api.conversations.getByIdInternal, ...)
   } catch (error) {
     console.error('[MessagesSend] Error:', error)
     return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
   }
   ```

2. **Convex Mutation Errors:**
   - Mutations throw errors if validation fails
   - Frontend Convex client catches and propagates
   - useMutation hook catches and shows toast

3. **Validation Errors:**
   - Zod schema validation in API routes
   - Return 400 with field errors
   - Frontend form displays inline errors

4. **Authentication Errors:**
   - No userId/orgId → 401
   - Frontend redirects to Clerk sign-in page

## Cross-Cutting Concerns

**Logging:**
- Approach: Console logs with step markers `[Component] Step N: ...`
- Masking: Phone numbers and sensitive data masked before logging
- Instrumentation: `src/lib/instrumentation/with-timing.ts` tracks query timing

**Validation:**
- Approach: Zod schemas in `src/lib/validations/`
- Request validation: API routes validate body before processing
- Database constraints: Convex schema enforces required fields, indexes

**Authentication:**
- User: Clerk (sign-in, organizations)
- Workspace: Verify user is member (checked in Convex queries)
- Dev Mode: Bypasses Clerk in localhost (no auth checks)
- Token: Clerk JWT passed to Convex via `setAuth(token)`

**Dev Mode (Offline Testing):**
- Triggered by: `NEXT_PUBLIC_DEV_MODE=true` + workspaceSlug==='demo'
- Behavior:
  - Server components return MOCK_CONVEX_WORKSPACE
  - Client queries skip Convex (`'skip'` parameter)
  - API routes return MOCK_CONTACTS
  - All data is static, no network calls
- Footer shows orange "Offline Mode" indicator
- Testing: Always test at `localhost:3000/demo` before deployment

---

*Architecture analysis: 2026-01-30*
