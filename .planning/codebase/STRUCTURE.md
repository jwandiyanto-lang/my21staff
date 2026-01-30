# Codebase Structure

**Analysis Date:** 2026-01-30

## Directory Layout

```
my21staff/
├── src/
│   ├── app/                        # Next.js App Router (pages + API routes)
│   │   ├── (auth)/                 # Sign-in/sign-up pages (layout group)
│   │   ├── (dashboard)/            # Protected dashboard pages (layout group)
│   │   │   └── [workspace]/        # Dynamic workspace routes
│   │   │       ├── page.tsx        # Dashboard overview
│   │   │       ├── inbox/          # Conversations view
│   │   │       ├── database/       # Contacts/leads table
│   │   │       ├── knowledge-base/ # Bot knowledge base
│   │   │       ├── settings/       # Workspace settings
│   │   │       ├── team/           # Team members
│   │   │       └── website/        # Content manager (articles, webinars)
│   │   ├── api/                    # REST API routes
│   │   │   ├── contacts/           # Contact CRUD, import, export, merge
│   │   │   ├── conversations/      # Conversation queries and updates
│   │   │   ├── messages/           # Send/receive messages
│   │   │   ├── webhook/kapso/      # WhatsApp webhook handler
│   │   │   ├── workspaces/         # Workspace queries
│   │   │   ├── tickets/            # Support ticket system
│   │   │   ├── admin/              # Admin operations
│   │   │   ├── cron/               # Scheduled jobs
│   │   │   └── portal/             # Customer-facing portal
│   │   ├── page.tsx                # Landing page
│   │   ├── pricing/page.tsx        # Pricing page
│   │   ├── security/page.tsx       # Security info
│   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   ├── providers.tsx           # Clerk + Convex + React Query setup
│   │   └── globals.css             # Tailwind base styles
│   │
│   ├── components/                 # React UI components (organized by feature)
│   │   ├── ui/                     # Base Shadcn/UI components (button, input, dialog, etc.)
│   │   ├── dashboard/              # Dashboard-specific (stats-cards, activity-feed)
│   │   ├── inbox/                  # Inbox feature (conversation-list, message-thread, filters)
│   │   ├── database/               # Database table components
│   │   ├── contact/                # Contact detail views
│   │   ├── knowledge-base/         # Knowledge base editor
│   │   ├── analytics/              # Bot performance charts
│   │   ├── skeletons/              # Loading skeletons
│   │   ├── error-boundaries/       # Error handling
│   │   ├── auth/                   # Auth-related UI
│   │   ├── landing/                # Landing page sections
│   │   └── workspace/              # Workspace-level components
│   │
│   ├── lib/                        # Utility functions and services
│   │   ├── ari/                    # AI Routing Intelligence engine
│   │   │   ├── processor.ts        # Main entry point for message processing
│   │   │   ├── scoring.ts          # Lead scoring (0-100)
│   │   │   ├── routing.ts          # Route to human/bot/escalate
│   │   │   ├── state-machine.ts    # Conversation state transitions
│   │   │   ├── context-builder.ts  # Build context for AI
│   │   │   ├── knowledge-base.ts   # Search workspace knowledge base
│   │   │   ├── qualification.ts    # Qualify leads
│   │   │   ├── scheduling.ts       # Booking system integration
│   │   │   ├── ai-router.ts        # Coordinate ARI decisions
│   │   │   ├── brain.ts            # LLM prompts and logic
│   │   │   ├── mouth.ts            # Message formatting
│   │   │   ├── handoff.ts          # Human handover logic
│   │   │   ├── types.ts            # ARI type definitions
│   │   │   ├── clients/            # LLM clients (OpenAI, etc.)
│   │   │   └── __tests__/          # ARI unit tests
│   │   │
│   │   ├── queries/                # React Query + Convex hooks
│   │   │   ├── use-contacts.ts     # Paginated contacts fetch
│   │   │   ├── use-conversations.ts
│   │   │   ├── use-messages.ts
│   │   │   ├── use-workspace-settings.ts
│   │   │   └── use-status-config.ts
│   │   │
│   │   ├── auth/                   # Authentication utilities
│   │   │   └── workspace-auth.ts   # Check workspace membership
│   │   │
│   │   ├── kapso/                  # WhatsApp API client
│   │   │   ├── client.ts           # Send messages
│   │   │   └── verify-signature.ts # Webhook signature validation
│   │   │
│   │   ├── phone/                  # Phone utilities
│   │   │   └── normalize.ts        # E.164 normalization (+62 format)
│   │   │
│   │   ├── tickets/                # Support ticket workflow
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   ├── transitions.ts      # State machine
│   │   │   ├── email.ts
│   │   │   └── tokens.ts
│   │   │
│   │   ├── email/                  # Email templates (React Email)
│   │   ├── storage/                # File storage (AWS S3 or similar)
│   │   ├── permissions/            # Role-based access control
│   │   ├── instrumentation/        # Performance monitoring
│   │   ├── config/                 # App configuration
│   │   ├── validations/            # Zod schemas for form validation
│   │   ├── utils/                  # General utilities
│   │   ├── mock-data.ts            # Mock contacts/conversations for dev mode
│   │   ├── utils.ts                # cn(), classNameMerge, etc.
│   │   ├── crypto.ts               # Encryption/decryption
│   │   ├── lead-status.ts          # Lead status constants
│   │   └── landing-constants.ts    # Landing page copy
│   │
│   ├── types/                      # TypeScript type definitions
│   │   └── database.ts             # Convex schema types (Contact, Conversation, etc.)
│   │
│   ├── emails/                     # Email component templates
│   │   └── components/
│   │
│   └── hooks/                      # Custom React hooks
│       ├── use-mobile.ts
│       └── use-ensure-user.ts      # Wait for Clerk user initialization
│
├── convex/                         # Backend database and functions
│   ├── schema.ts                   # Convex table definitions
│   ├── workspaces.ts               # Workspace queries/mutations
│   ├── contacts.ts                 # Contact CRUD
│   ├── conversations.ts            # Conversation queries
│   ├── messages.ts                 # Message storage
│   ├── contactNotes.ts             # Internal notes on contacts
│   ├── tickets.ts                  # Support tickets
│   ├── ari.ts                      # ARI config and queries
│   ├── dashboard.ts                # Dashboard stats queries
│   ├── organizations.ts            # Clerk organization sync
│   ├── users.ts                    # User profile queries
│   ├── cms.ts                      # Content management (articles, webinars)
│   ├── quickReplies.ts             # Saved response templates
│   ├── kapso.ts                    # Kapso configuration
│   ├── n8n.ts                      # n8n workflow triggers
│   ├── auth.config.ts              # Clerk auth setup
│   ├── http.ts                     # HTTP endpoint handlers
│   ├── storage.ts                  # File storage mutations
│   │
│   ├── ai/                         # AI/ARI decision logic
│   │   ├── brain.ts                # LLM integration
│   │   ├── mouth.ts                # Response formatting
│   │   ├── context.ts              # Context building
│   │   └── costTracker.ts          # API cost tracking
│   │
│   ├── http/                       # HTTP handlers (separate from main functions)
│   │   └── kapso.ts                # Kapso webhook handler
│   │
│   ├── lib/                        # Convex utilities
│   │   └── auth.ts                 # Authentication helpers
│   │
│   └── _generated/                 # Auto-generated Convex types (DO NOT EDIT)
│       ├── api.d.ts
│       ├── server.d.ts
│       └── dataModel.d.ts
│
├── public/                         # Static assets
│   ├── assets/
│   │   ├── avatars/
│   │   └── problems/               # Product images
│   └── landing/                    # Landing page media
│
├── docs/                           # Developer documentation
│   ├── DEVELOPMENT-RULES.md        # Code patterns, linting rules
│   └── LOCAL-DEVELOPMENT.md        # Dev mode setup guide
│
├── business/                       # Non-code business documents
│   ├── brand/                      # Logo, brand guidelines
│   ├── brainstorm/                 # Feature ideas
│   ├── bots/                       # Bot persona definitions
│   └── clients/                    # Reference client files
│
└── .planning/                      # GSD workflow
    ├── codebase/                   # Codebase analysis (this file)
    ├── phases/                     # Active implementation phases
    ├── milestones/                 # Milestone tracking
    └── migrations/                 # Data migration scripts
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js 15 App Router pages and API routes
- Contains: Server/client components, REST endpoints, middleware
- Key files: `page.tsx` (pages), `layout.tsx` (layouts), `route.ts` (API)

**`src/app/(auth)/`:**
- Purpose: Authentication pages (not require workspace context)
- Contains: Clerk sign-in/sign-up wrapped in ClerkProvider
- Rendered for: Unauthenticated users

**`src/app/(dashboard)/[workspace]/`:**
- Purpose: Protected workspace routes (require workspace membership)
- Contains: Dashboard, inbox, database, settings pages
- Pattern: All routes prefixed with workspace slug: `/demo/inbox`, `/workspace-slug/database`
- Access: Checked by Convex queries (user must be workspace member)

**`src/app/api/`:**
- Purpose: REST API endpoints (alternative to Convex directly)
- Used by: Frontend fetch calls, external webhooks, third-party integrations
- Dev mode: Returns mock data instead of querying Convex
- Pattern: Auth via Clerk, then Convex query, then response

**`src/components/`:**
- Purpose: Reusable React components
- Organization: By feature (inbox/, database/, etc.) not by type
- Naming: PascalCase (ConversationList.tsx), one component per file
- Exports: Default export of main component, named exports for types/helpers

**`src/lib/`:**
- Purpose: Shared business logic, utilities, services
- Organization: By domain (ari/, kapso/, tickets/) or concern (queries/, auth/)
- Naming: camelCase (useContacts.ts), functions named clearly (normalizePhone())
- Imports: Organized by external, then internal

**`src/lib/ari/`:**
- Purpose: AI Routing Intelligence - decides how to handle inbound messages
- Contains: Scoring, routing decision, context building, state machine
- Triggered by: `POST /api/webhook/kapso` after message normalized
- Output: Routing decision + contact score update

**`src/lib/queries/`:**
- Purpose: React Query + Convex hooks for fetching data
- Pattern: `useFoo()` returns `{ data, isLoading, error }` from React Query
- Caching: staleTime 1-2 min, refetchOnWindowFocus=false
- Mutations: `useUpdateFoo()` for writes, handles optimistic updates

**`src/types/database.ts`:**
- Purpose: TypeScript types matching Convex schema
- Contains: Contact, Conversation, Message, Workspace, etc.
- Usage: Import types for component props, API responses
- Pattern: Aligned with `convex/schema.ts` (same field names)

**`convex/`:**
- Purpose: Backend database (Convex backend-as-a-service)
- Contains: Schema (tables), queries (read), mutations (write), HTTP handlers
- Auth: Convex auth middleware checks user permission
- Real-time: Queries subscribed from frontend via `useQuery()`

**`convex/schema.ts`:**
- Purpose: Define all database tables and indexes
- Tables: workspaces, contacts, conversations, messages, workspaceMembers, articles, webinars, etc.
- Indexes: For common filters (by_workspace, by_phone, by_assigned)

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Landing page (unauthenticated)
- `src/app/layout.tsx`: Root layout (fonts, metadata, Providers)
- `src/app/(dashboard)/[workspace]/page.tsx`: Dashboard (main authenticated page)
- `src/app/(auth)/sign-in/page.tsx`: Clerk sign-in
- `src/app/providers.tsx`: Clerk + Convex + React Query initialization

**Configuration:**
- `.env.local`: Local environment variables (CONVEX_URL, CLERK_KEY)
- `tsconfig.json`: TypeScript config with path alias `@/*` = `src/`
- `next.config.ts`: Next.js config
- `convex/auth.config.ts`: Clerk JWT validation
- `convex/schema.ts`: Convex schema

**Core Logic:**
- `src/app/api/webhook/kapso/route.ts`: Inbound WhatsApp message handler
- `src/app/api/messages/send/route.ts`: Send message via Kapso
- `src/lib/ari/processor.ts`: ARI message processing engine
- `convex/contacts.ts`: Contact queries/mutations
- `convex/dashboard.ts`: Stats queries for dashboard

**Testing:**
- `src/lib/ari/__tests__/`: ARI unit tests
- `src/lib/mock-data.ts`: Dev mode mock data (replaces Convex)

## Naming Conventions

**Files:**

- **Page components:** `page.tsx` (Next.js convention)
- **Client components:** `*-client.tsx` (explicit `'use client'`)
- **Server components:** `*-server.tsx` (default, optional)
- **API routes:** `route.ts` in `api/` directories
- **Components:** PascalCase + `.tsx` (e.g., `ConversationList.tsx`)
- **Utilities/hooks:** camelCase + `.ts` (e.g., `useContacts.ts`, `normalizePhone.ts`)
- **Types:** `types.ts` or domain-specific (e.g., `types/database.ts`)
- **Tests:** `*.test.ts` or `*.spec.ts` in `__tests__/` directory

**Directories:**

- **Feature directories:** kebab-case, plural when collection (e.g., `src/components/inbox/`, `convex/`)
- **Layout groups:** (parentheses) for logical grouping without URL impact (e.g., `(auth)`, `(dashboard)`)
- **Segment routes:** [brackets] for dynamic segments (e.g., `[workspace]`, `[id]`)
- **Catch-all routes:** [...segments] for flexible routing

**Code Identifiers:**

- **Variables/functions:** camelCase (e.g., `workspaceId`, `normalizePhone()`)
- **Components/classes:** PascalCase (e.g., `DashboardClient`, `MessageThread`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MOCK_CONTACTS`, `PAGE_SIZE`)
- **Types/interfaces:** PascalCase (e.g., `Contact`, `ConversationWithContact`)

## Where to Add New Code

**New Feature:**
- **Server page:** `src/app/(dashboard)/[workspace]/[feature]/page.tsx`
- **Client component:** `src/app/(dashboard)/[workspace]/[feature]/[feature]-client.tsx`
- **UI components:** `src/components/[feature]/[ComponentName].tsx`
- **Hooks/queries:** `src/lib/queries/use-[feature].ts`
- **API route:** `src/app/api/[resource]/route.ts`
- **Convex functions:** `convex/[resource].ts`
- **Types:** Add to `src/types/database.ts` if data structure related

**Example: Adding "Tasks" feature:**
- Page: `src/app/(dashboard)/[workspace]/tasks/page.tsx`
- Client: `src/app/(dashboard)/[workspace]/tasks/tasks-client.tsx`
- Components: `src/components/tasks/task-list.tsx`, `src/components/tasks/task-card.tsx`
- Hook: `src/lib/queries/use-tasks.ts`
- API: `src/app/api/tasks/route.ts` (GET, POST)
- Convex: `convex/tasks.ts` (define task table in schema, add queries/mutations)
- Types: Update `src/types/database.ts` with `Task` interface

**New Component:**
- Location: `src/components/[feature]/[ComponentName].tsx`
- Pattern: Export named function component, type props interface
- Example:
  ```typescript
  // src/components/tasks/task-card.tsx
  interface TaskCardProps {
    task: Task
    onSelect: (id: string) => void
  }
  export function TaskCard({ task, onSelect }: TaskCardProps) {
    return ...
  }
  ```

**Utilities/Helpers:**
- Location: `src/lib/[domain]/[utility].ts` or `src/lib/utils/[name].ts`
- Pattern: Pure functions, no side effects
- Example: `src/lib/phone/normalize.ts` exports `normalizePhone()`

**Middleware/Auth:**
- Location: `src/lib/auth/[checker].ts`
- Pattern: Check workspace membership, user role
- Used by: API routes before Convex calls

## Special Directories

**`convex/_generated/`:**
- Purpose: Auto-generated Convex types and API client
- Generated by: `convex deploy` or `npm run convex`
- Committed: Yes (needed for type safety in dev)
- Modified: Never manually - regenerates automatically

**`src/lib/mock-data.ts`:**
- Purpose: Dev mode fallback data (localhost testing without Convex)
- Generated: No, hand-written
- Committed: Yes
- Structure: MOCK_CONTACTS array, MOCK_CONVEX_WORKSPACE object, helper functions

**`public/`:**
- Purpose: Static assets served by Next.js
- Generated: No
- Committed: Yes
- Served from: `/` root path (e.g., `public/logo.svg` → `/logo.svg`)

**`.planning/`:**
- Purpose: GSD workflow and codebase documentation
- Generated: Some files (by GSD), some hand-written
- Committed: Yes
- Key files: `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/phases/`

**`docs/`:**
- Purpose: Developer guides and documentation
- Generated: No, hand-written
- Committed: Yes
- Key files: `DEVELOPMENT-RULES.md`, `LOCAL-DEVELOPMENT.md`

---

*Structure analysis: 2026-01-30*
