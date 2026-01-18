# Pitfalls Research: v2.1 Client Launch Ready

**Domain:** Email delivery, role-based permissions, support ticketing for WhatsApp CRM SaaS
**Researched:** 2026-01-18
**Project context:** my21staff on Vercel with Supabase RLS, first paying client (Eagle Overseas)

## Executive Summary

Three critical pitfalls require immediate attention: (1) SMTP from Vercel serverless has fundamental DNS resolution issues that cannot be fixed with timeouts — switch to HTTP-based email APIs like Resend or SendGrid; (2) Adding RBAC to existing systems without proper RLS policy updates creates security holes where roles exist but don't enforce access; (3) Building a ticketing system without defining status workflows first leads to tickets stuck in limbo. The first client onboarding is also high-risk — enterprise clients expect VIP treatment, not generic flows.

---

## Email Delivery Pitfalls

### Pitfall 1: SMTP DNS Resolution in Serverless (CRITICAL)

- **What goes wrong:** Vercel serverless functions cannot reliably resolve SMTP hostnames like `smtp.hostinger.com`. The current implementation shows `EBADNAME` errors despite correct credentials. This is not a configuration issue — it's a fundamental limitation of serverless DNS resolution.

- **Warning signs:**
  - `EBADNAME` or `ENOTFOUND` errors on SMTP hostname
  - Emails work locally but fail in production
  - Inconsistent delivery (works sometimes, fails others)
  - Timeouts despite `dnsTimeout: 30000` configuration

- **Prevention:**
  - **Switch to HTTP-based email APIs** — Resend, SendGrid, or Postmark offer REST APIs that work reliably in serverless
  - Resend has official Vercel integration and Next.js SDK
  - Never use raw SMTP in serverless; always use API-based sending
  - Current `nodemailer` + `smtp.hostinger.com` approach will not work reliably

- **Phase mapping:** Phase 23 (Email System) — must be addressed first, before any email features

