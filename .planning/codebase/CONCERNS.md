# Codebase Concerns

**Analysis Date:** 2026-01-30

## Tech Debt

**Media Upload Infrastructure:**
- Issue: Media messaging is disabled and non-functional
- Files: `src/app/api/messages/send-media/route.ts`
- Impact: Users cannot send media (images, videos, documents) in WhatsApp conversations
- Current state: Route returns 503 error with message "Media messaging temporarily unavailable"
- Fix approach:
  1. Implement Convex file storage for media (currently uses placeholder Supabase removal)
  2. Integrate with Kapso API media sending endpoints
  3. Add media handling to message thread UI
  4. Priority: High (Phase 2)

**Rate Limiter Using In-Memory Store:**
- Issue: Rate limiting stored in memory only, not persisted across server restarts
- Files: `src/lib/rate-limit.ts`
- Impact: Rate limits reset on deployment or server restart; in distributed environments, different instances don't share state
- Current state: Uses JavaScript object `store: RateLimitStore = {}` with setInterval cleanup
- Fix approach:
  1. Migrate to Redis or Convex mutation-based rate limiting
  2. Ensure limits persist across instances and restarts
  3. Priority: Medium (impacts production stability)

**Type Safety Gaps (Use of `any`):**
- Issue: Multiple locations use `any` type bypassing TypeScript safety
- Files:
  - `src/lib/ari/processor.ts` (lines 556, 602): `updatedContext: any`, `handoffContext: any`
  - `src/app/api/webinars/[id]/route.ts`: `updates: any`
  - `src/app/api/articles/[id]/route.ts`: `updates: any`
  - `src/app/api/contacts/[id]/route.ts`: `updates: any`
- Impact: Loss of type checking, potential runtime errors in update operations
- Fix approach:
  1. Define proper types for update payloads
  2. Create shared types for partial updates to resources
  3. Replace `any` casts with proper type annotations
  4. Priority: Medium (proactive improvement)

**Disabled Codebase:**
- Issue: Supabase-related sync endpoint disabled and never removed
- Files: `src/app/api/sync/kapso-history/route.ts.disabled`
- Impact: Dead code, potential confusion about intended functionality
- Fix approach:
  1. Confirm if this is needed for any legacy functionality
  2. Delete if not needed, or re-enable with proper implementation
  3. Priority: Low (code cleanup)

## Known Bugs / Incomplete Features

**Typing Indicator Not Implemented:**
- Issue: Typing indicator logic stubbed out, waiting for real-time Convex support
- Files:
  - `src/lib/queries/use-typing-indicator.ts` (line 49)
  - `src/lib/queries/broadcast-typing.ts` (line 14)
- Impact: Users don't see "contact is typing..." indicator in conversations
- Workaround: None - feature not yet available
- Priority: Medium (UX improvement)

**ARI Bot Metrics Calculation Not Implemented:**
- Issue: Lead score calculation from ARI bot conversations deferred to Phase 3
- Files: `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx` (line 797)
- Impact: "ARI Performance" section shows placeholder text, scores won't calculate until bot is live
- Current state: Manual lead scoring works, but bot-derived scoring pending
- Fix approach: Implement after bot conversation metadata is captured
- Priority: Medium (depends on bot feature completion)

**Email Notifications for Ticket Status Changes:**
- Issue: Ticket status transition webhook does not send email notifications
- Files: `src/app/api/tickets/[id]/transition/route.ts` (line 98)
- Impact: Users don't receive alerts when ticket status changes (assigned, resolved, etc.)
- Current state: Status updates work in database but no notification sent
- Fix approach:
  1. Implement email service integration (Resend is already available)
  2. Add email template for status transitions
  3. Trigger on ticket status change
  4. Priority: Medium (feature completion)

**Public Comments Query Missing:**
- Issue: Portal API queries all comments, should filter to public only
- Files: `src/app/api/portal/tickets/[id]/comments/route.ts` (line 30)
- Impact: Public ticket portal may expose internal/private comments
- Fix approach:
  1. Add `is_public` boolean field to comments schema
  2. Filter by `is_public === true` in public portal query
  3. Priority: High (security issue)

