# Pitfalls Research

**Domain:** Workflow Integration & Lead Automation for CRM
**Researched:** 2026-02-01
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Webhook Flood Creating Duplicate Leads

**What goes wrong:**
Every Kapso message webhook triggers a new lead creation. Without idempotency, a single conversation generates multiple duplicate contact records. The "double chats" issue you've seen in Kapso inbox indicates webhooks may be delivered multiple times, causing cascading duplicates in the database.

**Why it happens:**
Webhook providers retry failed deliveries (Kapso retries at 10s, 40s, 90s). If your endpoint is slow (>10s timeout) or returns non-200, the same message event gets delivered 2-4 times. Without tracking processed webhook IDs, each retry creates a new lead record.

**How to avoid:**
1. **Track webhook event IDs in Convex:** Create `webhookAudit` table with unique index on `kapso_message_id` or `X-Idempotency-Key` header
2. **Return 200 OK immediately:** Acknowledge within 10s, then queue processing asynchronously
3. **Implement idempotency check:**
   ```typescript
   const eventId = headers['X-Idempotency-Key'] || payload.message_id
   const existing = await ctx.db.query('webhookAudit').withIndex('by_event_id', q => q.eq('event_id', eventId)).first()
   if (existing) return { status: 'duplicate', processed_at: existing.created_at }
   ```
4. **Phone normalization BEFORE dedup:** Normalize to E.164 format (+6281234567890) before checking duplicates

**Warning signs:**
- Multiple contact records with same phone number (different formats: +62813, 0813, 62813)
- `webhookAudit` table shows same `kapso_message_id` appearing 2-4 times
- Logs show webhook endpoint response times >8 seconds
- "Duplicate contact" user complaints
- Lead count increases faster than actual message volume

**Phase to address:**
Phase 1 (Webhook Infrastructure) — MUST have idempotency before any lead creation

---

### Pitfall 2: Phone Number Normalization Hell

**What goes wrong:**
Indonesians enter phone numbers inconsistently: `0813-1859-025`, `+62 813 1859 025`, `62 813 1859 025`, `62-813-1859-025`. Without normalization, each format creates a separate contact. Deduplication fails, causing fragmented conversation histories, duplicate leads, and frustrated users seeing "new lead" for returning customers.

**Why it happens:**
WhatsApp profiles may have phone in different format than user's manual entry. Kapso may send `+62813...` while user searches `0813...`. No single source of truth for phone format. Indonesia-specific: domestic format starts with `0`, international drops the `0` for `+62`.

**How to avoid:**
1. **Normalize at write-time:** Every contact insert/update normalizes phone to E.164
2. **Use libphonenumber library:** Google's library handles Indonesia-specific rules
   ```typescript
   import { parsePhoneNumber } from 'libphonenumber-js'
   const normalized = parsePhoneNumber(phone, 'ID').format('E.164') // +6281318590025
   ```
3. **Dual storage:** Store both `phone` (user-entered) and `phone_normalized` (E.164) — schema already has this
4. **Index on normalized field:** Search/dedup uses `phone_normalized`, display uses `phone`
5. **Normalize search queries:** When user searches `0813...`, normalize to `+62813...` before query

**Warning signs:**
- Multiple contacts with similar phone numbers (same digits, different format)
- Search returns no results when user knows contact exists
- "Lead already exists" shown as "new lead"
- `contacts` table has >1 record per `phone_normalized` value
- Users report "conversation disappeared" after sending message

**Phase to address:**
Phase 1 (Database Schema) — Add `phone_normalized` field and normalization function before webhook integration

---

### Pitfall 3: Workflow Edits Breaking Active Automations

**What goes wrong:**
User edits workflow rules in Kapso UI (e.g., changes handoff keyword from "human" to "agent"). Active conversations using old keyword don't trigger handoff. Worse: changing a workflow rule can orphan in-flight leads, causing Sarah bot to stop responding or duplicate responses (both old and new rule fire).

**Why it happens:**
Workflow systems rarely version their rules. Changes apply immediately to all conversations, including mid-conversation ones. No rollback mechanism. The "double chats" issue might stem from this: old workflow trigger + new workflow trigger both firing on same message.

