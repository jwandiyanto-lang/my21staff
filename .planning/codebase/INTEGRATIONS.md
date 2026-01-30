# External Integrations

**Analysis Date:** 2026-01-30

## APIs & External Services

**Messaging (Kapso/Meta WhatsApp Business API):**
- Service: Kapso (WhatsApp Business API wrapper)
- What it's used for: Send/receive WhatsApp messages, manage conversations
- SDK/Client: Custom SDK wrapper at `src/lib/kapso/client.ts`
- API Endpoint: `https://api.kapso.ai/meta/whatsapp/v24.0/{phoneId}/messages`
- Auth: Bearer token in header (`Authorization: Bearer {KAPSO_API_KEY}`)
- Environment vars: `KAPSO_API_KEY`, `KAPSO_WEBHOOK_SECRET`, `NEXT_PUBLIC_KAPSO_PHONE_NUMBER`
- Files: `src/lib/kapso/client.ts`, `src/lib/kapso/verify-signature.ts`, `src/app/api/webhook/kapso/route.ts`

**AI/LLM Services:**

- **Grok (xAI)**
  - Service: Grok AI model for conversational responses
  - What it's used for: Generate AI responses for lead engagement (ARI - AI Router)
  - SDK/Client: OpenAI SDK with custom baseURL
  - API Endpoint: `https://api.x.ai/v1`
  - Models: `grok-3` (faster, default), `grok-4`
  - Auth: Bearer token in header (`Authorization: Bearer {GROK_API_KEY}`)
  - Environment var: `GROK_API_KEY` (prefix: `xai-`)
  - Files: `src/lib/ari/clients/grok.ts`, `src/lib/ari/ai-router.ts`