## Security Considerations

**Encryption Key Management:**
- Risk: Unencrypted API key storage when ENCRYPTION_KEY not set
- Files: `src/lib/crypto.ts` (lines 69-78 `safeEncrypt` function)
- Current mitigation: `safeEncrypt` gracefully falls back to plaintext with warning
- Recommendations:
  1. Add validation in startup to ensure ENCRYPTION_KEY is set in production
  2. Don't allow plaintext storage of sensitive data (API keys, tokens) in production
  3. Add environment checks to reject startup if required secrets missing
  4. Priority: High (security-critical)

**Webhook Signature Verification Optional:**
- Risk: Webhook processing continues even if secret not configured
- Files: `src/app/api/webhook/kapso/route.ts` (lines 104-112)
- Current mitigation: Logs warning when signature verification disabled, still returns 200
- Recommendations:
  1. Require KAPSO_WEBHOOK_SECRET in production environments
  2. Reject unsigned webhooks with 401 instead of logging and accepting
  3. Add monitoring/alerting for missing webhook secret
  4. Priority: High (webhook security)

**PII in Logs (Limited Masking):**
- Risk: Phone numbers in webhook logs partially masked but may still leak data
- Files: `src/app/api/webhook/kapso/route.ts` (lines 13-20)
- Current mitigation: Regex masking of phone numbers, substring(0, 500) truncation
- Recommendations:
  1. Expand PII masking to include more data types (names, email)
  2. Use structured logging with redaction rules instead of string replacement
  3. Consider sending logs to external service instead of stdout
  4. Priority: Medium (data privacy)

**Meta API Token Storage:**
- Risk: Meta/WhatsApp API access tokens encrypted but stored in workspace settings
- Files: `src/lib/ari/processor.ts` (line 955, 968-971) - `meta_access_token`
- Current mitigation: Data encrypted with AES-256-GCM at rest
- Recommendations:
  1. Rotate tokens on schedule (monthly recommended)
  2. Add token expiration tracking and auto-refresh
  3. Implement webhook token revocation detection
  4. Priority: Medium (service-level security)

## Performance Bottlenecks

**Large Component Files:**
- Problem: Multiple components exceed 1500+ lines, difficult to maintain
- Files:
  - `src/lib/mock-data.ts`: 2259 lines (test/dev data)
  - `src/app/(dashboard)/[workspace]/settings/settings-client.tsx`: 1893 lines
  - `src/types/database.ts`: 1559 lines
  - `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`: 1529 lines
  - `src/components/contact/info-sidebar.tsx`: 1126 lines
- Cause: Settings and database detail views accumulate many tabs/sections
- Improvement path:
  1. Extract settings tabs into separate components (TagsTab, ReplyTab, etc.)
  2. Lazy-load less-used sections in contact detail sheet
  3. Move form configurations to separate constant files
  4. Priority: Low-Medium (refactoring, improves maintainability)

**ARI Processor Complexity:**
- Problem: `src/lib/ari/processor.ts` (992 lines) handles multiple concerns: state machine, scoring, routing, handoff
- Cause: Core business logic concentrated in single file
- Improvement path:
  1. Extract state transitions into dedicated handler
  2. Separate scoring calculation into orchestrator
  3. Move handoff logic to separate module
  4. Keep processor as thin orchestrator
  5. Priority: Medium (cognitive load, testing difficulty)

**Webhook Batch Processing Without Parallel Limits:**
- Problem: `src/app/api/webhook/kapso/route.ts` processes all workspace messages sequentially in loop
- Impact: Large message batches could cause slow processing and timeout
- Improvement path:
  1. Implement Promise.all batching with concurrency limits (e.g., 5 parallel workspaces)
  2. Add monitoring for webhook processing duration
  3. Consider queue-based processing for high-volume instances
  4. Priority: Low-Medium (depends on scale)