**How to avoid:**
1. **Settings snapshot on each change:** Store workflow config version in `settingsBackup` table (schema already exists)
2. **Read-only UI display of Kapso rules:** Don't build workflow editor that syncs to Kapso — too risky
3. **Manual sync process:** Admin reviews changes in Kapso UI, then clicks "Sync from Kapso" in CRM to pull latest
4. **Validation before sync:** Compare new vs. old config, show diff, require confirmation
5. **Pause automations toggle:** Quick killswitch to disable all workflow triggers during debugging

**Warning signs:**
- Users report "bot stopped responding"
- Duplicate messages from bot (same content, seconds apart)
- `workflow_executions` logs show same message matching multiple rules
- Handoff keywords not triggering handoff
- Settings page shows different rules than Kapso UI

**Phase to address:**
Phase 2 (Settings UI) — Build read-only sync, not bi-directional editor

---

### Pitfall 4: Daily Summary Cron Job Cost Explosion

**What goes wrong:**
Daily AI summary runs at 9 AM for all workspaces. Each workspace sends all messages from previous day to Grok API. At 100 workspaces × 50 messages/day × 500 tokens/message = 2.5M tokens/day. At $0.50/M tokens (Grok pricing), that's $1.25/day base, but summarization requires input context, so actual cost is 3-5× higher. As user base grows, this becomes $150-200/month in AI costs with no revenue correlation.

**Why it happens:**
Cron jobs are "fire and forget" — no rate limiting, no budget checks. Developers optimize for features, not cost. Daily summaries seem harmless at 10 users, but don't scale linearly. Grok 4.1-fast is fast but not cheap at scale.

**How to avoid:**
1. **Batch API for summaries:** Use Gemini Batch API (50% discount) for non-urgent daily summaries
2. **Incremental summarization:** Don't re-summarize entire history — only new messages since last summary
3. **Smart sampling:** For high-volume workspaces (>100 messages/day), sample representative messages, not all
4. **Budget alerts:** Track `aiUsage` table, alert when workspace exceeds $X/month
5. **Rate limiting by tier:** Free tier = weekly summaries, paid tier = daily
6. **Prompt optimization:** Reduce system prompt from full persona to minimal instructions (20-30% token savings)

**Warning signs:**
- `aiUsage` table shows daily spike at 9 AM
- Cost per workspace increasing linearly with message volume
- Grok API rate limit errors in logs
- Monthly AI costs growing faster than user count
- Summary generation time >30 seconds (indicates large context)

**Phase to address:**
Phase 3 (Daily Summaries) — Implement before launching cron job

---

### Pitfall 5: Race Condition Between Webhook and Sync Job

**What goes wrong:**
Kapso webhook arrives at 10:00:15 AM with new message. Background sync job runs at 10:00:20 AM and fetches all messages from Kapso. Both try to create the same contact/message record. Result: duplicate key errors, or worse — partial updates where webhook writes name but sync job overwrites with stale data.

**Why it happens:**
Two async data sources (webhook push + polling sync) writing to same records without coordination. Convex uses Optimistic Concurrency Control (OCC) — last write wins, but without proper deduplication logic, earlier write might have partial data that gets lost.

**How to avoid:**
1. **Webhook-only lead creation:** Never create contacts in sync job — only update existing
2. **Idempotent upserts:** Use `phone_normalized` as natural key for upsert logic
   ```typescript
   const existing = await ctx.db.query('contacts')
     .withIndex('by_workspace_phone', q => q.eq('workspace_id', wsId).eq('phone_normalized', normalizedPhone))
     .first()

   if (existing) {
     await ctx.db.patch(existing._id, { ...updates, updated_at: Date.now() })
   } else {
     await ctx.db.insert('contacts', { ...newContact })
   }
   ```
3. **Timestamp-based merge:** When conflict detected, prefer newer data (`updated_at` or `last_message_at`)
4. **Background sync monitors only:** Sync job flags stale contacts in `syncHealth` table, doesn't auto-update
5. **Disable background sync initially:** Only enable after webhook idempotency proven stable