- **Confidence:** HIGH — Verified via [Vercel documentation](https://vercel.com/kb/guide/serverless-functions-and-smtp) and [community discussions](https://github.com/vercel/vercel/discussions/4857)

### Pitfall 2: Email Deliverability and Spam Filters

- **What goes wrong:** Transactional emails (invitations, password resets) land in spam because domain authentication is incomplete or sender reputation is damaged by sharing infrastructure.

- **Warning signs:**
  - Users report not receiving emails
  - Low open rates on transactional emails
  - Emails visible in provider logs but not in inbox
  - High bounce rates (>2%) or spam complaints (>0.1%)

- **Prevention:**
  - Configure SPF, DKIM, and DMARC for `my21staff.com` domain
  - Use dedicated subdomain for transactional email (e.g., `mail.my21staff.com`)
  - Use email service with dedicated IP or good shared reputation
  - Test with seed addresses before production rollout
  - Monitor deliverability with Google Postmaster Tools

- **Phase mapping:** Phase 23 — during email provider setup

- **Confidence:** MEDIUM — Based on [email deliverability best practices](https://www.mailgun.com/blog/deliverability/avoid-emails-going-to-spam/) and Google's 2024-2025 requirements

### Pitfall 3: Missing Error Handling in Email Sending

- **What goes wrong:** Email API calls fail silently, users see success message but email never arrives. No retry mechanism means transient failures cause permanent loss.

- **Warning signs:**
  - Users invited but never receive email
  - No error logs for failed emails
  - Success responses from UI but no delivery

- **Prevention:**
  - Always wrap email sending in try/catch with proper error logging
  - Return email send status to UI (not just "invitation sent")
  - Implement retry logic (at least 3 attempts with exponential backoff)
  - Store email send attempts in database for debugging
  - Provide fallback: "Email not delivered? Copy invite link manually"

- **Phase mapping:** Phase 23 — during email implementation

- **Confidence:** HIGH — Common pattern in serverless applications

---

## Role-Based Permissions Pitfalls

### Pitfall 4: RLS Policies Not Updated for New Roles (CRITICAL)

- **What goes wrong:** You add roles (owner, admin, member) to `workspace_members.role` column, but forget to update RLS policies on other tables. The `contacts`, `tasks`, and `messages` tables don't check user role, so a "viewer" role can still edit data.

- **Warning signs:**
  - New role added but users can still do everything
  - RLS policies reference only `workspace_id`, not `role`
  - Test users with restricted role can access admin functions

- **Prevention:**
  - Audit ALL RLS policies when adding roles
  - Create helper function: `get_user_role(workspace_id)` for reuse
  - Test each role explicitly: "As viewer, can I edit contacts? Should fail."
  - RLS policies should check BOTH workspace membership AND role

- **Phase mapping:** Workspace Roles phase — central to implementation

- **Confidence:** HIGH — Documented in [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Pitfall 5: Role Data in Wrong JWT Claim

- **What goes wrong:** Storing role in `user_metadata` (editable by users) instead of `app_metadata` (server-only). Users can escalate their own privileges by editing their metadata.

- **Warning signs:**
  - Roles stored in `user_metadata`
  - No server-side role verification
  - Users can call Supabase auth.updateUser to change role

- **Prevention:**
  - Always use `app_metadata` for roles, never `user_metadata`
  - Or better: store roles in `workspace_members` table with RLS
  - Current implementation uses `workspace_members.role` — this is correct, maintain it

- **Phase mapping:** Workspace Roles phase — verify during implementation

- **Confidence:** HIGH — Explicitly warned in [Supabase RBAC docs](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)

### Pitfall 6: Global Roles Instead of Workspace-Scoped Roles

- **What goes wrong:** "Admin" becomes a global concept instead of workspace-scoped. A user who is admin of Workspace A shouldn't be admin of Workspace B.

- **Warning signs:**
  - Single `users.role` column instead of `workspace_members.role`
  - No workspace context in role checks
  - Admin of one workspace can see other workspaces

- **Prevention:**
  - Current schema is correct: roles in `workspace_members` (per-workspace)
  - Every role check must include workspace_id context
  - RLS policies must JOIN workspace_members, not check user table

- **Phase mapping:** Already correct in schema — verify during Roles phase

- **Confidence:** HIGH — [Oso RBAC best practices](https://www.osohq.com/learn/rbac-best-practices)

### Pitfall 7: Role Explosion

- **What goes wrong:** Start with owner/admin/member, then add viewer, read_only_admin, limited_member, billing_admin... Eventually 15+ roles that nobody understands.

- **Warning signs:**
  - Requests for "admin but can't delete" or "member but can view billing"
  - New role created for each exception
  - Documentation can't keep up with roles

- **Prevention:**
  - Start with 3 roles max: owner, admin, member
  - Use permissions matrix, not role proliferation
  - If need granular control, implement permission flags, not more roles
  - For v2.1: owner (full), admin (manage members), member (use features)

- **Phase mapping:** Workspace Roles phase — design decision upfront

- **Confidence:** MEDIUM — Common pattern from [enterprise SaaS guide](https://www.enterpriseready.io/features/role-based-access-control/)

### Pitfall 8: Forgetting Views Bypass RLS

- **What goes wrong:** Create a database view for reporting, view bypasses RLS, exposes data across tenants.

- **Warning signs:**
  - Views created without `security_invoker = true`
  - Reporting shows data from all workspaces
  - Views created with postgres superuser role

- **Prevention:**
  - All views must have `CREATE VIEW ... WITH (security_invoker = true)`
  - Test views with non-admin users
  - Prefer functions with `SECURITY INVOKER` over raw views

- **Phase mapping:** Any phase creating database views — applies throughout

- **Confidence:** HIGH — [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## Support Ticketing Pitfalls

### Pitfall 9: Building UI Before Defining Workflow

- **What goes wrong:** Build a ticket form and list, but no clear status workflow. Tickets get created but nobody knows what "In Progress" means or when to mark "Resolved."

- **Warning signs:**
  - Tickets sit in "Open" forever
  - No SLA or time expectations
  - Team argues about when to close tickets
  - Customers ask "what's happening with my ticket?"

- **Prevention:**
  - Define status workflow FIRST: Open -> Investigating -> Waiting on Customer -> Resolved -> Closed
  - Document what each status means and who transitions
  - Set SLA expectations (first response: 4 hours, resolution: 24-48 hours)
  - Current v2.1 scope mentions "Report -> Discuss -> Outcome -> Implementation" — formalize this

- **Phase mapping:** Support Page phase — workflow before UI

- **Confidence:** HIGH — [Ticket management best practices](https://devrev.ai/blog/ticket-management)

### Pitfall 10: No Ticket Visibility for Customers

- **What goes wrong:** Internal ticketing only — customers report issues but can't see status. They email again, create duplicate tickets, escalate unnecessarily.

- **Warning signs:**
  - Customers asking "did you get my message?"
  - Duplicate tickets for same issue
  - No ticket reference number given to customers

- **Prevention:**
  - Give customers ticket ID and status visibility
  - Send email/WhatsApp updates when status changes
  - Provide simple portal: "Your ticket #123 is being investigated"
  - Even a read-only status page reduces support load

- **Phase mapping:** Support Page phase — customer-facing component

- **Confidence:** MEDIUM — UX best practice

### Pitfall 11: Missing Handoff Information

- **What goes wrong:** Ticket assigned to developer, but missing context: What did customer try? What was the error? Developer has to ask, delays resolution.

- **Warning signs:**
  - First comment on every ticket is "can you provide more details?"
  - Same questions asked repeatedly during handoffs
  - Resolution time high despite simple issues

- **Prevention:**
  - Ticket form requires: description, steps to reproduce, expected vs actual
  - Capture system context automatically (workspace, user, browser)
  - Internal notes field for team context
  - Checklist before escalation: "Have we asked X, Y, Z?"

- **Phase mapping:** Support Page phase — form design

- **Confidence:** MEDIUM — [Support workflow guide](https://unito.io/blog/build-support-ticket-workflow/)

---

## Client Onboarding Pitfalls (Eagle Overseas)

### Pitfall 12: Generic Onboarding for First Enterprise Client (CRITICAL)

- **What goes wrong:** Eagle Overseas gets the same onboarding as a free trial user. They expect VIP treatment — dedicated support, custom setup, personal attention. Generic flow causes churn.

- **Warning signs:**
  - Client asks same questions that were answered in sales process
  - No dedicated contact point
  - Client feels like "just another user"
  - Missing customization they were promised

- **Prevention:**
  - High-touch onboarding: dedicated WhatsApp group, weekly check-ins
  - Transfer sales context to support (what did they buy, what do they expect?)
  - Create custom setup checklist for Eagle: WhatsApp number, Kia persona, team members
  - Proactive updates, don't wait for them to ask

- **Phase mapping:** All v2.1 phases — onboarding mindset throughout

- **Confidence:** HIGH — [SaaS onboarding guide](https://www.dock.us/library/customer-onboarding)

### Pitfall 13: Information Overload During Setup

- **What goes wrong:** Show Eagle every feature at once. They get overwhelmed, don't use core features, feel product is too complex.

- **Warning signs:**
  - Client hasn't logged in after first week
  - Using only 1-2 features despite paying for full suite
  - Questions about basic navigation
  - "How do I do X?" for prominent features

- **Prevention:**
  - Guided setup: complete step 1 before showing step 2
  - Focus on their primary use case first (WhatsApp CRM, not analytics)
  - First week goal: send first WhatsApp, add first lead
  - Hide advanced features until basics are mastered

- **Phase mapping:** All v2.1 phases — progressive disclosure in UI

- **Confidence:** MEDIUM — [Onboarding UX guide](https://cieden.com/saas-onboarding-best-practices-and-common-mistakes-ux-upgrade-article-digest)

### Pitfall 14: No Success Criteria Defined

- **What goes wrong:** Ship v2.1, give Eagle access, but never define what "success" looks like. Three months later, unclear if they're happy or about to churn.

- **Warning signs:**
  - No usage metrics tracked
  - No check-in calls scheduled
  - Don't know if they're using WhatsApp bot
  - Renewal conversation is a surprise

- **Prevention:**
  - Define success metrics: X leads managed, Y messages sent, Z response time
  - Schedule monthly review calls
  - Track: login frequency, features used, leads created
  - Ask explicitly: "Are you getting value? What's missing?"

- **Phase mapping:** Post-launch — implement tracking in Performance phase

- **Confidence:** HIGH — [Customer success guide](https://productled.com/blog/5-best-practices-for-better-saas-user-onboarding)

---

## Vercel-Specific Pitfalls

### Pitfall 15: Cold Start Latency on First Request

- **What goes wrong:** User logs in after 30 minutes of inactivity, sees 3-5 second delay. Feels broken. First impression ruined.

- **Warning signs:**
  - "Why is it so slow?" complaints
  - First request after inactivity times out
  - Dashboard shows cold start spikes in monitoring

- **Prevention:**
  - Enable Fluid Compute (if on Pro plan) — keeps one instance warm
  - Optimize bundle size — smaller = faster cold start
  - Move heavy dependencies to dynamic imports
  - Set appropriate region (closest to users — Singapore for Indonesia)

- **Phase mapping:** Performance Optimization phase

- **Confidence:** HIGH — [Vercel cold start guide](https://vercel.com/kb/guide/how-can-i-improve-serverless-function-lambda-cold-start-performance-on-vercel)

### Pitfall 16: Database Connection Exhaustion

- **What goes wrong:** Each serverless invocation creates new database connection. Under load, connections exhaust, queries fail.

- **Warning signs:**
  - "Too many connections" errors in logs
  - Intermittent 500 errors under load
  - Works fine locally, fails in production

- **Prevention:**
  - Supabase provides connection pooling (Supavisor) — ensure using pooled connection string
  - Use `?pgbouncer=true` in connection string for serverless
  - Current setup likely already correct, verify in Supabase settings

- **Phase mapping:** Performance Optimization phase — verify configuration

- **Confidence:** MEDIUM — Standard serverless pattern

### Pitfall 17: Function Timeout on Long Operations

- **What goes wrong:** CSV import with 1000 rows, PDF generation, or bulk email takes >10 seconds. Hobby plan has 10s limit, request fails mid-operation.

- **Warning signs:**
  - Large imports fail silently
  - "504 Gateway Timeout" errors
  - Operations work with small data, fail with large

- **Prevention:**
  - Check function timeout limits (10s Hobby, 60s Pro)
  - Break long operations into chunks
  - Use background jobs for heavy work (or upgrade to Pro)
  - For CSV import: process in batches of 100, show progress

- **Phase mapping:** Already implemented pagination — verify limits in email/export

- **Confidence:** HIGH — [Vercel timeout documentation](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)

### Pitfall 18: API Keys in Client Bundle

- **What goes wrong:** Environment variable with API key ends up in client-side JavaScript. Anyone can extract and abuse it.

- **Warning signs:**
  - Variable used in client component
  - Key visible in browser dev tools / Network tab
  - Unexpected API charges

- **Prevention:**
  - All sensitive keys (SMTP, Kapso, encryption) must be server-side only
  - Use `NEXT_PUBLIC_` prefix ONLY for truly public values
  - Audit: `grep -r "NEXT_PUBLIC_"` should not include sensitive keys
  - Current setup appears correct (SMTP, Kapso keys not prefixed)

- **Phase mapping:** Security review — ongoing vigilance

- **Confidence:** HIGH — Standard Next.js security

---

## Supabase Multi-Tenant Pitfalls

### Pitfall 19: RLS Policies Not Enforced on All Tables

- **What goes wrong:** New table added without RLS enabled. All data exposed to all users. 83% of Supabase security issues involve RLS misconfigurations.

- **Warning signs:**
  - New table created, data visible to wrong workspace
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` not run
  - No policies exist for table

- **Prevention:**
  - Checklist for every new table: (1) Enable RLS, (2) Create policies, (3) Test with different users
  - For v2.1 tickets table: must have workspace_id column and RLS policies
  - Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` to audit

- **Phase mapping:** Support Page phase — when creating tickets table

- **Confidence:** HIGH — [Supabase RLS guide](https://vibeappscanner.com/supabase-row-level-security)

### Pitfall 20: Service Role Key in Client Code

- **What goes wrong:** Using `supabase.auth.admin` or service role client in API routes that shouldn't bypass RLS. Data leaks across tenants.

- **Warning signs:**
  - Using `createClient(url, SERVICE_ROLE_KEY)` in regular API routes
  - RLS policies exist but data still leaks
  - Tests pass but security fails

- **Prevention:**
  - Service role only for admin operations (user creation, migrations)
  - Regular API routes use anon key + user session
  - Current invitation flow uses service role correctly for `auth.admin.createUser`
  - Never use service role for data queries

- **Phase mapping:** All phases — security principle

- **Confidence:** HIGH — [Supabase security best practices](https://www.leanware.co/insights/supabase-best-practices)

---

## Priority Matrix

| Pitfall | Severity | Likelihood | Priority | Phase |
|---------|----------|------------|----------|-------|
| 1. SMTP DNS Resolution | Critical | Certain | P0 | Email System |
| 4. RLS Not Updated for Roles | Critical | High | P0 | Workspace Roles |
| 12. Generic Enterprise Onboarding | High | Medium | P1 | All v2.1 |
| 19. RLS Not Enforced New Tables | High | Medium | P1 | Support Page |
| 9. Building UI Before Workflow | Medium | High | P1 | Support Page |
| 2. Email Deliverability Spam | Medium | Medium | P2 | Email System |
| 5. Role in Wrong JWT Claim | High | Low | P2 | Workspace Roles |
| 6. Global vs Scoped Roles | High | Low | P2 | Workspace Roles (verify) |
| 15. Cold Start Latency | Medium | High | P2 | Performance |
| 17. Function Timeout | Medium | Medium | P2 | Performance |
| 3. Missing Email Error Handling | Medium | Medium | P2 | Email System |
| 14. No Success Criteria | Medium | High | P2 | Post-launch |
| 8. Views Bypass RLS | High | Low | P3 | If views added |
| 7. Role Explosion | Medium | Low | P3 | Workspace Roles |
| 10. No Ticket Visibility | Low | Medium | P3 | Support Page |
| 11. Missing Handoff Info | Low | Medium | P3 | Support Page |
| 13. Information Overload | Medium | Medium | P3 | UI Design |
| 16. DB Connection Exhaustion | Medium | Low | P3 | Performance |
| 18. API Keys in Client | Critical | Low | P3 | Security (verify) |
| 20. Service Role Key Misuse | Critical | Low | P3 | Security (verify) |

---

## Phase-Specific Checklist

### Before Email System Phase
- [ ] Decide: Resend vs SendGrid vs Mailgun (recommendation: Resend for Vercel integration)
- [ ] Domain DNS: Add SPF, DKIM, DMARC records for my21staff.com
- [ ] Remove nodemailer + smtp.hostinger.com approach
- [ ] Plan email templates: invitation, password reset, ticket updates

### Before Workspace Roles Phase
- [ ] Define roles: owner, admin, member (max 3)
- [ ] Document permissions matrix: who can do what
- [ ] Audit all RLS policies: list every table, check workspace_id + role
- [ ] Create `get_user_role(workspace_id)` helper function

### Before Support Page Phase
- [ ] Define ticket workflow: status names, transitions, owners
- [ ] Design ticket form: required fields, auto-captured context
- [ ] Create `tickets` table with RLS enabled from start
- [ ] Plan customer-facing visibility: ticket ID, status updates

### Before Eagle Onboarding
- [ ] Transfer sales context to support team
- [ ] Create Eagle-specific checklist: WhatsApp setup, team invites, Kia persona
- [ ] Schedule weekly check-in calls for first month
- [ ] Define success metrics: leads managed, messages sent, login frequency

---

## Sources

### Email Delivery
- [Vercel: Sending emails from serverless functions](https://vercel.com/kb/guide/serverless-functions-and-smtp)
- [Vercel SMTP Discussion](https://github.com/vercel/vercel/discussions/4857)
- [Resend Vercel Integration](https://resend.com/docs/knowledge-base/vercel)
- [Email Deliverability Best Practices - Mailgun](https://www.mailgun.com/blog/deliverability/avoid-emails-going-to-spam/)
- [Google Email Deliverability 2025](https://securityboulevard.com/2025/11/google-email-deliverability-how-to-avoid-spam-folders/)

### Role-Based Permissions
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RBAC Guide](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [Oso RBAC Best Practices](https://www.osohq.com/learn/rbac-best-practices)
- [Enterprise Ready RBAC Guide](https://www.enterpriseready.io/features/role-based-access-control/)
- [PropelAuth RBAC for B2B SaaS](https://www.propelauth.com/post/guide-to-rbac-for-b2b-saas)

### Support Ticketing
- [Ticket Management Best Practices 2025 - DevRev](https://devrev.ai/blog/ticket-management)
- [SaaS Ticketing Systems - Intercom](https://www.intercom.com/learning-center/saas-ticketing-system)
- [Support Ticket Workflow - Unito](https://unito.io/blog/build-support-ticket-workflow/)
- [Ticketing System Mistakes - HappyFox](https://blog.happyfox.com/ticketing-system-mistakes/)

### Client Onboarding
- [SaaS Onboarding Best Practices - ProductLed](https://productled.com/blog/5-best-practices-for-better-saas-user-onboarding)
- [Customer Onboarding Guide - Dock](https://www.dock.us/library/customer-onboarding)
- [Onboarding UX Mistakes - Cieden](https://cieden.com/saas-onboarding-best-practices-and-common-mistakes-ux-upgrade-article-digest)

### Vercel & Serverless
- [Vercel Cold Start Performance](https://vercel.com/kb/guide/how-can-i-improve-serverless-function-lambda-cold-start-performance-on-vercel)
- [Vercel Function Timeouts](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [Vercel Fluid Compute](https://vercel.com/blog/scale-to-one-how-fluid-solves-cold-starts)

### Supabase Multi-Tenancy
- [Supabase RLS Complete Guide 2025](https://vibeappscanner.com/supabase-row-level-security)
- [Supabase Best Practices - Leanware](https://www.leanware.co/insights/supabase-best-practices)
- [Multi-tenant RBAC Discussion](https://github.com/orgs/supabase/discussions/30434)

---

*Last updated: 2026-01-18*
