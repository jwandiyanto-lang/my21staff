# Production Deployment & Testing Features

**Project:** my21staff WhatsApp CRM + AI Team
**Dimension:** Production-ready deployment and testing requirements
**Researched:** 2026-01-28
**Context:** v3.4 features moving from localhost to production with live Kapso bot activation

---

## Table of Contents

1. [Pre-Deployment Checklist (Localhost Polish)](#pre-deployment-checklist-localhost-polish)
2. [Deployment Verification (Environment Setup)](#deployment-verification-environment-setup)
3. [Live Bot Activation (Webhook & Integration)](#live-bot-activation-webhook--integration)
4. [Testing & Validation Framework](#testing--validation-framework)
5. [Success Criteria for "Production Ready"](#success-criteria-for-production-ready)
6. [Rollback & Contingency Plans](#rollback--contingency-plans)

---

## Pre-Deployment Checklist (Localhost Polish)

**Goal:** Verify all v3.4 features work correctly in `/demo` offline mode before deploying.

### 1. Dev Mode Foundations

#### 1.1 Environment Verification
- **Status:** Critical foundation
- **Complexity:** Low
- **What to test:**
  ```bash
  # Verify dev mode flag is set
  cat .env.local | grep NEXT_PUBLIC_DEV_MODE
  # Expected: NEXT_PUBLIC_DEV_MODE=true

  # Verify ClerkProvider is always present (never skipped)
  # Check: src/app/providers.tsx wraps children with ClerkProvider
  ```
- **Why it matters:** Missing dev mode or wrong provider configuration causes crashes on localhost AND production
- **Prevention:** Automated check before deploying
  - Dev mode must be disabled in production (NODE_ENV check prevents accidents)
  - ClerkProvider must wrap all children even in dev mode
  - Tests must verify this doesn't regress

#### 1.2 Hook Rules Compliance
- **Status:** Critical (known issue in v3.4)
- **Complexity:** Medium
- **What to test:**
  - Scan all custom hooks for conditional hook calls
  - Check pattern: hooks called unconditionally, results used conditionally
  - Verify all useAuth/useUser calls work in both `/demo` and production routes

  ```tsx
  // ✅ CORRECT pattern
  const clerkAuth = useAuth()      // Called unconditionally
  const userId = isDevMode
    ? 'dev-user-001'
    : clerkAuth.userId            // Result used conditionally

  // ❌ WRONG pattern (will crash)
  if (isDevMode) return mockData
  const { userId } = useAuth()     // Hook called conditionally
  ```
- **Critical files to audit:**
  - `src/lib/queries/use-workspace-settings.ts`
  - `src/lib/queries/use-contacts.ts`
  - `src/lib/queries/use-conversations.ts`
  - `src/lib/queries/use-typing-indicator.ts`
  - Any custom hook using Clerk or Convex

#### 1.3 Mock Data Completeness
- **Status:** Table stakes
- **Complexity:** Low
- **What to test:**
  - All `/demo` routes return complete mock data without errors
  - Footer shows "Offline Mode" with orange dot indicator
  - No network calls to Convex or Clerk when visiting `/demo`

  ```bash
  npm run dev
  # Open DevTools Network tab
  # Visit http://localhost:3000/demo
  # Verify: No API calls, footer shows "Offline Mode"
  ```
- **Why it matters:** `/demo` is the primary testing environment for all UI/UX

### 2. Core CRM Features (Localhost)

#### 2.1 Dashboard
- **Features to verify:**
  - Page loads at `/demo` without errors
  - Stats cards render (mock data shows 0 contacts, 0 messages)
  - Activity feed displays (empty state should be graceful)
  - Quick actions are clickable and navigate correctly
  - Sidebar navigation works
  - Footer shows correct status indicator

#### 2.2 Inbox
- **Features to verify:**
  - Page loads at `/demo/inbox` without errors
  - Filter bar renders (Active/All toggle, Status/Tags dropdowns)
  - Empty state message shows when no conversations
  - Compose input renders but shows note about offline mode
  - Message list UI structure is correct
  - Real-time subscription doesn't crash (graceful in dev mode)

#### 2.3 Database
- **Features to verify:**
  - Page loads at `/demo/database` without errors
  - Contact table renders (empty state)
  - Add Contact form is accessible
  - Search/filter UI works
  - Pagination logic doesn't error on empty data
  - Tags display correctly

#### 2.4 Settings
- **Features to verify:**
  - Page loads at `/demo/settings` without errors
  - Team management UI renders (mock team member)
  - Your Intern tab appears and loads without errors
  - All 5 Your Intern config tabs render:
    1. Persona — Bot name, greeting style, language, tone
    2. Flow — Stage configuration
    3. Database — Knowledge base and documents
    4. Scoring — Lead score configuration
    5. Slots — Booking slot configuration
  - Form inputs are responsive (no UI jumps)
  - Settings save button works (in dev mode, should show success toast)

### 3. Your Intern Admin Interface (Localhost)

#### 3.1 Configuration Tabs

**3.1.1 Persona Tab**
- Checkbox state persists during session (no network call in dev)
- Global AI toggle (ariConfig.enabled) functions correctly
- Form fields: bot_name, greeting_style, language, tone toggles
- Toast notifications on save (dev mode: simulated)
- Error states graceful (no crash on invalid input)

**3.1.2 Flow Tab**
- Stage configuration UI renders
- Add/edit/delete flow stages without errors
- Transitions between stages display correctly
- Auto-handoff conditions show logic preview
- No console errors when toggling complex options

**3.1.3 Database Tab**
- Knowledge base entries load (or show empty gracefully)
- Add knowledge entry form works
- Document uploads don't actually upload (dev mode: mocked)
- Document status tracking UI renders

**3.1.4 Scoring Tab**
- Scoring configuration shows all factors
- Weight sliders are responsive
- Bonus/penalty toggles work
- Preview shows estimated score for sample data
- Unit tests pass: `npm test -- src/lib/ari/__tests__/scoring.test.ts`

**3.1.5 Slots Tab**
- Booking slot display and configuration
- Add/edit/delete slots without errors
- Time slot formatting is correct (WIB timezone)
- Capacity limits are respected
- No crashes on edge cases (midnight slots, full days)

#### 3.2 Error Boundaries
- **What to test:**
  - Intentionally break a Your Intern component
  - Verify error boundary catches it (displays error UI, not white screen)
  - Other tabs remain functional
  - Error can be dismissed/recovered

#### 3.3 Dev Mode Bypass
- **What to test:**
  - Verify Your Intern debug page renders without Clerk
  - Confirm all navigation links work
  - Verify no useAuth/useUser calls cause crashes
  - Check localStorage doesn't throw errors

### 4. AI Bot (ARI) Flow - Localhost Simulation

#### 4.1 State Machine Logic
- **What to test:**
  - `calculateLeadScore()` produces correct scores
  - `getLeadTemperature()` categorizes correctly (hot/warm/cold)
  - State transitions work as expected
  - Unit tests all pass: `npm test -- src/lib/ari/__tests__/scoring.test.ts`

#### 4.2 Message Processing Simulation
- **What to test:**
  - ARI processor doesn't crash on mock data
  - Response generation logic works (no live API calls needed yet)
  - Handoff detection logic triggers correctly
  - No unhandled promise rejections

#### 4.3 Configuration Hot-Reload
- **What to test:**
  - Workspace settings load without errors
  - Persona/Flow/Scoring config reads correctly
  - Changes in settings don't require app restart
  - No stale config cached on subsequent loads

### 5. API Route Health (Localhost)

#### 5.1 Contacts API
- **Endpoint:** `/api/contacts`
- **Dev mode behavior:** Returns mock contact data or empty array
- **What to test:**
  - GET returns valid structure (no 500 errors)
  - POST with mock data doesn't crash
  - Response headers are correct (Content-Type, etc.)

#### 5.2 Conversations API
- **Endpoint:** `/api/conversations`
- **Dev mode behavior:** Returns empty array (no Convex subscription in dev)
- **What to test:**
  - GET returns valid structure
  - No authentication errors in dev mode

#### 5.3 Workspace Settings API
- **Endpoint:** `/api/workspaces/[id]/settings`
- **Dev mode behavior:** Returns mock settings
- **What to test:**
  - GET returns valid ARI config structure
  - PUT doesn't actually save (dev mode: mocked)
  - No console errors on invalid workspace ID

#### 5.4 Messages Webhook (Validation Only)
- **Endpoint:** `/api/webhook/kapso`
- **Dev mode behavior:** N/A (webhooks don't fire in dev)
- **What to test:**
  - GET endpoint responds to challenge query param
  - Signature verification code doesn't have syntax errors
  - Response structure is correct

### 6. UI/UX Polish

#### 6.1 Responsive Design
- Test on multiple viewport sizes:
  - Mobile: 375px (iPhone)
  - Tablet: 768px (iPad)
  - Desktop: 1920px (full width)
- Check:
  - No horizontal scrollbars
  - Touch targets >= 44px
  - Text is readable (font sizes, contrast)

#### 6.2 Component State Management
- **Verify:**
  - Form state doesn't persist unexpectedly
  - Dropdowns close when clicked away
  - Modals can be dismissed
  - Loading states show placeholders (not spinners forever)
  - Error messages are clear and actionable

#### 6.3 Accessibility Basics
- **Verify:**
  - All form inputs have associated labels
  - Buttons have meaningful text (not just icons)
  - Modals have close buttons (visible or via Escape)
  - Focus indicators are visible (keyboard navigation)

#### 6.4 Performance (Localhost Baseline)
- **Measure:**
  - Page load time at `/demo` (target: < 2s)
  - Sidebar navigation responsiveness (target: < 100ms)
  - Your Intern tab switching (target: instant)
  - Form submission (target: < 500ms in dev mode)
- **Tools:**
  - Chrome DevTools Performance tab
  - Lighthouse audit
  - Record metrics for production comparison

---

## Deployment Verification (Environment Setup)

**Goal:** Ensure production environment is configured correctly before pushing live data.

### 1. Environment Variables (Production)

#### 1.1 Required Variables Checklist
Create `.env.production` with all required keys. Test each before deploying:

| Variable | Type | Source | Test |
|----------|------|--------|------|
| `NEXT_PUBLIC_CONVEX_URL` | Public | Convex Cloud | Verify Convex dashboard has this URL |
| `CONVEX_DEPLOYMENT_KEY` | Private | Vercel env var | Should be set in Vercel, not in git |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk dashboard | Try signing in with valid key |
| `CLERK_SECRET_KEY` | Private | Clerk dashboard | Should be set in Vercel env vars |
| `CLERK_JWT_ISSUER_DOMAIN` | Private | Clerk dashboard | Format: https://your-domain.clerk.accounts.dev |
| `KAPSO_API_KEY` | Private | Kapso dashboard | Test with: `curl -H "Authorization: Bearer $KAPSO_API_KEY"` |
| `KAPSO_WEBHOOK_SECRET` | Private | Kapso webhook settings | Save from Kapso webhook config |
| `NEXT_PUBLIC_KAPSO_PHONE_NUMBER` | Public | Kapso bot number | Should be Eagle Overseas WhatsApp number |
| `ENCRYPTION_KEY` | Private | Generate with `openssl rand -base64 32` | Test encryption round-trip |
| `RESEND_API_KEY` | Private | Resend dashboard | Test with: `curl -X POST https://api.resend.com/emails ...` |
| `GROK_API_KEY` | Private | Grok dashboard | Test with API call |
| `OLLAMA_BASE_URL` | Private | Local setup (optional) | Test with: `curl http://100.113.96.25:11434/api/tags` |
| `NEXT_PUBLIC_DEV_MODE` | Public | Should be `false` | Verify: `echo $NEXT_PUBLIC_DEV_MODE` returns `false` |

#### 1.2 Security Validation
- **Never commit secrets to git**
  - All `.env` files should be in `.gitignore`
  - Verify: `git status | grep .env` returns nothing
- **Rotate webhook secrets periodically**
  - Note new `KAPSO_WEBHOOK_SECRET` in password manager
  - Update Vercel env vars via dashboard
- **Encrypt sensitive fields**
  - API keys should be rotated before first production use
  - Test encryption roundtrip: `safeDecrypt(encrypt(apiKey)) === apiKey`

#### 1.3 Environment Parity Testing
- **Verify production env matches localhost config:**
  ```bash
  # In localhost: test with real Convex connection
  NEXT_PUBLIC_CONVEX_URL=https://intent-otter-212.convex.cloud npm run dev
  # Navigate to /eagle-overseas (real org)
  # Verify data loads and is correct

  # Test each service:
  # - Clerk sign-in should work
  # - Convex queries should return data
  # - Kapso credentials should load
  ```

### 2. Database (Convex Cloud)

#### 2.1 Schema Verification
- **Verify Convex has all required tables:**
  - `workspaces` — with kapso_phone_id and ari_config fields
  - `contacts` — with phone, workspace_id, merge tracking
  - `conversations` — with contact_id, unread_count
  - `messages` — with kapso_message_id, metadata
  - `ari_config` — with bot_name, flow_stages, scoring_config, slots
  - `ari_conversations` — with state machine state
  - `knowledge_base` — with destinations, universities

  Check via Convex dashboard:
  - https://dashboard.convex.dev → Select project → Data tab
  - Verify table exists and has >0 documents (or is correct empty)

#### 2.2 Data Migration
- **Verify data integrity after migration from localhost:**
  - If migrating existing data:
    - Count records in Convex: `SELECT COUNT(*) FROM contacts`
    - Compare with local: `SELECT COUNT(*) FROM contacts` (if exported)
    - Spot-check 10 random records for accuracy
  - If fresh start:
    - Create test workspace in production
    - Verify workspace settings save and load
    - Add test contact and verify it appears

#### 2.3 Indexes & Performance
- **Check Convex indexes are set up:**
  - `workspaces` — by `kapso_phone_id` (for webhook lookup)
  - `contacts` — by `phone`, `workspace_id` (for lookups)
  - `conversations` — by `contact_id`, `workspace_id`
  - `messages` — by `conversation_id`, `kapso_message_id`
  - `ari_config` — by `workspace_id`

  Verify in Convex dashboard:
  - Functions tab → View Convex schema
  - Each queryable field should have corresponding index

#### 2.4 RLS (Row-Level Security)
- **Verify workspace_id scoping is correct:**
  ```bash
  # In Convex dashboard, test:
  curl https://intent-otter-212.convex.cloud/api/query/contacts.list \
    -H "Authorization: Bearer $CONVEX_CLIENT_KEY" \
    -H "Content-Type: application/json" \
    -d '{"workspace_id": "eagle-workspace-id"}'
  # Should only return contacts for that workspace
  ```

### 3. Authentication (Clerk)

#### 3.1 Organization Setup
- **Verify Eagle Overseas org exists:**
  - Go to Clerk dashboard → Organizations
  - Find: `eagle-overseas` (org_38fXP0PN0rgNQ2coi1KsqozLJYb)
  - Verify owner is Jonathan (founder)
  - Verify at least one member has Owner role

#### 3.2 User Migration Validation
- **Verify test user can sign in:**
  - Navigate to: https://my21staff.com/sign-in (or production URL)
  - Sign in with test account
  - Verify redirected to `/dashboard`
  - Verify workspace loads with correct data

#### 3.3 JWT Configuration
- **Verify Clerk JWT is configured for Convex:**
  - Clerk dashboard → API Keys → JWT Templates
  - Verify template exists and includes:
    - Issuer: Clerk issuer domain
    - Claims: `org_id`, `org_slug` (for workspace scoping)
  - Convex dashboard → Settings → Auth providers
  - Verify Clerk is configured with correct issuer domain

#### 3.4 Webhook Verification (from Clerk)
- **Optional:** Clerk can send org/user webhooks
  - If configured, verify endpoint is accessible from Clerk
  - Test: Create new user in Clerk, verify webhook fires

### 4. Third-Party Integrations

#### 4.1 Kapso API Connectivity
- **Test API key works:**
  ```bash
  curl -X GET https://api.kapso.ai/accounts \
    -H "Authorization: Bearer $KAPSO_API_KEY"
  # Should return 200 with account details
  ```
- **Test webhook signing (validation only):**
  - Kapso dashboard → Webhooks → Settings
  - Verify webhook secret is set
  - Note the secret and configure in Vercel as `KAPSO_WEBHOOK_SECRET`

#### 4.2 Resend Email Service
- **Test email sending:**
  ```bash
  curl -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "from": "noreply@my21staff.com",
      "to": "test@example.com",
      "subject": "Test",
      "text": "Test email"
    }'
  # Should return 200 with email_id
  ```
- **Verify sender domain is verified in Resend:**
  - Resend dashboard → Domains
  - my21staff.com should show "Verified"
  - If not, add CNAME records per Resend instructions

#### 4.3 Grok AI API (Optional)
- **Test API key works:**
  ```bash
  curl -X POST https://api.x.ai/v1/chat/completions \
    -H "Authorization: Bearer $GROK_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model": "grok-beta", "messages": [{"role": "user", "content": "Hi"}]}'
  # Should return 200 with completion
  ```

#### 4.4 Ollama Local LLM (Optional)
- **Test Ollama endpoint:**
  ```bash
  curl http://100.113.96.25:11434/api/tags
  # Should return list of local models
  ```
- **Note:** Sea-Lion model may not be running; Grok is fallback

### 5. Vercel Deployment Configuration

#### 5.1 Build Settings
- **Verify build command:**
  - Vercel dashboard → Settings → Build & Deploy
  - Build command should be: `next build`
  - Output directory: `.next`
  - Install command: `npm install` (or `npm ci`)

#### 5.2 Environment Variables (Vercel Dashboard)
- **Add all secrets via Vercel UI (not in `.env`):**
  - Vercel dashboard → Settings → Environment Variables
  - Add: CONVEX_DEPLOYMENT_KEY, CLERK_SECRET_KEY, KAPSO_WEBHOOK_SECRET, etc.
  - Mark as "Encrypted" if available
  - Test: Deploy → verify variables are available during build

#### 5.3 Deployment Triggers
- **Verify webhook from GitHub (if pushing code):**
  - Vercel dashboard → Settings → Git
  - Verify GitHub integration is connected
  - Production branch should be `master`
  - Test: Create dummy commit, verify auto-deploy

#### 5.4 Rollback Capability
- **Know how to rollback if something breaks:**
  - Vercel dashboard → Deployments
  - Click previous successful deployment → Promote to Production
  - Takes ~30 seconds
  - No git push needed

---

## Live Bot Activation (Webhook & Integration)

**Goal:** Activate Kapso webhook to forward real WhatsApp messages to the bot.

### 1. Webhook Endpoint Configuration

#### 1.1 Webhook URL Registration
- **Current setup:**
  - Localhost dev: N/A (webhooks don't fire locally)
  - Production: `https://intent-otter-212.convex.cloud/api/webhook/kapso`

- **Update in Kapso Dashboard:**
  1. Go to Kapso dashboard (https://dashboard.kapso.ai)
  2. Select workspace → Settings → Webhooks
  3. Find webhook pointing to old URL (if exists): `https://my21staff.vercel.app/api/webhook/kapso`
  4. Update URL to: `https://intent-otter-212.convex.cloud/api/webhook/kapso`
  5. Verify webhook secret matches: `KAPSO_WEBHOOK_SECRET` in Vercel
  6. Save and test

#### 1.2 Webhook Verification (Hub Challenge)
- **What Kapso does:**
  1. Sends GET request with `?hub.challenge=RANDOM_TOKEN`
  2. Expects response to be exactly that token (plain text)
  3. If response matches, webhook is verified

- **What to test:**
  ```bash
  # Verify our GET handler
  curl "https://intent-otter-212.convex.cloud/api/webhook/kapso?hub.challenge=test123"
  # Expected response: test123 (plain text, not JSON)
  ```

- **In code:** `/api/webhook/kapso/route.ts` has GET handler:
  ```typescript
  const challenge = searchParams.get('hub.challenge')
  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  ```
  ✅ This is correct and ready for production.

#### 1.3 Webhook POST Handler
- **What Kapso sends:** Meta webhook format with messages, contacts, metadata
- **What our handler does:**
  1. Verifies signature with `KAPSO_WEBHOOK_SECRET`
  2. Returns 200 immediately (prevents Kapso retries)
  3. Processes asynchronously:
     - Creates/updates contacts
     - Creates/updates conversations
     - Saves messages
     - Invokes ARI if enabled

  See: `src/app/api/webhook/kapso/route.ts` ✅ Ready for production

#### 1.4 Signature Verification
- **What Kapso does:**
  - Signs request with: `HMAC-SHA256(raw_body, webhook_secret)`
  - Sends signature in header: `x-kapso-signature`

- **What to test:**
  ```bash
  # Generate valid signature
  SECRET="your-webhook-secret"
  BODY='{"entry":[]}'
  SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

  # Test POST with valid signature
  curl -X POST https://intent-otter-212.convex.cloud/api/webhook/kapso \
    -H "Content-Type: application/json" \
    -H "x-kapso-signature: $SIGNATURE" \
    -d "$BODY"
  # Expected response: { "received": true }
  ```

### 2. Message Flow Testing

#### 2.1 End-to-End Message Path
- **Sequence when real WhatsApp message arrives:**
  1. WhatsApp user sends message to Eagle's Kapso number
  2. Kapso receives message and sends webhook to our endpoint
  3. Our webhook handler processes the message
  4. Message saved to Convex database
  5. ARI processor invoked (if enabled)
  6. Response sent back via Kapso
  7. Response appears in WhatsApp

#### 2.2 Pre-Activation Testing (Simulation)
- **Test with valid webhook payload:**
  ```bash
  curl -X POST https://intent-otter-212.convex.cloud/api/webhook/kapso \
    -H "Content-Type: application/json" \
    -H "x-kapso-signature: $SIGNATURE" \
    -d '{
      "object": "whatsapp_business_account",
      "entry": [{
        "id": "PHONE_NUMBER_ID",
        "changes": [{
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "phone_number_id": "EAGLE_PHONE_ID",
              "display_phone_number": "+62812345..."
            },
            "messages": [{
              "id": "MSG_ID_001",
              "from": "62899999999",
              "timestamp": "1234567890",
              "type": "text",
              "text": { "body": "Halo, saya mau daftar" }
            }],
            "contacts": [{
              "wa_id": "62899999999",
              "profile": { "name": "Test User" }
            }]
          }
        }]
      }]
    }'
  # Expected: { "received": true }
  ```

#### 2.3 Log Verification
- **Check Convex logs:**
  1. Convex dashboard → Functions → Logs
  2. Look for `[Webhook]` entries
  3. Verify message was saved

#### 2.4 ARI Processing Verification
- **If ARI enabled:**
  1. Check logs for `[ARI]` entries
  2. Verify response was generated
  3. Verify response was sent via Kapso

### 3. Conversation State Machine

#### 3.1 State Transitions
- **Verify state progression:**
  - greeting → qualification → routing → booking
  - Each message updates form answers and scores

#### 3.2 Lead Scoring
- **Verify scoring formula is correct:**
  - Basic: 25 max (name, email, phone)
  - Qualification: 33 max (timeline, country, English)
  - Document: 30 max (passport, CV, test, transcript)
  - Engagement: 0-10 (configurable)
  - Total: ~100

#### 3.3 Routing Logic
- **Verify automatic routing:**
  - Score 70+ → hot → consultation booking
  - Score 40-69 → warm → nurture
  - Score <40 → cold → community

### 4. Bot Response Quality

#### 4.1 Response Generation (Grok AI)
- **Verify responses are:**
  - In Indonesian
  - Contextual (address user's message)
  - On-brand (match persona)
  - Concise (< 160 chars)

#### 4.2 AI Model Fallback
- **Verify fallback from Grok to Sea-Lion if needed**

#### 4.3 Token Usage Optimization
- **Monitor Grok token costs:** < Rp1000 per message

### 5. Handoff Logic

#### 5.1 Human Handoff Trigger
- **Verify handoff on:** User requests human, or status set to human_only

#### 5.2 Conversation Status Filter
- **Verify inbox filters by status correctly**

#### 5.3 Per-Conversation Override
- **Verify per-conversation AI toggle works independently**

---

## Testing & Validation Framework

### 1. Unit Tests

#### 1.1 ARI Scoring Engine
- **File:** `src/lib/ari/__tests__/scoring.test.ts`
- **Status:** ✅ Comprehensive test suite exists
- **Run tests:**
  ```bash
  npm test -- src/lib/ari/__tests__/scoring.test.ts
  # All tests should pass
  ```

#### 1.2 Add Tests for Critical Paths
- **Suggested additions:**
  - Webhook signature verification
  - Phone normalization
  - State machine transitions
  - Contact merge logic

### 2. Integration Tests

#### 2.1 Webhook E2E Flow
- Test: Valid signature → Message stored
- Test: Invalid signature → 401 response
- Test: Malformed JSON → 400 response
- Test: Media handling → Correct content type

#### 2.2 Convex Mutation E2E
- Test data round-trip through webhook handler

#### 2.3 ARI Processing E2E
- Test bot response generation end-to-end

### 3. Performance Tests

#### 3.1 Webhook Performance
- **Targets:**
  - Single message: < 500ms
  - Batch of 10 messages: < 2s
  - Contact lookup: < 50ms

#### 3.2 Dashboard Performance
- **Targets:**
  - Page load: < 2s
  - Dashboard render: < 1s

#### 3.3 Your Intern Performance
- **Targets:**
  - Tab switch: < 100ms
  - Form save: < 500ms

### 4. Security Tests

#### 4.1 Webhook Security
- Valid signature accepted
- Invalid signature rejected (401)
- Missing signature rejected (401)
- Modified payload rejected (401)

#### 4.2 Workspace Isolation
- Test RLS enforcement on all tables

#### 4.3 API Key Encryption
- Test encrypt/decrypt round-trip

#### 4.4 Clerk Authentication
- Unauthenticated request → Redirect
- Invalid token → 401
- Valid token → Access granted

### 5. Regression Tests

#### 5.1 Pre-Deployment Checklist Automation
- **Automate localhost verification**

#### 5.2 Post-Deployment Smoke Tests
- **Run after deploying to production**

---

## Success Criteria for "Production Ready"

### 1. Deployment Readiness

| Criterion | Status |
|-----------|--------|
| All /demo pages load without errors | ✅ Required |
| All env vars set in Vercel | ✅ Required |
| Convex schema ready | ✅ Required |
| Clerk org created | ✅ Required |
| Third-party APIs tested | ✅ Required |
| Webhook endpoint accessible | ✅ Required |
| Dev mode disabled in production | ✅ Required |

### 2. Feature Completeness

| Feature | Localhost | Production | Live Bot |
|---------|-----------|------------|----------|
| Dashboard | ✅ | ✅ | ✅ |
| Inbox | ✅ | ✅ | ✅ |
| Database | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ |
| Your Intern | ✅ | ✅ | ✅ |
| Message receipt | N/A | N/A | ✅ |
| ARI responses | N/A | N/A | ✅ |
| Webhook | ✅ (code) | ✅ (code) | ✅ (tested) |

### 3. Testing Coverage

| Test Type | Threshold | Status |
|-----------|-----------|--------|
| Unit tests | 80%+ pass | ✅ ARI suite |
| Integration | Webhook E2E | ⏳ Pending |
| Smoke tests | All paths | ⏳ Pending |
| Performance | P95 < 2s | ⏳ Pending |
| Security | Full validation | ✅ Code review |

### 4. Quality Gates

| Gate | Criterion |
|------|-----------|
| No console errors | All pages |
| No unhandled rejections | Network requests |
| Performance baseline | < 2s pages |
| Accessibility | Keyboard navigation |
| Mobile responsive | 375px-1920px |

### 5. Operational Readiness

| Aspect | Requirement |
|--------|-------------|
| Monitoring | Vercel Analytics + Convex logs |
| Alerting | Webhook failures → Check logs |
| Logging | All critical paths logged |
| Debugging | Request IDs traceable |
| Rollback | Previous deployment available |

---

## Rollback & Contingency Plans

### 1. Code Rollback (Fast)
- Vercel dashboard → Deployments → Previous deployment → Promote
- Takes ~30 seconds

### 2. Webhook Rollback
- Kapso dashboard → Webhooks → Disable
- Messages queue in Kapso (not lost)
- Fix issue, re-enable webhook

### 3. Environment Variable Rollback
- Vercel dashboard → Edit variable
- Trigger redeploy

### 4. Incident Response

#### 4.1 Webhook Not Receiving Messages
1. Check Kapso webhook log
2. Verify endpoint is accessible (test GET challenge)
3. Check Convex logs for errors
4. Deploy fix or re-enable webhook

#### 4.2 Messages Not Responding
1. Verify message saved in Convex
2. Check Convex logs for ARI errors
3. Verify ARI enabled for workspace
4. Verify Kapso API key valid

#### 4.3 Messages Too Slow
1. Measure webhook latency in logs
2. Check ARI processing duration
3. Optimize context size or cache config

#### 4.4 Credentials Compromised
1. Rotate all API keys immediately
2. Update Vercel env vars
3. Redeploy
4. Audit logs for unauthorized access

### 5. Monitoring Checklist

**Daily:**
- Webhook logs: Any signature failures?
- Convex logs: Any errors?
- Vercel logs: Any 5xx errors?
- Kapso dashboard: Webhook status Active?
- Test: Send test WhatsApp message

**Weekly:**
- Review error trends
- Check performance degradation
- Backup data
- Update runbooks

**Monthly:**
- Test rollback procedure
- Verify all integrations
- Review security logs
- Document changes

---

## Summary Table

### Phase 1: Localhost Polish (2-3 days)
| Task | Timeline | Blocking |
|------|----------|----------|
| Fix dev mode issues | 1-2 days | Yes |
| Test all /demo pages | 1 day | Yes |
| Test Your Intern tabs | 1 day | Yes |
| Run unit tests | 1 day | Yes |
| Performance baseline | 1 day | No |

### Phase 2: Production Deployment (2-3 days)
| Task | Timeline | Blocking |
|------|----------|----------|
| Set up Convex schema | 1 day | Yes |
| Configure Clerk | 1 day | Yes |
| Set env vars | 1 hour | Yes |
| Test integrations | 1 day | Yes |
| Deploy to Vercel | 1 hour | Yes |
| Smoke test | 1 day | Yes |

### Phase 3: Live Bot Activation (1-2 days)
| Task | Timeline | Blocking |
|------|----------|----------|
| Test webhook endpoint | 2 hours | Yes |
| Register webhook in Kapso | 1 hour | Yes |
| Send test message | 30 min | Yes |
| Verify response | 30 min | Yes |
| Monitor 24h | Ongoing | No |

---

**Last Updated:** 2026-01-28
**Status:** Research complete, ready for roadmap phase structure
**Next Step:** Use in v3.5 milestone roadmap creation