**Warning signs:**
- Convex OCC errors in logs ("transaction conflicted with concurrent write")
- Contact fields randomly reverting to old values
- `syncFailures` table shows high error rate
- Users report "my note disappeared" (overwritten by sync)
- Last activity timestamps going backwards

**Phase to address:**
Phase 1 (Webhook) — Design webhook-first architecture before adding background sync

---

### Pitfall 6: "Double Chats" from Conversation Deduplication

**What goes wrong:**
User sees same conversation twice in Kapso inbox. This indicates Kapso's conversation_id isn't stable or your webhook handler creates new `conversations` record for each message instead of finding existing. When user replies in one "chat", the other doesn't update. Lead data fragments across two conversation records.

**Why it happens:**
Kapso might generate new conversation_id after certain events (e.g., 24hr timeout, user blocks/unblocks). Or webhook payload has conversation context in different field than expected. Your code creates conversation by `contact_id` without checking if `kapso_conversation_id` already exists.

**How to avoid:**
1. **Index on kapso_conversation_id:** Schema already has this — USE IT
2. **Lookup by kapso_conversation_id first:**
   ```typescript
   const existing = await ctx.db.query('conversations')
     .withIndex('by_kapso_conversation', q => q.eq('kapso_conversation_id', kapsoConvId))
     .first()
   ```
3. **If not found, lookup by contact_id + status=open:** Reuse open conversation instead of creating new
4. **Store conversation metadata:** Track Kapso's conversation creation timestamp to detect duplicates
5. **Webhook payload validation:** Log full payload when conversation_id changes unexpectedly
6. **Admin UI to merge conversations:** Manual tool to consolidate fragmented conversations

**Warning signs:**
- Users report "same contact shows up twice"
- `conversations` table has multiple records with same `kapso_conversation_id`
- Multiple `conversations` records for same `contact_id` with `status='open'`
- Message count mismatch between Kapso inbox and CRM database
- Webhook logs show conversation_id changing for same phone number

**Phase to address:**
Phase 1 (Webhook Handler) — Fix before users accumulate duplicate conversations

---

### Pitfall 7: Lead Automation Creating Low-Quality Spam Leads

**What goes wrong:**
"Automatic lead creation on every message" sounds great until you get 100 wrong numbers, spam messages ("Congratulations! You've won"), and test messages from your own team. Every message becomes a "lead", diluting real prospects and making dashboard unusable.

**Why it happens:**
Not all inbound messages are leads. Some are:
- Wrong numbers
- Spam/marketing messages
- Customer service inquiries (already customers)
- Internal test messages
- Bot messages (automated responses from other systems)

**How to avoid:**
1. **Qualification threshold:** Require 2+ messages OR Sarah bot engagement before creating lead
2. **Spam detection:** Filter common spam patterns (URLs with .xyz domains, "congratulations", "claim prize")
3. **Team phone whitelist:** Skip lead creation for known team member phones
4. **Engagement signals:** Only create lead if user responds to Sarah's greeting within 24hr
5. **Lead status = 'unqualified' initially:** Auto-archive if no engagement after 48hr
6. **Manual review queue:** First 50 leads flagged for admin review to tune filters

**Warning signs:**
- Spike in leads with `message_count = 1`
- High percentage of leads with `lead_status = 'archived'`
- User complaints about "too many junk leads"
- Dashboard shows leads with obvious spam content
- Lead-to-qualified conversion rate <5%

**Phase to address:**
Phase 2 (Lead Creation Logic) — Build qualification filters before auto-creation

---

### Pitfall 8: Missing Webhook Signature Verification

**What goes wrong:**
Webhook endpoint accepts any POST request without verifying it came from Kapso. Attacker discovers your webhook URL and floods it with fake messages, creating thousands of spam leads, consuming AI credits (Sarah bot responds to each), and potentially triggering rate limits or cost alerts.

**Why it happens:**
Signature verification requires extra code. Developers skip it during MVP to ship faster. Works fine until webhook URL leaks (logs, error monitoring, public GitHub repo). Kapso sends `X-Webhook-Signature` header but doesn't enforce verification.

