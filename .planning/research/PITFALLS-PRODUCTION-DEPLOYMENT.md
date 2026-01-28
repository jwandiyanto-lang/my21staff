# Production Deployment Pitfalls Research

**Domain:** SaaS production deployment (Next.js + Convex + Clerk) with live webhook integrations and AI bot

**Researched:** 2026-01-28

**Confidence:** HIGH (verified with official documentation, WebSearch cross-referenced)

**Milestone:** v3.5 Production Go-Live (First paying customer: Eagle Overseas)

---

## Executive Summary

First production deployment introduces highest-risk vulnerabilities. Unlike development, there's no second chance: mistakes with live customer data, real WhatsApp conversations, and external integrations (Kapso, n8n) can result in immediate data loss, security breaches, or legal liability.

**Critical Risk Zones:**
1. **Environment variable misconfiguration** — Development secrets in production
2. **Dev mode code execution** — Mock data in real customer conversations
3. **Webhook integration failures** — Missing signatures, wrong URLs, timeouts
4. **AI bot hallucination** — Bot invents policies; legal liability (Air Canada case)
5. **Data migration errors** — User ID mismatch causing broken relationships
6. **Rate limiting outages** — Single-instance limitation breaks under real traffic
7. **Monitoring blindness** — No logs means no debugging when issues occur

---

## Critical Pitfalls

### Pitfall 1: Development Environment Secrets Deployed to Production

**What goes wrong:**
- Application fails to authenticate with Clerk
- Bot doesn't respond (Kapso API key incorrect)
- n8n webhooks get 401 Unauthorized
- Convex queries return permission errors
- Development JWTs don't validate in production
- Sensitive data leaks if dev keys are exposed

**Why it happens:**
- Developers copy `.env.development` to production without updating values
- Environment variable configuration is overlooked during deployment
- Someone forgets to update Clerk's instance keys from development to production
- The same mistake applies to Kapso API keys, n8n webhooks, Convex deployment URLs, and LLM API keys
- No validation that critical secrets are actually set on the hosting platform

**How to avoid:**

1. **Create a mandatory environment variable checklist**
   ```
   REQUIRED BEFORE DEPLOY:
   ☐ CLERK_SECRET_KEY (production instance, not dev)
   ☐ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (production instance)
   ☐ CONVEX_DEPLOYMENT_URL (production, not local)
   ☐ KAPSO_API_KEY (production token)
   ☐ KAPSO_WEBHOOK_SECRET (registered in Kapso)
   ☐ N8N_WEBHOOK_URL (production domain)
   ☐ GROK_API_KEY (or LLM provider key)
   ☐ RESEND_API_KEY (email service)
   ☐ ENCRYPTION_KEY (for API key storage)
   ```

2. **Implement validation on startup**
   ```typescript
   // src/lib/validate-env.ts
   function validateProductionEnv() {
     if (process.env.NODE_ENV === 'production') {
       const required = [
         'CLERK_SECRET_KEY',
         'CONVEX_DEPLOYMENT_URL',
         'KAPSO_API_KEY',
         'KAPSO_WEBHOOK_SECRET'
       ]

       for (const key of required) {
         if (!process.env[key]) {
           throw new Error(`Missing required env var: ${key}`)
         }
       }

       // Catch accidental dev secrets
       if (process.env.CONVEX_DEPLOYMENT_URL?.includes('localhost')) {
         throw new Error('Localhost Convex URL in production!')
       }
     }
   }

   // Call on app startup
   validateProductionEnv()
   ```

3. **Never commit `.env.production`** — Use hosting platform's environment variable UI
   - Vercel: Settings → Environment Variables
   - Add each secret individually
   - Test deploy to staging first

4. **Automated pre-deploy verification**
   ```bash
   # Add to pre-deploy script
   npm run validate-env:production
   ```