**Synchronous Contact Lookup in Message Loop:**
- Problem: Message webhook processes each contact with individual Convex mutations
- Files: `src/app/api/webhook/kapso/route.ts` (lines 226-238)
- Impact: For 50 messages from 10 unique contacts = 20 mutations serial
- Improvement path:
  1. Batch contact lookups: get all contacts in one query
  2. Batch conversation creation in parallel
  3. Cache contact maps to reduce redundant queries
  4. Priority: Medium (improves webhook latency)

## Fragile Areas

**User Initialization Race Condition:**
- Files: `src/hooks/use-ensure-user.ts`, multiple client components using it
- Why fragile: Convex queries that use `requireWorkspaceMembership` fail if user doc doesn't exist
- Safe modification:
  1. Understand that all workspace-scoped queries MUST check `useEnsureUser()`
  2. Any new page using workspace data must follow this pattern
  3. Test by clearing user document and checking for errors
- Test coverage: Documented in DEVELOPMENT-RULES.md but no automated tests
- Priority: High (affects multiple pages, production-facing)

**Dev Mode Checks Scattered:**
- Problem: `isDevMode` checks are component-specific, easy to miss when adding features
- Files: Throughout `src/`, checking `process.env.NEXT_PUBLIC_DEV_MODE`
- Why fragile: New components might not check dev mode and fail on localhost
- Safe modification:
  1. Create wrapper components for Clerk and Convex with built-in dev mode checks
  2. Centralize dev mode detection logic
  3. Add ESLint rule to warn about missing dev mode in client components
- Test coverage: Manual testing at `/demo` required
- Priority: Medium (improves developer experience)

**Contact-Database Sync Assumption:**
- Problem: Code assumes "Database is single source of truth" but no enforcement mechanism
- Files: DEVELOPMENT-RULES.md line 62-96 (architectural rule)
- Why fragile: New features could create parallel data stores without detection
- Safe modification:
  1. Enforce via code review only (architecture pattern)
  2. Add query tracing to detect direct contact creation outside Database flow
  3. Document expected data flow in each feature's module
- Test coverage: No automated validation
- Priority: Medium (architectural integrity)

**Mock Data Duplication:**
- Problem: Settings form field configs defined in multiple places
- Files:
  - `src/lib/mock-data.ts` (MOCK_CONVEX_WORKSPACE.settings.form_field_scores)
  - `src/app/(dashboard)/[workspace]/settings/settings-client.tsx` (FORM_FIELD_CONFIGS)
- Why fragile: Configs can get out of sync when updating Eagle Overseas scoring logic
- Safe modification:
  1. Move FORM_FIELD_CONFIGS to `src/lib/form-config.ts`
  2. Import in both settings-client and mock-data
  3. Single source of truth for form structure
- Test coverage: Compared only during manual testing
- Priority: Low (affects UX polish)

## Scaling Limits

**In-Memory Rate Limiter:**
- Current capacity: Unlimited objects in memory, cleanup every 5 minutes
- Limit: High memory usage with many unique rate limit keys; no distributed state
- Scaling path:
  1. Migrate to Redis (recommended for Vercel)
  2. Or use Convex mutations with rate limit table
  3. Implement distributed rate limiting before high-traffic phases
  4. Priority: Medium (becomes critical at scale)

**Webhook Processing Without Queue:**
- Current capacity: Handles webhooks synchronously with `waitUntil()`
- Limit: If webhook processing > 30 seconds, Vercel function times out
- Scaling path:
  1. Implement job queue (Bull/RabbitMQ or Convex-based queue)
  2. Return 200 immediately, queue message for async processing
  3. Add monitoring for queue depth
  4. Priority: Medium (high-volume phase concern)

**Mock Data Hardcoded:**
- Current capacity: Fixed demo workspace and 100 mock contacts
- Limit: Cannot scale to true multi-tenant offline testing
- Scaling path:
  1. Add mock data generation factory
  2. Allow custom demo workspaces
  3. Generate realistic large datasets for performance testing
  4. Priority: Low (dev environment only)

## Dependencies at Risk