**How to avoid:**
1. **ALWAYS verify signatures:** Use existing `webhook-verification.ts` utility
   ```typescript
   const signature = request.headers.get('X-Webhook-Signature')
   const isValid = verifyWebhookSignature(rawBody, signature, process.env.KAPSO_WEBHOOK_SECRET!)
   if (!isValid) return new Response('Unauthorized', { status: 401 })
   ```
2. **Use constant-time comparison:** Existing code already uses `crypto.timingSafeEqual()` — prevents timing attacks
3. **Validate payload structure:** Even signed payloads should match expected schema
4. **Rate limit by IP:** Max 100 webhooks/minute from single IP
5. **Monitor webhook audit table:** Alert on sudden spike in webhook volume

**Warning signs:**
- Webhook endpoint getting hit from unexpected IPs
- `webhookAudit` table shows payloads with missing/invalid fields
- Lead creation spike with no corresponding message activity in Kapso UI
- AI usage costs spike without user growth
- Logs show 401 errors on webhook endpoint

**Phase to address:**
Phase 1 (Webhook Endpoint) — MUST have before going live

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip webhook idempotency | Ship faster, simpler code | Duplicate leads accumulate, user trust erodes | Never — duplicates are data corruption |
| Use `any` type for Kapso payloads | No TypeScript errors during dev | Runtime errors in production when payload changes | Only during initial prototyping — must type before Phase 1 ships |
| Manual phone normalization (regex) | Avoid library dependency | Breaks for edge cases (extensions, special formats) | Never — use libphonenumber-js |
| Sync-over-async webhook handling | Simpler code flow | Webhook timeouts, retry storms, duplicate processing | Never — async queue is required |
| Store Kapso API key in workspace table | Convenient for multi-tenant | Rotation requires DB migration, exposure risk | Only if encrypted at rest AND rotated via env var override |
| Skip phone_normalized field | One less field to maintain | Impossible to deduplicate reliably | Never — deduplication is core to CRM |
| Combine webhook + sync job writes | Single code path for contact updates | Race conditions, data overwrites | Only if webhook disabled OR sync disabled, never both active |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Kapso Webhooks | Processing webhook synchronously in endpoint handler | Return 200 immediately, queue event for async processing (Convex action or separate queue) |
| Kapso API Rate Limits | Calling API for each contact in loop | Batch operations where possible, implement exponential backoff with jitter on 429 responses |
| Phone Number Storage | Storing as entered by user | Normalize to E.164 (+6281234567890) before storage, keep original for display |
| Conversation Linking | Creating conversation by contact_id only | Check `kapso_conversation_id` first, fallback to contact_id + status |
| Workflow Sync | Two-way sync between CRM UI and Kapso | Read-only pull from Kapso — edit in Kapso UI, sync to CRM (prevents version conflicts) |
| Daily Summary Cron | Running at same time for all workspaces | Stagger by workspace_id hash to distribute load (e.g., workspace_id % 24 = hour offset) |
| AI API Calls | Sending full conversation history each time | Send only new messages + brief summary of previous context (reduces tokens 60-80%) |
| Webhook Retries | Treating retries as new events | Check `X-Idempotency-Key` header, log and skip if already processed |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all contacts for dedup check | Slow webhook processing (>2s) | Use indexed query on `phone_normalized`, not table scan | >1,000 contacts |
| Full conversation history in AI context | Summary generation timeout, high token costs | Sliding window (last 50 messages) + summary of earlier messages | >200 messages/conversation |
| Synchronous webhook processing | 10s timeout errors, retry storms | Queue-based async processing, return 200 in <500ms | >10 webhooks/second |
| Daily summary for all conversations | Cron job takes >10 minutes, timeouts | Paginate by conversation_id, process in batches of 50 | >500 conversations |
| Real-time workflow execution logs | Database write amplification | Write to logs async, aggregate stats hourly | >100 workflows/minute |
| Unindexed search queries | Search takes >5s as data grows | Index on commonly searched fields (phone_normalized, name, email) | >5,000 contacts |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing Kapso API key in plaintext | Key leaks in logs/errors expose all WhatsApp access | Encrypt at rest, never log, rotate quarterly |
| No webhook signature verification | Anyone can flood webhook with fake leads | HMAC signature verification (see `webhook-verification.ts`) |
| Exposing `phone_normalized` in API responses | PII leakage, GDPR violation | Only return to authenticated users, redact in logs |
| Logging full webhook payloads | Phone numbers + messages in log files | Redact PII fields, log only event metadata |
| No rate limiting on webhook endpoint | DoS via webhook flood | Rate limit by IP (100/min) + signature verification |
| AI summaries include PII | Sensitive data in AI provider logs (Grok, Gemini) | Anonymize phone/name before sending to AI, use IDs only |
| Sharing workspace data across tenants | Contact data leaks between workspaces | ALWAYS filter by workspace_id in ALL queries |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing duplicate contacts (different phone formats) | Confusion, wasted time, "this CRM is broken" | Phone normalization + deduplication before display |
| No visual indicator during workflow sync | User edits settings, doesn't know if sync worked | Show sync status (synced ✓ / syncing... / error ⚠️) with timestamp |
| Auto-creating lead for every message | Dashboard flooded with spam, real leads buried | Require engagement threshold (2+ messages or bot interaction) |
| Breaking change to workflow rules without warning | Automations stop working, silent failures | Settings diff UI before sync, require confirmation |
| Daily summary at fixed time for all timezones | Indonesian user gets summary at 2 AM | Respect workspace timezone setting, default to user's local 9 AM |
| No way to merge duplicate contacts | Users stuck with fragmented conversation history | Manual merge UI with conflict resolution (choose which data to keep) |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Webhook Handler:** Often missing idempotency check — verify `webhookAudit` table prevents duplicate processing
- [ ] **Phone Normalization:** Often missing E.164 format validation — verify libphonenumber-js integration, not just regex
- [ ] **Lead Creation:** Often missing spam filters — verify wrong numbers and test messages don't become leads
- [ ] **Daily Summaries:** Often missing cost tracking — verify `aiUsage` table logs all tokens and costs
- [ ] **Workflow Sync:** Often missing version history — verify `settingsBackup` table stores each config change
- [ ] **Conversation Linking:** Often missing `kapso_conversation_id` lookup — verify no duplicate conversations in database
- [ ] **Search Functionality:** Often missing normalized phone search — verify search by "0813" finds "+62813" records
- [ ] **Error Handling:** Often missing retry logic — verify webhook failures go to `syncFailures` table, not silent drop

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate leads from webhook flood | MEDIUM | 1. Add idempotency check to webhook handler<br>2. Run deduplication script (merge by `phone_normalized`)<br>3. Archive duplicates with `lead_status='duplicate'` |
| Phone format causing missed deduplication | HIGH | 1. Install libphonenumber-js<br>2. Backfill `phone_normalized` for all existing contacts<br>3. Re-run dedup with normalized values<br>4. Manual review of merged records |
| Workflow edit broke active automations | LOW | 1. Check `settingsBackup` for last working config<br>2. Restore previous version<br>3. Re-sync from Kapso UI (don't use cached config) |
| AI cost explosion from daily summaries | MEDIUM | 1. Pause cron job immediately<br>2. Implement batch API + sampling<br>3. Add budget alerts<br>4. Resume with rate limits |
| Race condition between webhook + sync | HIGH | 1. Disable background sync job<br>2. Audit `syncFailures` for conflicts<br>3. Implement webhook-only writes<br>4. Use sync job for monitoring only |
| Double chats from conversation dedup | MEDIUM | 1. Add `by_kapso_conversation` index lookup<br>2. Run merge script (consolidate messages under single conversation)<br>3. Archive empty duplicate conversations |
| Spam leads diluting dashboard | LOW | 1. Add qualification filters to lead creation<br>2. Bulk archive unengaged leads (no response to Sarah in 48hr)<br>3. Add spam pattern detection |
| Missing webhook signature verification | HIGH | 1. Add signature check immediately (reject unsigned requests)<br>2. Audit `webhookAudit` for suspicious payloads<br>3. Delete spam leads created from fake webhooks<br>4. Rotate webhook secret |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Webhook flood duplicates | Phase 1: Webhook Infrastructure | `webhookAudit` table shows 0 duplicate `event_id` entries |
| Phone normalization | Phase 1: Database Schema | All contacts have valid `phone_normalized` in E.164 format |
| Workflow edits breaking automations | Phase 2: Settings Sync UI | `settingsBackup` table logs each config change with timestamp |
| AI cost explosion | Phase 3: Daily Summaries | `aiUsage` table per-workspace costs <$5/month at 50 messages/day |
| Webhook/sync race conditions | Phase 1: Webhook-First Design | Zero OCC errors in logs, `syncFailures` table empty |
| Double chats | Phase 1: Conversation Linking | No duplicate `kapso_conversation_id` in `conversations` table |
| Spam leads | Phase 2: Lead Qualification | <10% of leads archived as unengaged within 48hr |
| Missing signature verification | Phase 1: Webhook Security | All webhook requests verified, 401 for invalid signatures |

## Sources

**Webhook Best Practices:**
- [How to Apply Webhook Best Practices to Business Processes | Integrate.io](https://www.integrate.io/blog/apply-webhook-best-practices/)
- [Webhooks Best Practices: Lessons from the Trenches | Medium](https://medium.com/@xsronhou/webhooks-best-practices-lessons-from-the-trenches-57ade2871b33)
- [Reliable Webhook Handling: Best Practices to Prevent Duplicate Data | KitchenHub](https://www.trykitchenhub.com/post/reliable-webhook-handling-best-practices-to-prevent-duplicate-data-in-your-pos)

**Phone Number Normalization:**
- [How to untangle phone numbers | Factbranch](https://factbranch.com/blog/2024/normalize-phone-numbers/)
- [How Inconsistent Phone Number Formatting Complicates Deduplication | Insycle](https://blog.insycle.com/phone-number-formatting-deduplication)

**AI Cost Optimization:**
- [Best Practices for AI API Cost & Throughput Management (2025) | Skywork](https://skywork.ai/blog/ai-api-cost-throughput-pricing-token-math-budgets-2025/)
- [Denial of Wallet: Cost-Aware Rate Limiting for Generative AI Applications | HandsOnArchitects](https://handsonarchitects.com/blog/2025/denial-of-wallet-cost-aware-rate-limiting-part-1/)

**CRM Deduplication:**
- [CRM Deduplication: How to Remove Duplicates (2026 Tutorial) | Breakcold](https://www.breakcool.com/blog/crm-deduplication)
- [Why Your All-in-One CRM Creates Duplicate Leads & How to Fix It [2026 Guide] | ConvergeHub](https://www.convergehub.com/blog/why-crm-creates-duplicate-leads-and-how-to-fix-it)

**Workflow Versioning:**
- [Workflow Builder - How to implement version control and change tracking](https://www.workflowbuilder.io/blog/how-to-implement-version-control-and-change-tracking-in-workflows)
- [n8n Workflow Versioning Without "Who Changed This?" | Medium](https://medium.com/@Quaxel/n8n-workflow-versioning-without-who-changed-this-f6007b5db1be)

**Convex OCC & Race Conditions:**
- [OCC and Atomicity | Convex Developer Hub](https://docs.convex.dev/database/advanced/occ)
- [Clerk Webhooks: Data Sync with Convex](https://clerk.com/blog/webhooks-data-sync-convex)

**Project-Specific Sources:**
- my21staff codebase: `convex/schema.ts`, `src/lib/webhook-verification.ts`
- Kapso documentation: `.agents/skills/kapso-ops/references/webhooks-overview.md`
- v2.0 requirements: `.planning/milestones/v2.0-REQUIREMENTS.md`

---
*Pitfalls research for: my21staff v2.0.1 Workflow Integration & Lead Automation*
*Researched: 2026-02-01*