5. **Cross-reference with official docs**
   - [Clerk Production Deployment](https://clerk.com/docs/guides/development/deployment/production)
   - [Convex Production Guide](https://docs.convex.dev/production)
   - [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)

**Warning signs:**
- 404 or 403 errors from Clerk/Convex APIs immediately after deploy
- "Unauthorized" messages when users try to log in
- Kapso webhook returns 401 Unauthorized
- n8n workflow doesn't trigger
- Bot doesn't respond to incoming messages
- Convex queries return permission errors despite correct code
- Logs show "NEXT_PUBLIC_CONVEX_URL is undefined" or "CLERK_SECRET_KEY is required"

**Phase to address:**
- **Phase 1 (Pre-Deploy Verification):** Create env var validation script and add to startup
- **Phase 2 (Deploy):** Execute environment checklist before uploading to Vercel
- **Phase 3 (Post-Deploy):** Monitor logs for auth errors in first hour

---

### Pitfall 2: Dev Mode Code Accidentally Shipped to Production

**What goes wrong:**
- Mock data appears in real customer conversations
- Bot responds with fake data from `mock-data.ts`
- Admin sees "Offline Mode" indicator in production
- Dev bypasses (like skipping Clerk auth) end up in production, allowing unauthorized access
- Test workspace visible to real customer
- Conversations created with mock phone numbers

**Why it happens:**
- Conditional dev mode checks are missed in new components
- Someone adds a feature that calls Convex but forgets the `isDevMode ? skip : query` pattern
- A refactor removes dev mode checks accidentally
- Code review doesn't catch the missing checks
- `NEXT_PUBLIC_DEV_MODE=true` accidentally remains in production env

**How to avoid:**

1. **Create a comprehensive pre-deploy test checklist**
   ```bash
   # Test production build locally (HARD RULE)
   npm run build
   npm run start
   # Manually visit and verify:
   http://localhost:3000/          # No mock data in UI
   http://localhost:3000/login     # Clerk login required
   http://localhost:3000/demo      # 404 or redirect (not accessible)
   http://localhost:3000/inbox     # Requires auth
   http://localhost:3000/database  # Requires auth
   http://localhost:3000/settings  # Requires auth

   # Verify footer: NO "Offline Mode" indicator
   # Verify: NO mock data in responses
   ```

2. **Audit all Convex queries and mutations**
   ```bash
   # Search for all Convex calls
   grep -r "useQuery\|useMutation" src/ | grep -v ".test.ts"
   # Verify each one has dev mode check
   ```

3. **Search for dev mode references before deploy**
   ```bash
   grep -r "NEXT_PUBLIC_DEV_MODE\|isDevMode\|mock" src/ \
     | grep -v "test\|story\|spec" \
     | grep -v ".next"
   # Every match should be inside a conditional check
   ```

4. **TypeScript guard for production mode**
   ```typescript
   // src/lib/dev-mode-guard.ts
   export function assertNotDevMode() {
     if (process.env.NEXT_PUBLIC_DEV_MODE === 'true' &&
         process.env.NODE_ENV === 'production') {
       throw new Error(
         'Dev mode is enabled in production! ' +
         'Remove NEXT_PUBLIC_DEV_MODE from environment variables.'
       )
     }
   }

   // Call on app startup
   if (typeof window === 'undefined') {
     assertNotDevMode()
   }
   ```

5. **Verify dev mode is disabled**
   ```bash
   # This should fail in production
   echo $NEXT_PUBLIC_DEV_MODE
   # Should output nothing or 'false'
   ```

**Warning signs:**
- Production logs show "Offline Mode" indicator on footer
- Real customer sees "DEMO_WORKSPACE" or mock data in their inbox
- "Mock contact" appears in customer's database
- Admin console shows "mock_user_id" instead of real Clerk ID
- Clerk login doesn't appear on production
- Toast notifications reference "dev mode"
- Footer shows orange dot with "Offline Mode"

**Phase to address:**
- **Phase 1 (Code Review):** Audit all dev mode checks; add missing ones
- **Phase 2 (Pre-Deploy):** Run full localhost production build test
- **Phase 3 (Deploy):** Verify `NEXT_PUBLIC_DEV_MODE` is not set on Vercel
- **Phase 4 (Post-Deploy):** Test all pages manually; verify no mock data

---

### Pitfall 3: Webhook URLs Point to Wrong Endpoint in Production

**What goes wrong:**
- Webhooks from Kapso never reach the app
- n8n can't deliver leads
- Bot doesn't receive incoming messages
- Customer sends a WhatsApp message and nothing happens
- Kapso dashboard shows "webhook unreachable"
- Complete integration failure despite correct code

**Why it happens:**
- Webhook URLs are hardcoded in n8n or Kapso with local development URLs
- Production domain is set up but webhooks still point to `http://localhost:3000`
- `NEXT_PUBLIC_WEBHOOK_BASE_URL` environment variable is wrong or missing
- Webhook URL in environment variables doesn't match production domain
- Someone forgets to re-register webhooks after deploying to new domain
- HTTPS requirement not met (Kapso requires HTTPS, not HTTP)

**How to avoid:**

1. **Never hardcode webhook URLs**
   ```typescript
   // WRONG:
   const webhookUrl = 'http://localhost:3000/api/webhooks/kapso'

   // RIGHT:
   const webhookUrl = `${process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL}/api/webhooks/kapso`

   // In environment:
   // Development: http://localhost:3000
   // Production: https://my21staff.com (or actual production domain)
   ```

2. **Create webhook URL validation**
   ```typescript
   // src/lib/validate-webhook-url.ts
   export function validateWebhookUrl() {
     const baseUrl = process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL

     if (!baseUrl) {
       throw new Error('NEXT_PUBLIC_WEBHOOK_BASE_URL not set')
     }

     if (baseUrl.includes('localhost') &&
         process.env.NODE_ENV === 'production') {
       throw new Error('Localhost webhook URL in production!')
     }

     if (!baseUrl.startsWith('https://') &&
         process.env.NODE_ENV === 'production') {
       throw new Error('Webhook URL must be HTTPS in production')
     }

     return baseUrl
   }
   ```

3. **Create admin page showing active webhook URLs**
   ```
   Settings → API Configuration
   Shows:
   - Current webhook base URL
   - Registered Kapso webhook endpoint
   - Last webhook received: [timestamp]
   - Webhook status: Active/Inactive/Error
   ```

4. **Test webhooks in production**
   - In Kapso dashboard: Send test webhook
   - Check production logs for webhook receipt
   - Verify `POST /api/webhooks/kapso` returns 200 OK
   - Check database for test message created

5. **Update all webhook registrations before deploy**
   - n8n workflow URLs
   - Kapso webhook endpoints
   - Any third-party integrations
   - Test each one after updating

**Warning signs:**
- No error message but webhooks don't arrive
- Bot doesn't respond even though code looks correct
- Kapso dashboard shows "webhook unreachable"
- n8n workflow shows 404 error when trying to deliver
- Production logs show zero webhook `POST` requests
- Customer reports message sent but no reply from bot
- Convex logs show no new messages being created

**Phase to address:**
- **Phase 1 (Pre-Deploy):** Create webhook URL validation and admin page
- **Phase 2 (Deploy):** Verify webhook base URL is set correctly on Vercel
- **Phase 3 (Post-Deploy):** Send test webhook immediately after deployment; monitor logs

---

### Pitfall 4: Clerk Organization Not Created or Properly Configured in Production

**What goes wrong:**
- First client (Eagle Overseas) can't log in
- "Organization not found" error
- Admin account exists but can't access the workspace
- Workspace has no members
- Roles/permissions don't work
- Social OAuth doesn't work (shows "Shared OAuth not allowed in production")

**Why it happens:**
- Organization isn't created in production Clerk instance
- Development organization ID is hardcoded instead of using production ID
- Clerk instance keys are still development keys
- Social OAuth still uses development shared credentials instead of custom credentials
- Domain isn't configured/verified in Clerk production
- Organization is created but first user isn't invited

**How to avoid:**

1. **Manual organization creation in production** (before first customer goes live)
   - Log into Clerk Dashboard
   - Select Production instance
   - Create organization: "Eagle Overseas Education"
   - Note the organization ID: `org_xxxxx`
   - Update code/config with production organization ID

2. **Verify organization exists on startup**
   ```typescript
   // Validation during deployment
   const org = await clerk.organizations.getOrganization(
     process.env.NEXT_PUBLIC_CLERK_ORG_ID
   )

   if (!org) {
     throw new Error(
       `Organization ${process.env.NEXT_PUBLIC_CLERK_ORG_ID} ` +
       `not found in Clerk. Create it manually in Clerk Dashboard.`
     )
   }
   ```

3. **Configure OAuth in production**
   - Clerk provides "shared OAuth" for development (works for everyone)
   - Production requires custom OAuth credentials (Google, GitHub, etc.)
   - Get OAuth credentials from provider (Google Cloud Console, GitHub, etc.)
   - Add to Clerk production instance settings
   - Test OAuth login with real credentials

4. **Test complete organization workflow before go-live**
   ```
   1. Invite Eagle's admin user to production organization
   2. Admin receives invitation email
   3. Admin clicks link and creates password
   4. Admin logs in with email/password
   5. Admin logs in with social (Google, GitHub)
   6. Admin can access workspace
   7. Admin can see workspace data
   8. Admin can invite team members
   9. Team members can log in and access workspace
   10. Roles are assigned correctly (Owner, Admin, Member)
   ```

5. **Create pre-deployment checklist**
   ```
   CLERK PRODUCTION CHECKLIST:
   ☐ Production instance is active (not development)
   ☐ Organization exists: Eagle Overseas Education
   ☐ Organization ID matches code: org_xxxxx
   ☐ Domain is verified (if using email)
   ☐ Custom OAuth credentials configured (Google, GitHub, etc.)
   ☐ First admin user is invited to organization
   ☐ Admin accepted invitation
   ☐ Admin can log in with email/password
   ☐ Admin can log in with social OAuth
   ☐ Team member can be invited
   ☐ Team member can log in
   ☐ Roles are assigned and functional
   ```

**Warning signs:**
- First client tries to log in: "Organization not found"
- Organization exists in development but not in production Clerk instance
- Social login works but email login doesn't
- User invited but doesn't receive email
- User accepts invite but still can't access workspace
- Roles don't appear in organization settings
- "Shared OAuth is not allowed in production" error

**Phase to address:**
- **Phase 1 (Pre-Deploy):** Manually create organization in Clerk production
- **Phase 2 (Pre-Deploy):** Configure custom OAuth credentials
- **Phase 3 (Deploy):** Test first client onboarding flow entirely
- **Phase 4 (Post-Deploy):** Have admin user actually log in and verify access

---

### Pitfall 5: Webhook Signature Verification Bypassed in Production

**What goes wrong:**
- Attacker sends fake messages pretending to be from Kapso
- Bot processes forged conversation messages
- Conversations are created with spoofed data
- Customer data could be manipulated
- Sensitive operations (like consultation bookings) triggered by fake webhooks
- Legal liability if fake messages cause business decisions

**Why it happens:**
- Signature verification is disabled for testing and not re-enabled
- Webhook secret isn't properly set in environment
- Signature verification code has a bug that isn't caught until production
- Code removes verification as "temporary" measure during development
- Testing webhook tool doesn't include signatures, so verification is skipped

**How to avoid:**

1. **Always validate HMAC-SHA256 signature on every webhook**
   ```typescript
   import crypto from 'crypto'

   export function verifyKapsoSignature(
     payload: string,
     signature: string,
     secret: string
   ): boolean {
     const expectedSignature = crypto
       .createHmac('sha256', secret)
       .update(payload)
       .digest('hex')

     return crypto.timingSafeEqual(
       Buffer.from(signature),
       Buffer.from(expectedSignature)
     )
   }

   // In webhook handler:
   if (!verifyKapsoSignature(rawBody, xSignature, webhookSecret)) {
     return new Response('Unauthorized', { status: 401 })
   }
   ```

2. **Store webhook secret securely**
   ```typescript
   // Environment variable, never hardcoded
   const KAPSO_WEBHOOK_SECRET = process.env.KAPSO_WEBHOOK_SECRET

   if (!KAPSO_WEBHOOK_SECRET) {
     throw new Error('KAPSO_WEBHOOK_SECRET not set')
   }
   ```

3. **Log verification failures** (for security monitoring)
   ```typescript
   if (!verifyKapsoSignature(...)) {
     console.error('[SECURITY] Invalid webhook signature', {
       source: request.ip,
       timestamp: new Date().toISOString(),
       payload: signature
     })
     return new Response('Unauthorized', { status: 401 })
   }
   ```

4. **Test signature verification**
   ```typescript
   // Test with valid signature
   const validSig = crypto
     .createHmac('sha256', secret)
     .update(payload)
     .digest('hex')

   // Should return 200
   await postWebhook(payload, validSig)

   // Test with invalid signature
   const invalidSig = 'definitely_not_valid'

   // Should return 401
   await postWebhook(payload, invalidSig)
   ```

5. **Implement timestamp verification** (prevent replay attacks)
   ```typescript
   const timestamp = request.headers.get('X-Timestamp')
   const currentTime = Math.floor(Date.now() / 1000)
   const maxAge = 300 // 5 minutes

   if (Math.abs(currentTime - parseInt(timestamp)) > maxAge) {
     return new Response('Webhook too old', { status: 401 })
   }
   ```

**Warning signs:**
- Bot responds to messages from unknown phone numbers
- Conversations appear in database without being from actual customers
- Consultation bookings created with fake phone numbers
- Production logs show NO verification errors (should see some)
- Security audit flags webhook endpoint as unverified

**Phase to address:**
- **Phase 1 (Code Review):** Verify signature verification code is implemented correctly
- **Phase 2 (Staging):** Test with both valid and invalid signatures
- **Phase 3 (Deploy):** Confirm production environment has correct webhook secret set
- **Phase 4 (Post-Deploy):** Monitor logs for invalid signature attempts

---

### Pitfall 6: AI Bot Responds with Hallucinated Information to Real Customers

**What goes wrong:**
- Air Canada scenario: Bot invents a bereavement fare refund policy that doesn't exist; court rules airline must honor what the bot promised
- DPD scenario: Bot insults the company and writes a poem about how terrible the company is
- Cursor scenario: Bot tells developers they're limited to one device per subscription (completely fabricated)
- Customer receives completely incorrect information about your service
- Business makes decisions based on fabricated data
- Legal liability and brand damage

**Why it happens:**
- LLM models (Grok, Sea-Lion) can hallucinate/confabulate information
- Bot isn't constrained by documentation or guardrails
- Temperature is set too high (more creative = less accurate)
- Bot hasn't been fine-tuned with actual company policies
- No human review before the bot goes live with real customers
- Bot is given access to too much context or unverified information

**How to avoid:**

1. **Use a strict, explicit system prompt**
   ```typescript
   const systemPrompt = `
   You are ARI, the AI assistant for Eagle Overseas Education.

   CONSTRAINTS:
   - You represent Eagle Overseas Education
   - You can ONLY discuss: course information, application process,
     consultation booking, contact information
   - You CANNOT discuss: pricing, refunds, scholarships, admissions decisions
   - If asked about anything outside your scope, say:
     "I don't have information about that. Please speak with a consultant."
   - NEVER make up or assume policies
   - NEVER make promises on behalf of the company

   REFERENCE INFORMATION:
   Available courses: [list from database]
   Consultation slots available: [from database]
   Company phone: +62 XXXX
   Company email: contact@eagleoverseas.com

   If a student asks about something not in this list, escalate to human.
   `
   ```

2. **Constrain bot to verified information only**
   ```typescript
   // Bot can only reference these data sources:
   - Company policies from database
   - Course information from database
   - Consultant availability from database
   - Pre-approved FAQ responses

   // Bot CANNOT reference:
   - Pricing (refer to consultant)
   - Refund policies (refer to consultant)
   - Admission decisions (refer to consultant)
   - Scholarships (refer to consultant)
   ```

3. **Set temperature/creativity very low**
   ```typescript
   // For factual responses, low temperature = more accurate
   const response = await llm.generate({
     prompt: userMessage,
     temperature: 0.1,  // Very literal, no creativity
     maxTokens: 150,
     // For friendly greetings only, can use 0.3
   })
   ```

4. **Review bot responses before going live**
   ```
   1. Create 100+ test conversations
   2. Have someone (non-developer) read all bot responses
   3. Check for:
     - Factual accuracy
     - Consistent tone
     - No hallucinations or fabrications
     - Appropriate escalation to human
     - No rude or insulting language
   4. Get approval: "This bot is safe to release"
   ```

5. **Implement response filtering and validation**
   ```typescript
   function validateBotResponse(response: string): boolean {
     // Reject uncertainty markers
     const uncertaintyMarkers = [
       "I think", "probably", "maybe", "I'm not sure",
       "I believe", "I assume", "likely", "might"
     ]

     for (const marker of uncertaintyMarkers) {
       if (response.includes(marker)) {
         return false // Escalate instead of responding
       }
     }

     // Reject if too long (might be hallucinating)
     if (response.length > 300) {
       return false
     }

     return true
   }
   ```

6. **Implement human-in-the-loop for first week**
   ```
   First 7 days of production:
   - Every bot response is reviewed by a human before delivery
   - Human can approve, edit, or escalate to consultant
   - Bot response is delayed by 30 seconds for human review
   - Customer doesn't notice the delay

   After 7 days:
   - Switch to random sampling (review 1 in 10 responses)
   - Continue daily review for issues
   ```

7. **Monitor for hallucinations**
   ```typescript
   // Track bot confidence and quality metrics
   const botMetrics = {
     responsesGenerated: 0,
     escalationsTriggered: 0,      // How often bot says "escalate"
     uncertaintyDetected: 0,        // How often uncertainty markers appear
     humanReviewChanges: 0,         // How often human corrected bot
     customerComplaints: 0          // Customers report bot said wrong thing
   }
   ```

**Warning signs:**
- Customer reports bot said something that contradicts the website
- Bot mentions policies that don't exist
- Bot gives pricing information that's wrong
- Customer escalates to human with "the bot said..."
- Bot response includes apologies, uncertainty, or waffling
- Multiple customers report similar incorrect information
- Bot responses are inconsistent (says different things about same topic)

**Phase to address:**
- **Phase 1 (Testing):** Create and review 100+ test conversations
- **Phase 2 (Pre-Deploy):** Have non-developer review bot behavior for accuracy
- **Phase 3 (Deploy):** Enable human-in-the-loop review for first week
- **Phase 4 (Production):** Monitor bot responses daily; track hallucination metrics

---

### Pitfall 7: Rate Limiting Breaks Under Real Traffic

**What goes wrong:**
- All conversations stop responding after first 20-30 messages
- Bot is unresponsive during peak traffic times (morning/afternoon)
- Convex queries return 429 (Too Many Requests) errors
- n8n webhooks are rate-limited and stop delivering
- Customer sends message but receives "Rate limited, try again" error
- System grinds to a halt during business hours

**Why it happens:**
- In-memory rate limiting doesn't persist across multiple instances
- Production has multiple Vercel instances but each has its own rate limit counter
- Instance A allows 100 requests, instance B allows 100 requests = 200 total (uncontrolled)
- Rate limits are too strict for real usage patterns
- No graceful degradation — system fails instead of queuing requests
- No monitoring of rate limit status until customers complain

**How to avoid:**

1. **Never use in-memory rate limiting in production**
   ```typescript
   // BAD: In-memory rate limiting
   const rateLimitMap = new Map()  // Lost on restart

   // GOOD: Distributed rate limiting
   // Option 1: Use Convex's built-in rate limiting
   // Option 2: Use Redis
   // Option 3: Use third-party service (Clerk provides it)
   ```

2. **Use per-customer (per-workspace) rate limits, not global**
   ```typescript
   // Rate limit by workspace ID, not globally
   const workspaceId = request.headers.get('X-Workspace-ID')

   const limit = await checkRateLimit({
     workspaceId,           // Each customer has own quota
     maxRequests: 100,      // per workspace
     windowSeconds: 60      // per minute
   })

   if (!limit.allowed) {
     // Don't just reject — queue the request
     await queueRequest(request)
     return new Response('Request queued', { status: 202 })
   }
   ```

3. **Implement exponential backoff for retries**
   ```typescript
   // Client-side retry strategy
   async function sendWithRetry(request, maxRetries = 5) {
     for (let attempt = 0; attempt < maxRetries; attempt++) {
       try {
         return await fetch(request)
       } catch (error) {
         if (error.status === 429) {
           const delay = Math.pow(2, attempt) * 1000  // 1s, 2s, 4s, 8s, 16s
           await new Promise(r => setTimeout(r, delay))
         } else {
           throw error
         }
       }
     }
   }
   ```

4. **Add queue-based processing for heavy operations**
   ```typescript
   // Instead of synchronous webhook processing:
   // 1. Receive webhook
   // 2. Queue job for async processing
   // 3. Return 200 OK immediately
   // 4. Process job in background

   POST /api/webhooks/kapso
   -> Add to Convex scheduler
   -> Return 200 OK immediately
   -> Convex runs processing in background
   -> Bot response sent when ready
   ```

5. **Monitor rate limit status**
   ```typescript
   // Track how close you are to limits
   const metrics = {
     requestsThisMinute: 45,     // out of 100
     utilizationPercent: 45,     // 45% of limit
     // Alert if > 80%
   }

   // If approaching limit, start queuing instead of processing
   if (metrics.utilizationPercent > 80) {
     await queueRequest(request)
     return new Response('System busy, request queued', { status: 202 })
   }
   ```

6. **Test under load before going live**
   ```bash
   # Load test with realistic concurrent conversations
   ab -n 1000 -c 100 https://my21staff.com/api/webhooks/kapso

   # Should handle:
   - 100+ concurrent webhook deliveries
   - 1000+ messages per day
   - 50+ conversations at once
   ```

**Warning signs:**
- Conversations stop responding after a certain number of messages
- Error logs show rate limit errors (429, 503)
- Bot responds slowly, then stops
- n8n shows constant "Rate Limited" errors
- Multiple customers report the same issue simultaneously
- Issue goes away after a restart (suggests in-memory limit)
- Response times degrade over time (suggests queue buildup)

**Phase to address:**
- **Phase 1 (Code Review):** Audit rate limiting implementation
- **Phase 2 (Pre-Deploy):** Load test with 100+ concurrent conversations
- **Phase 3 (Deploy):** Monitor rate limit errors in production
- **Phase 4 (Ongoing):** Adjust limits based on real usage patterns; track metrics daily

---

### Pitfall 8: Webhook Timeout Causes Lost Messages

**What goes wrong:**
- Kapso webhook times out before bot can respond
- Message appears to customer as "not delivered"
- Conversation appears in bot's database but customer never sees the response
- Data inconsistency: bot created a record but customer never received the message
- Messages disappear from Kapso queue without being delivered

**Why it happens:**
- Bot takes too long to process message (LLM call, database writes, calculations)
- Webhook timeout is default 3-5 seconds (Kapso waits max 5s)
- Bot is processing synchronously instead of asynchronously
- Network is slow or Convex is laggy
- LLM API call takes 10+ seconds
- No queue — everything is synchronous

**How to avoid:**

1. **Move long operations to background jobs**
   ```typescript
   // WRONG: Synchronous LLM call in webhook
   const response = await llm.generate(userMessage)  // Takes 5-10 seconds
   // Webhook times out before response sent

   // RIGHT: Return immediately, process in background
   POST /api/webhooks/kapso
   1. Validate signature
   2. Save incoming message to database
   3. Return 200 OK immediately
   4. Queue background job to generate response
   5. LLM processes async
   6. Response sent to Kapso API when ready
   ```

2. **Return 200 OK immediately, process asynchronously**
   ```typescript
   export async function POST(request: Request) {
     // Step 1: Parse and validate
     const body = await request.json()
     const signature = request.headers.get('X-Signature')

     // Step 2: Validate signature (fast)
     if (!verifySignature(body, signature)) {
       return new Response('Unauthorized', { status: 401 })
     }

     // Step 3: Save to database (fast)
     const message = await db.messages.create({
       ...body,
       status: 'received'
     })

     // Step 4: Queue background job (doesn't block response)
     await scheduleJob({
       type: 'generate_bot_response',
       messageId: message.id,
       workspaceId: body.workspaceId
     })

     // Step 5: Return immediately (< 500ms total)
     return new Response(JSON.stringify({ ok: true }))
   }
   ```

3. **Use Convex scheduler for background jobs**
   ```typescript
   // convex/scheduler.ts
   export const generateBotResponse = internalMutation({
     args: { messageId: v.id('messages'), workspaceId: v.id('workspaces') },
     handler: async (ctx, args) => {
       // This runs async in background
       // Can take 10+ seconds without blocking webhook

       const message = await ctx.db.get(args.messageId)
       const response = await llm.generate(message.text)

       await ctx.db.patch(args.messageId, {
         botResponse: response,
         status: 'responded'
       })

       // Send to Kapso API
       await sendToKapso(response)
     }
   })
   ```

4. **Implement idempotency**
   ```typescript
   // If webhook is delivered twice, only process once
   const idempotencyKey = `${workspaceId}-${messageId}`

   const existing = await db.messages.findByIdempotencyKey(idempotencyKey)
   if (existing) {
     // Already processed
     return new Response(JSON.stringify({ ok: true }))
   }

   // Create with idempotency key
   await db.messages.create({
     ...body,
     idempotencyKey
   })
   ```

5. **Monitor webhook timeout errors**
   ```typescript
   // Log all webhook processing times
   console.log({
     messageId: message.id,
     processingTime: Date.now() - start,
     status: 'queued_for_async'
   })

   // Alert if processing regularly takes > 3s
   if (processingTime > 3000) {
     alerts.slack('⚠️ Webhook processing slow: ${processingTime}ms')
   }
   ```

6. **Test timeout scenarios**
   ```typescript
   // Deliberately slow down LLM API response
   // Verify messages aren't lost
   // Verify customer sees response (eventually)

   // Test: LLM takes 15 seconds to respond
   // Expected: Webhook returns 200 OK, message processed async
   // Customer sees "..." and then bot response appears in conversation
   ```

**Warning signs:**
- Kapso dashboard shows "timeout" errors for webhook
- Messages in WhatsApp don't show bot's response
- Bot's database shows the message was processed
- Customer sees the message on their end but no reply from bot
- Error logs show webhook timeout errors (408, 504)
- Performance monitoring shows webhook handler > 5 seconds

**Phase to address:**
- **Phase 1 (Code):** Refactor webhook handler to async; use Convex scheduler
- **Phase 2 (Pre-Deploy):** Load test message processing with slow LLM
- **Phase 3 (Deploy):** Monitor webhook timeout errors and processing time
- **Phase 4 (Ongoing):** Track webhook latency; adjust queue depth as needed

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip webhook signature verification | Faster development | Opens to spoofing; legal liability | **Never** — implement from start |
| In-memory rate limiting | Simple, no infrastructure | Breaks with scale; causes outages | Only MVP single-instance; migrate before production |
| Synchronous webhook processing | Simpler code structure | Timeouts, lost messages, poor UX | **Never** — implement async from start |
| Hardcode webhook URLs | Quick to set up | Must change code to switch domains | **Never** — always use environment variables |
| Skip dev mode checks in new code | Faster feature development | Mock data in production; security issues | **Never** — enforce code review for all new code |
| Skip logging on webhook handlers | Less storage costs | Can't debug issues in production | **Never** — logs are cheap; blindness is expensive |
| No monitoring before launch | Saves setup time | Blind production; long MTTR when issues occur | Only acceptable if plan to add within 24 hours |
| Manual database migration | Avoid migration tool cost | High risk of data loss | Only for tiny datasets with tested rollback |
| No human review of bot responses | Saves time | Hallucinations, brand damage, legal liability | **Never** — review required before production |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Kapso API** | Webhook URL uses localhost; breaks on deploy | Use `NEXT_PUBLIC_WEBHOOK_BASE_URL` env var; update webhooks before production |
| **Kapso API** | Webhook secret not verified; opens to spoofing | Always validate HMAC-SHA256 signature; reject unsigned requests |
| **Kapso API** | Webhook times out; messages lost | Return 200 OK immediately; process async in background job |
| **n8n Webhooks** | Workflow still points to old domain | Manually update n8n webhook URL to production domain; test delivery after |
| **n8n Webhooks** | Single env var for test & production endpoints | Use separate `N8N_TEST_WEBHOOK_URL` and `N8N_PROD_WEBHOOK_URL` |
| **Clerk** | Development API keys used in production | Always switch to production instance keys; never use dev keys in prod |
| **Clerk** | Organization missing in production | Manually create organization in Clerk Dashboard before first customer login |
| **Clerk** | Shared OAuth (dev) used in production | Configure custom OAuth credentials (Google, GitHub) in production instance |
| **Convex** | Queries return permission errors | Verify deployment URL is correct; check auth tokens match production instance |
| **Convex** | Bandwidth explosion from redundant queries | Implement pagination and careful query selection; avoid sending entire lists on every update |
| **Grok/LLM** | Bot gives hallucinated information | Use strict system prompts; constrain to documentation; human-in-the-loop review |
| **Grok/LLM** | Bot response takes 30+ seconds | Use background jobs; return webhook acknowledgement immediately |
| **Resend Email** | Email template contains hardcoded localhost links | Use `NEXT_PUBLIC_APP_URL` env var for all links; test emails in production |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| In-memory rate limiting | Works fine initially; breaks when traffic increases | Use distributed rate limiting (Redis or Convex) | > 10 concurrent webhook deliveries |
| Synchronous message processing | First message fast; slows down after 10 messages | Implement async job queue for processing | > 100 messages per day |
| Full conversation reloads | First load seems fine; grinds to halt with many messages | Implement pagination and lazy loading | > 500 messages per conversation |
| No database indexes | Early queries fast; become slow at scale | Add indexes on frequently filtered columns | > 10,000 records |
| Caching disabled | Small dataset loads quickly; larger dataset very slow | Implement stale-while-revalidate caching | > 1,000 records |
| All data loaded on dashboard | Dashboard fast with few leads; slow with many leads | Implement pagination, server-side filtering, aggregation | > 100 leads per workspace |
| Conversation list always loads all conversations | Works with 5 conversations; slow with 50+ | Implement pagination on conversation list | > 50 conversations per workspace |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Webhook signature not verified | Attacker can send fake messages; spoof customer data | Always validate HMAC signature on every webhook; log failures |
| AI bot without guardrails | Bot invents policies; legal liability (Air Canada case) | Use strict system prompts; constrain to documentation; human review |
| API keys logged in cleartext | Keys exposed in logs; attackers impersonate your service | Mask API keys in logs; never log full tokens; use env vars |
| Auth bypass left in dev mode | Dev bypass in production; anyone can become any user | Enforce `NODE_ENV === 'production'` check; never trust client flags |
| Workspace isolation not enforced | One customer sees another customer's data | Verify workspace ownership on every query; test cross-workspace access |
| Bot has access to sensitive data | Bot could leak customer phone numbers | Implement bot-specific data schema; don't give bot raw customer records |
| No rate limiting on API endpoints | Attacker can DOS service; send thousands of fake messages | Implement per-customer rate limiting; add request queue |
| Environment variables committed to git | Production secrets leaked on GitHub | Always add .env* to .gitignore; use git-secrets hook; rotate secrets |

---

## UX Pitfalls

Common user experience mistakes in WhatsApp CRM context.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Bot uses scripted language | Users feel like talking to a machine; lose trust | Use conversational tone; personalize with customer name |
| Bot doesn't understand context | User asks same question twice; frustration | Track conversation history; implement conversation state |
| Bot responds to everything | Users act on hallucinated information | Implement confidence scoring; escalate if < 70% confidence |
| No human escalation path | User stuck with bot; can't get real help | Add 1-click escalation; human responds < 2 minutes |
| Bot response time > 5 seconds | User thinks message didn't send; hits "send" again | Implement async processing; show "typing..." indicator |
| No bot quality metrics for admin | Can't see if bot is working well | Add: response rate, escalation rate, satisfaction, hallucinations |
| No test mode for bot | Bot goes live and immediately offends customer | Create test mode; admin sends test messages; reviews responses |
| Bot config changes require restart | Admin changes settings but old behavior continues | Implement hot-reload; apply changes on next message |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Webhook Integration:** Often missing signature verification — verify HMAC validation on every webhook
- [ ] **AI Bot Responses:** Often missing human review — test 50+ conversations before going live
- [ ] **Environment Variables:** Often missing validation — add startup check for missing critical vars
- [ ] **Clerk Setup:** Often missing organization creation — manually create org in Clerk Dashboard
- [ ] **Dev Mode Code:** Often missing comprehensive audit — search codebase for all dev mode checks
- [ ] **Webhook URL Configuration:** Often missing verification — manually test webhook delivery from Kapso/n8n
- [ ] **Logging and Monitoring:** Often missing before launch — set up logs and Slack alerts before first customer
- [ ] **Performance Baseline:** Often missing pre-deployment testing — run production build; test all pages locally
- [ ] **Database Integrity:** Often missing validation — verify row counts and sample records match
- [ ] **Rate Limiting:** Often missing distributed implementation — verify works with multiple instances
- [ ] **Bot Behavior Testing:** Often missing edge case handling — test what bot says given nonsensical input
- [ ] **Org Configuration:** Often missing OAuth setup — custom OAuth credentials required for production
- [ ] **Webhook Timeouts:** Often missing async implementation — verify webhook returns immediately
- [ ] **Message Idempotency:** Often missing duplicate detection — verify webhook twice doesn't create duplicate message

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong env vars in production | **LOW** | 1. Identify wrong values 2. Update in Vercel environment vars 3. Redeploy 4. Monitor logs for errors |
| Dev mode code in production | **MEDIUM** | 1. Remove `NEXT_PUBLIC_DEV_MODE` from env 2. Redeploy with dev mode checks fixed 3. Verify no mock data |
| Webhook URL incorrect | **LOW** | 1. Identify correct URL 2. Update in Kapso/n8n 3. Send test webhook to verify receipt |
| Clerk org missing | **HIGH** | 1. Create org in Clerk Dashboard 2. Invite first user 3. Test login flow 4. Restore from backup if data lost |
| Webhook signature broken | **HIGH** | 1. Identify spoofed webhook 2. Rollback code 3. Re-deploy with correct verification 4. Rotate webhook secret |
| AI bot hallucinating | **HIGH** | 1. Disable bot (human-only mode) 2. Review what bot said 3. Contact customers with corrections 4. Implement guardrails 5. Re-enable with human review |
| Rate limiting outage | **MEDIUM** | 1. Increase thresholds 2. Redeploy 3. Monitor queue 4. Migrate to distributed rate limiting |
| Webhook timeout loses messages | **MEDIUM** | 1. Refactor to async jobs 2. Check partial processing in database 3. Restore from backup if needed 4. Reprocess lost messages |
| Data loss in migration | **CRITICAL** | 1. Restore from pre-migration backup immediately 2. Investigate script 3. Test on staging 4. Re-run with fixes 5. Verify integrity |
| Blind production (no logs) | **MEDIUM** | 1. Enable logging immediately 2. Deploy to production 3. Reproduce issue if possible 4. Use future logs to debug |

---

## Phase-Specific Prevention Mapping

| Phase | Pitfall | Mitigation |
|-------|---------|-----------|
| **Phase 1: Pre-Deploy Verification** | Dev mode code shipped | Search codebase for all dev mode checks; run production build locally |
| **Phase 1: Pre-Deploy Verification** | Wrong env vars | Create checklist of every secret that changes; verify on Vercel |
| **Phase 1: Pre-Deploy Verification** | Webhook URLs incorrect | Manually update all webhooks to production domain |
| **Phase 1: Pre-Deploy Verification** | Clerk org missing | Manually create org in Clerk Dashboard; test first user login |
| **Phase 1: Pre-Deploy Verification** | Bot hallucinating | Review 50+ test conversations; have non-developer check accuracy |
| **Phase 1: Pre-Deploy Verification** | Rate limiting not distributed | Audit rate limiting code; verify works with multiple instances |
| **Phase 1: Pre-Deploy Verification** | No monitoring setup | Configure Vercel Logs, Sentry, Slack alerts before deploying |
| **Phase 2: Deploy** | Webhook signature missing | Add webhook secret to Vercel env vars; verify in logs |
| **Phase 2: Deploy** | Webhook timeout issues | Monitor webhook handler latency; verify async jobs processing |
| **Phase 2: Deploy** | Build verification | Run `npm run build` and `npm run start` locally; test all pages |
| **Phase 3: Post-Deploy (Day 1)** | Webhooks don't arrive | Send test webhook immediately; verify receipt in logs |
| **Phase 3: Post-Deploy (Day 1)** | Bot doesn't respond | Customer sends test WhatsApp message; check logs for webhook and LLM response |
| **Phase 3: Post-Deploy (Day 1)** | Monitoring shows errors | Review logs hourly for first 24 hours; act on any errors immediately |
| **Phase 3: Post-Deploy (Week 1)** | Human review of bot | Review every bot response for first week; track quality metrics |
| **Phase 3: Post-Deploy (Week 1)** | Data integrity issues | Run hourly data validation checks; compare conversation counts |

---

## Sources

### Official Documentation
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Convex Production Deployment Guide](https://docs.convex.dev/production)
- [Clerk Production Deployment](https://clerk.com/docs/guides/development/deployment/production)
- [Clerk Organization Management](https://clerk.com/docs/guides/organizations/create-and-manage)

### Best Practices & Guides
- [Vercel: Top Mistakes When Deploying Next.js Apps](https://dev.to/kuberns_cloud/top-mistakes-when-deploying-nextjs-apps-170f)
- [Convex: Bandwidth and Scalability Concerns](https://github.com/get-convex/convex-backend/issues/95)
- [n8n Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

### AI/Chatbot Safety
- [Avoid AI Chatbot Deployment Mistakes](https://worktual.co.uk/blog/ai-chatbot-deployment-mistakes/)
- [Epic LLM/Chatbot Failures in 2026](https://research.aimultiple.com/chatbot-fail/)

### Infrastructure & Operations
- [API Rate Limiting Guide 2026](https://www.levo.ai/resources/blogs/api-rate-limiting-guide-2026)
- [WhatsApp API Errors & Troubleshooting](https://www.wati.io/en/blog/whatsapp-business-api/whatsapp-api-errors-solutions/)
- [Production Debugging: Logs, Metrics, Traces](https://devops.com/debugging-in-production-leveraging-logs-metrics-and-traces/)

### Data Management
- [Data Migration Risks and Checklist](https://www.montecarlodata.com/blog-data-migration-risks-checklist/)
- [SaaS Multitenancy Best Practices](https://frontegg.com/blog/saas-multitenancy)

---

*Pitfalls research for: WhatsApp CRM SaaS (Next.js 15 + React 19 + Convex + Clerk)*
*Milestone: v3.5 Production Go-Live*
*Researched: 2026-01-28*
*Confidence: HIGH*