**Kapso API as Single Channel Provider:**
- Risk: Entire WhatsApp integration depends on Kapso's uptime/reliability
- Impact: If Kapso has outage, all messaging stops
- Current integration: `src/lib/kapso/` module (client.ts, verify-signature.ts)
- Mitigation:
  1. Add circuit breaker pattern for Kapso API calls
  2. Gracefully degrade (show error to user, don't crash app)
  3. Plan Meta Direct API as fallback (ROADMAP.md indicates this)
  4. Priority: Medium (operational resilience)

**Convex Real-Time Assumptions:**
- Risk: Typing indicator and live updates assume Convex real-time works
- Impact: Features don't work if Convex subscription system changes pricing/availability
- Current integration: Queries use `useQuery` auto-subscription
- Mitigation:
  1. Implement websocket fallback for critical features
  2. Add feature flags to disable real-time features if needed
  3. Monitor Convex availability
  4. Priority: Low (Convex is stable, but good to plan for)

**Clerk for Auth:**
- Risk: Authentication completely depends on Clerk availability
- Impact: If Clerk goes down, no one can log in (but app can still run in dev mode)
- Current integration: Middleware in `src/middleware.ts`, providers in `src/app/providers.tsx`
- Mitigation:
  1. Implement graceful auth fallback to dev mode
  2. Add session caching for brief Clerk outages
  3. Consider alternative auth provider as future option
  4. Priority: Low (Clerk has 99.99% SLA)

## Missing Critical Features

**Media Handling in Conversations:**
- Problem: Cannot send/receive images, videos, documents in WhatsApp
- Blocks: Key CRM use case - sharing contracts, screenshots, photos of documents
- Impact: Users work around limitation by asking to send via email/other channel
- Priority: High (blocks core feature)

**Email Notifications:**
- Problem: No way to alert users to important events (new message, ticket assigned, etc.)
- Blocks: Users miss conversations because they don't check app constantly
- Impact: Reduced engagement, customers don't get timely responses
- Priority: High (standard CRM feature)

**Analytics Dashboard:**
- Problem: No visibility into team performance, conversion rates, channel effectiveness
- Blocks: Data-driven decision making, ROI tracking for ads/campaigns
- Impact: Users can't optimize their sales process
- Priority: Medium (ROADMAP.md Priority 1)

**Instagram & Facebook Messenger Integration:**
- Problem: CRM only works with WhatsApp, Instagram DMs and Facebook Messenger separate
- Blocks: Omnichannel inbox feature, unified customer view
- Impact: Multi-channel businesses need external tools (Callbell, SleekFlow)
- Priority: Medium (ROADMAP.md Priority 1)

## Test Coverage Gaps

**Webhook Message Processing:**
- What's not tested: Webhook parsing, message batching, contact/conversation creation
- Files: `src/app/api/webhook/kapso/route.ts` (entire file)
- Risk: Bugs in webhook logic only discovered in production
- Priority: High (critical path)

**ARI Processor State Machine:**
- What's not tested: State transitions, scoring logic, routing decisions
- Files: `src/lib/ari/processor.ts` (50+ lines of state transition logic)
- Risk: Bot conversations break unpredictably when business logic changes
- Priority: High (complex logic)

**Contact Merge Logic:**
- What's not tested: Merging contacts with different data shapes, conversation consolidation
- Files: `src/app/api/contacts/merge/route.ts`
- Risk: Data loss or corruption when merging contacts
- Priority: High (data integrity)

**Form Scoring Calculation:**
- What's not tested: Lead score calculation from form responses
- Files: `src/lib/ari/scoring.ts`, form field scoring configuration
- Risk: Incorrect scores lead to wrong lead routing
- Priority: Medium (business logic)

**Error Boundary Coverage:**
- What's not tested: Tab error boundaries, component crash recovery
- Files: `src/components/error-boundaries/tab-error-boundary.tsx`
- Risk: One broken tab crashes entire section
- Priority: Low (UX resilience)

---

*Concerns audit: 2026-01-30*