- **Sea-Lion (via Ollama)**
  - Service: SEA-LION v4 27B model via Ollama on Tailscale private network
  - What it's used for: Alternative AI model for A/B testing, deterministic model selection per contact
  - SDK/Client: OpenAI SDK with custom baseURL pointing to Ollama
  - API Endpoint: `http://100.113.96.25:11434/v1` (Tailscale private IP)
  - Model: `aisingapore/Gemma-SEA-LION-v4-27B-IT`
  - Auth: Dummy key `ollama` (Ollama doesn't require authentication)
  - Environment var: `SEALION_URL` (optional, defaults to above), `OLLAMA_BASE_URL` (alternative)
  - Files: `src/lib/ari/clients/sealion.ts`, `src/lib/ari/ai-router.ts`

- **AI Router (Contact-based model selection)**
  - Deterministic A/B testing: Hashes contact ID to select Grok or Sea-Lion
  - Ensures same contact always receives same model
  - Configurable weight: `selectModel(contactId, grokWeight)` (default 50/50)
  - Files: `src/lib/ari/ai-router.ts`

**Email (Resend):**
- Service: Resend transactional email service
- What it's used for: Send appointment reminders, ticket notifications
- SDK/Client: Resend SDK (`resend` package)
- Auth: API key in header (`Authorization: Bearer {RESEND_API_KEY}`)
- Environment var: `RESEND_API_KEY` (prefix: `re_`)
- From email: Configured in `src/lib/email/resend.ts`
- Files: `src/lib/email/resend.ts`, `src/lib/email/send.ts`, `src/lib/tickets/email.ts`
- Cron: Appointment reminders via `/api/cron/appointment-reminders` (every 15 min)

## Data Storage

**Database:**
- Type: Convex Backend-as-a-Service
- Connection: HTTP client via `ConvexHttpClient` or React hooks
- URL: `NEXT_PUBLIC_CONVEX_URL` (e.g., `https://intent-otter-212.convex.cloud`)
- Project: `intent-otter-212`
- Client: `convex` package + `convex/react`
- Authentication: Clerk JWT tokens passed via `convex.setAuth(token)`
- Schema location: `convex/schema.ts`

**Schema Tables:**
- `workspaces` - Tenants, Kapso credentials, Meta access token
- `workspaceMembers` - User assignments to workspaces
- `contacts` - Leads with phone, name, score, status, tags
- `conversations` - Conversation threads linked to contacts
- `messages` - Individual messages (inbound/outbound) with Kapso message IDs
- `contactNotes` - Notes on contacts
- `quickReplies` - Templated response messages
- `tickets` - Support tickets (not CRM)
- `ariConfig` - ARI (AI) configuration per workspace
- Indexes: By workspace, contact, phone, timestamp, Kapso message ID

**File Storage:**
- Type: None detected
- Convex file storage available (optional)

**Caching:**
- TanStack React Query - Client-side query caching with 1-minute stale time
- Convex real-time subscriptions - Live data sync
- No Redis or external cache detected

## Authentication & Identity

**Auth Provider:**
- Primary: Clerk (Authentication-as-a-Service)
- Clerk Features:
  - SSO integration with JWT tokens
  - Organization management (multi-tenancy)
  - User creation, sign-in, sign-up flows
- Implementation: `@clerk/nextjs` provider at `src/app/providers.tsx`
- Routes:
  - Sign in: `/sign-in` (customizable)
  - Sign up: `/sign-up` (customizable)
  - Post-auth redirect: `/dashboard`
- JWT Flow: Clerk → Convex via `getToken({ template: 'convex' })`
- Dev Mode: Bypasses Clerk in local development (mock auth)
- Files: `src/app/providers.tsx`, `src/middleware.ts`, `src/lib/auth/workspace-auth.ts`

**Authorization:**
- Workspace-based multi-tenancy
- Clerk organizations link users to workspaces
- Convex queries validate `workspace_id` in auth context
- Dev mode uses mock workspace ID from `src/lib/mock-data.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected in codebase
- Error handling: Try-catch blocks in API routes
- Console logging in development

**Logs:**
- Console logging throughout (browser and server)
- PII masking in webhook handler (phone numbers masked for logging)
- Vercel serverless logs via Vercel dashboard
- Files: `src/lib/instrumentation/with-timing.ts` (request timing instrumentation)

**Performance Monitoring:**
- Vercel Speed Insights 1.3.1 - Core Web Vitals tracking
- Next.js bundle analysis (optional via `ANALYZE=true`)
- Request timing instrumentation: `src/lib/instrumentation/with-timing.ts`

## CI/CD & Deployment

**Hosting:**
- Vercel - Primary hosting for Next.js app
- Auto-deployment on `master` branch push

**CI Pipeline:**
- Vercel Deployment Workflow (automatic on push)
- Pre-commit hooks: `npm run pre-commit` (lint + type-check)
- No GitHub Actions or external CI detected

**Build Process:**
- Next.js build: `npm run build`
- Convex schema deployment: `npm run deploy` (runs `scripts/deploy-convex.js`)
- Vercel handles Next.js build and deployment

**Cron Jobs:**
- `/api/cron/appointment-reminders` - Runs every 15 minutes via Vercel Crons
- Uses Vercel `waitUntil` to keep functions alive for async processing

## Environment Configuration

**Required env vars for integration:**

Convex:
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL

Clerk:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN`

Kapso/WhatsApp:
- `KAPSO_API_KEY`
- `KAPSO_WEBHOOK_SECRET`
- `NEXT_PUBLIC_KAPSO_PHONE_NUMBER`

Email:
- `RESEND_API_KEY`

AI:
- `GROK_API_KEY` (optional, required for Grok responses)
- `SEALION_URL` (optional, defaults to Tailscale IP)

Other:
- `ENCRYPTION_KEY` - Base64-encoded 32-byte key for credential encryption

**Secrets Storage:**
- Development: `.env.local` (gitignored)
- Production: Vercel dashboard environment variables
- Sensitive values encrypted at rest: `src/lib/crypto.ts` handles encryption/decryption

## Webhooks & Callbacks

**Incoming Webhooks:**

- **Kapso/WhatsApp Webhook:**
  - Endpoint: `POST /api/webhook/kapso`
  - Triggers: Incoming WhatsApp messages, status updates
  - Signature verification: HMAC-SHA256 via `KAPSO_WEBHOOK_SECRET`
  - Signature header: `x-kapso-signature`
  - Implementation: `src/app/api/webhook/kapso/route.ts`
  - Processing: Async with `waitUntil` to keep function alive
  - Flow:
    1. Verify webhook signature
    2. Extract phone number ID and find workspace
    3. Create or find contacts from phone numbers
    4. Create or find conversations
    5. Store messages in Convex
    6. Process with ARI (AI) if enabled for workspace
  - Payload types: Meta/WhatsApp Business API format with messages, contacts, statuses
  - Returns: 200 OK immediately, processes asynchronously

- **Webhook Verification (GET):**
  - Endpoint: `GET /api/webhook/kapso`
  - Query param: `hub.challenge` or `challenge`
  - Returns: Plain text challenge for webhook setup verification

**Outgoing Webhooks:**
- None detected (one-way integrations)

**Message Flow:**
1. User sends message in inbox UI
2. API route `/api/messages/send` authenticates via Clerk
3. Retrieves contact and workspace from Convex
4. Decrypts Kapso API key
5. Sends via Kapso API
6. Stores message in Convex with Kapso message ID
7. Real-time sync via Convex subscriptions

**ARI Processing Pipeline:**
1. Webhook receives inbound message
2. Workspace checked for ARI config
3. Message content extracted
4. Kapso credentials retrieved
5. `processWithARI()` called asynchronously
6. AI response generated (Grok or Sea-Lion)
7. Response sent back via Kapso

## Data Flow Architecture

```
Inbound:
  WhatsApp → Kapso → Webhook (/api/webhook/kapso)
    → Verify signature
    → Get/Create contact & conversation
    → Store message in Convex
    → [Optional] Process with ARI
    → Generate AI response
    → Send via Kapso API

Outbound:
  Dashboard → Send button
    → /api/messages/send (POST)
    → Clerk auth
    → Get contact/conversation/workspace
    → Decrypt Kapso token
    → Send via Kapso API
    → Store in Convex
    → Real-time update via subscriptions
```

## Integration Testing

**Webhook Testing:**
- NGrok available for local webhook tunneling: `@ngrok/ngrok`, `ngrok` packages
- Webhook signature verification enables testing with real Kapso webhooks
- Files: `src/lib/kapso/verify-signature.ts` (HMAC-SHA256 validation)

## Migration & Legacy

**Supabase Legacy:**
- Old ID references: Tables have `supabaseId` field for migration tracking
- No active Supabase queries detected (fully migrated to Convex)

---

*Integration audit: 2026-01-30*
