# Phase 19 Research: Performance & Security

**Researched:** 2026-01-17
**Domain:** Application Security & Performance Optimization
**Confidence:** HIGH

## Summary

This security audit evaluated my21staff against the 13-rule webapp security protocol. The codebase demonstrates **good security fundamentals** with proper authentication patterns, but has several areas requiring attention:

1. **Database Access Pattern (Rule 1):** Partially compliant - Some client components directly query Supabase for real-time features
2. **Authorization (Rule 2):** Generally good - Most API routes check auth AND workspace membership
3. **Input Validation (Rule 7):** Missing formal schema validation - No Zod or similar library in use
4. **Rate Limiting (Rule 8):** Not implemented on any endpoints
5. **Logging (Rule 9):** Some sensitive logging in production code

**Primary recommendation:** Implement rate limiting on auth/messaging endpoints, add Zod validation, and refactor client-side database queries to use API routes.

---

## Security Audit Findings

### Rule 1: Database Access Pattern

**Finding: PARTIAL COMPLIANCE**
**Confidence: HIGH**

The application uses a hybrid approach:
- **Server Components & API Routes:** Properly use server-side Supabase client via `createClient()` from `/lib/supabase/server.ts`
- **Client Components:** Several components directly query Supabase from the browser:
  - `inbox-client.tsx` (lines 139, 161, 208) - Queries messages and subscribes to real-time updates
  - `contact-detail-sheet.tsx` (lines 369, 476) - Loads messages and conversations
  - `message-thread.tsx` (line 324) - Searches contacts

**Risk:** Direct client-side database access bypasses server-side security checks. While Supabase RLS provides protection, it's a defense-in-depth violation.

**Recommendation:**
1. Keep real-time subscriptions (these are acceptable with RLS)
2. Move data fetching queries to API routes
3. Use API routes for all mutations (this is already done correctly)

---

### Rule 2: Authorization (Gatekeeping)

**Finding: MOSTLY COMPLIANT**
**Confidence: HIGH**

Most API routes properly implement the three checks:
1. Authentication (user is logged in)
2. Authorization (role-based check)
3. Ownership (user has access to the resource)

**Good Examples:**
- `/api/messages/send/route.ts` - Checks auth (line 36-42), workspace membership (line 61-72)
- `/api/contacts/[id]/route.ts` - Checks auth, fetches contact, verifies workspace access

**Issues Found:**

1. **`/api/conversations/[id]/assign/route.ts` - MISSING AUTHORIZATION CHECK**
   ```typescript
   // Only checks auth, doesn't verify workspace access
   if (!user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   // Directly updates conversation without checking user can access it
   await supabase.from('conversations').update({ assigned_to })
   ```

2. **`/api/workspaces/[id]/settings/route.ts` - MISSING AUTHORIZATION CHECK**
   - Checks auth but doesn't verify user is a workspace member before updating

3. **Dev Mode Bypass in Middleware:**
   ```typescript
   if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
     return NextResponse.next({ request })
   }
   ```
   This skips ALL auth checks when dev mode is enabled. Ensure this is never true in production.

**Recommendation:**
- Add workspace membership verification to all API routes
- Create a reusable middleware/helper for workspace authorization
- Add safeguards to prevent `NEXT_PUBLIC_DEV_MODE=true` in production

---

### Rule 3: Premium Feature Verification

**Finding: NOT APPLICABLE**
**Confidence: HIGH**

The application does not currently have premium/paid features that need server-side verification.

---

### Rule 4: Secrets in Client Code

**Finding: COMPLIANT**
**Confidence: HIGH**

Environment variable usage is correct:
- `NEXT_PUBLIC_SUPABASE_URL` - Publicly accessible, OK
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Publicly accessible, OK (designed to be public)
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only, correct (no NEXT_PUBLIC_ prefix)

**Verified locations:**
- `.env.local` - Contains service role key without NEXT_PUBLIC_ prefix
- `/lib/supabase/config.ts` - Correctly differentiates public vs server-only keys

---

### Rule 5: NEXT_PUBLIC_ Usage

**Finding: MOSTLY COMPLIANT**
**Confidence: HIGH**

NEXT_PUBLIC_ variables in use:
| Variable | Purpose | Risk |
|----------|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database URL | Low - designed to be public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous key | Low - designed to be public |
| `NEXT_PUBLIC_DEV_MODE` | Dev mode flag | **MEDIUM - bypasses auth** |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | n8n webhook | Low - public webhook |

**Issue:** `NEXT_PUBLIC_DEV_MODE` is problematic because it bypasses authentication in middleware. This must never be `true` in production.

**Recommendation:**
- Add production environment check: `if (process.env.NODE_ENV === 'production') { DEV_MODE = false }`
- Consider using a different pattern for local development that doesn't expose to client

---

### Rule 6: Server-Side Calculations

**Finding: COMPLIANT**
**Confidence: HIGH**

No pricing, scoring, or sensitive calculations are performed client-side:
- Lead scores are updated via API routes
- All data mutations go through server endpoints

---

### Rule 7: Input Sanitization

**Finding: PARTIAL COMPLIANCE**
**Confidence: HIGH**

**Current State:**
- **No Zod or formal validation schema** - The package.json does not include Zod or similar
- Manual validation with basic checks (`if (!title?.trim())`)
- SQL injection: Protected via Supabase's parameterized queries
- XSS in markdown: **Properly sanitized** in `/app/articles/[workspace]/[slug]/page.tsx`:
  ```typescript
  function renderMarkdown(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // ... markdown processing
  }
  ```

**Missing:**
- Phone number format validation
- Email format validation
- Length limits on text inputs
- Type coercion protection

**Recommendation:**
- Install Zod: `npm install zod`
- Create validation schemas for all API endpoints
- Add client-side validation for better UX

---

### Rule 8: Rate Limiting

**Finding: NOT IMPLEMENTED**
**Confidence: HIGH**

**No rate limiting exists on any endpoint.**

**High-risk endpoints without protection:**
- `/api/auth/*` - Login/signup endpoints (brute force risk)
- `/api/messages/send` - Message sending (spam/cost risk)
- `/api/messages/send-media` - Media uploads (storage cost risk)
- `/api/webinars/register` - Public registration (abuse risk)
- `/api/webhook/kapso` - Webhook endpoint (replay attack risk)

**Recommendation:**
Implement rate limiting using one of:
1. **Vercel Edge Config** (if deploying to Vercel)
2. **Upstash Redis** rate limiter
3. **next-rate-limit** package

Priority endpoints:
1. Auth endpoints: 5 requests/minute per IP
2. Message endpoints: 30 requests/minute per user
3. Public forms: 10 requests/minute per IP

---

### Rule 9: Sensitive Logging

**Finding: PARTIAL COMPLIANCE**
**Confidence: HIGH**

**Issues found:**

1. **Webhook payloads logged with potential PII:**
   ```typescript
   // /api/webhook/kapso/route.ts line 64
   console.log('[Webhook] Received payload:', JSON.stringify(rawPayload).substring(0, 1000))
   ```
   This may log phone numbers and message content.

2. **All workspaces exposed in debug:**
   ```typescript
   // /api/webhook/kapso/route.ts line 122
   console.log('[Webhook] All workspaces:', JSON.stringify(allWorkspaces))
   ```

3. **Contact phone numbers in merge logs:**
   ```typescript
   // /api/contacts/merge/route.ts line 222
   console.log(`[Merge] Successfully merged contact ${mergeContactId} into ${keepContactId}. Phone: ${updatedKeepContact.phone}`)
   ```

**No passwords or tokens are logged** - This is good.

**Recommendation:**
- Remove or mask PII from production logs
- Use structured logging (e.g., Pino) with log levels
- Mask phone numbers in logs: `+62***567890`

---

### Rule 10: Cross-AI Audit

**Finding: PENDING**
**Confidence: N/A**

This audit itself serves as the cross-AI review. Recommend:
- Run Gemini or GPT audit on critical files before launch
- Use automated SAST tools (Snyk, SonarQube)

---

### Rule 11: Dependencies

**Finding: MOSTLY COMPLIANT**
**Confidence: HIGH**

```bash
$ npm audit
found 0 vulnerabilities
```

**Outdated packages:**
| Package | Current | Latest | Impact |
|---------|---------|--------|--------|
| @types/node | 20.19.29 | 25.0.9 | Dev only |
| next | 16.1.1 | 16.1.3 | Minor update |
| eslint-config-next | 16.1.1 | 16.1.3 | Minor update |

**Recommendation:**
- Run `npm update` to get patch updates
- Enable Dependabot on GitHub repository

---

### Rule 12: Error Handling

**Finding: MOSTLY COMPLIANT**
**Confidence: HIGH**

Error messages are appropriately vague for users:
```typescript
return NextResponse.json(
  { error: 'Internal server error' },
  { status: 500 }
)
```

**Good:** No database details or stack traces exposed to users.

**Issue:** Some error messages include database error objects:
```typescript
// Should not include full error object
console.error('Create workspace error:', workspaceError)
```

---

### Rule 13: Database Functions

**Finding: NEEDS VERIFICATION**
**Confidence: LOW**

Unable to audit Supabase database functions directly. This requires:
1. Access to Supabase dashboard
2. Running: `SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;`
3. Checking each function for PUBLIC execute permissions

**Recommendation:**
- Audit all database functions
- Revoke PUBLIC execute on any sensitive functions
- Document which functions need which permissions

---

## Performance Findings

### Bundle Size

**Finding:** Cannot analyze production bundle due to TypeScript build error
**Recommendation:** Fix type error in `mock-data.ts` (missing `is_admin` property)

**Package Analysis:**
- Total node_modules: 691 MB
- Includes Framer Motion (large animation library) but CLAUDE.md says to use Shadcn animations instead

**Recommendation:**
- Consider removing `framer-motion` if not actively used
- Use dynamic imports for heavy components

### Database Queries

**Finding: NEEDS OPTIMIZATION**
**Confidence: MEDIUM**

Potential N+1 query patterns in:
- Conversations list fetching contact data separately
- Messages loading without pagination limits (currently hard-coded to 100)

**Recommendation:**
- Use Supabase joins (`select('*, contact:contacts(*)')`)
- Implement cursor-based pagination for large message threads
- Add database indexes on frequently queried columns

### Caching

**Finding: NOT IMPLEMENTED**
**Confidence: HIGH**

No caching strategy in place:
- No React Query or SWR for client-side caching
- No HTTP cache headers on API routes
- No CDN caching for static assets

**Recommendation:**
- Add `Cache-Control` headers for public content (articles, webinars)
- Consider SWR for frequently accessed data
- Use Supabase's built-in caching where appropriate

---

## Summary

### Critical Issues (Must Fix)

1. **Missing authorization on `/api/conversations/[id]/assign`** - Any authenticated user can reassign any conversation
2. **Missing authorization on `/api/workspaces/[id]/settings`** - Any authenticated user can modify workspace settings
3. **No rate limiting on auth and messaging endpoints** - Open to brute force and spam attacks

### High Priority

4. **Add Zod validation** for all API inputs
5. **Audit Supabase database functions** for PUBLIC execute permissions
6. **Ensure `NEXT_PUBLIC_DEV_MODE` cannot be true in production**

### Medium Priority

7. **Remove/mask PII from logs** (phone numbers in webhook logs)
8. **Refactor client-side DB queries** to use API routes
9. **Add caching strategy** for static content
10. **Update outdated dependencies**

### Low Priority

11. Consider removing unused `framer-motion` dependency
12. Add structured logging (Pino)
13. Implement cursor-based pagination

---

## Recommended Plan Structure

Given the findings, the implementation phase should be structured as:

**Plan 1: Authorization Fixes (Critical)**
- Fix `/api/conversations/[id]/assign` authorization
- Fix `/api/workspaces/[id]/settings` authorization
- Create reusable workspace authorization helper
- Add production safeguards for DEV_MODE

**Plan 2: Rate Limiting Implementation (Critical)**
- Install rate limiting solution (Upstash or similar)
- Add rate limits to auth endpoints
- Add rate limits to messaging endpoints
- Add rate limits to public registration forms

**Plan 3: Input Validation (High)**
- Install Zod
- Create validation schemas for all API endpoints
- Add error handling for validation failures

**Plan 4: Logging & Monitoring (Medium)**
- Remove/mask PII from logs
- Add structured logging
- Configure log levels for production vs development

**Plan 5: Performance Optimizations (Medium)**
- Add caching headers
- Optimize database queries
- Fix TypeScript build error
- Review and potentially remove unused dependencies

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all API routes and client components
- Package.json and .env.local examination
- npm audit results

### Secondary (MEDIUM confidence)
- `/home/jfransisco/AI/docs/webapp-security-protocol.md` - Security protocol reference

### Verification Required
- Supabase database function audit (requires dashboard access)
- Production build analysis (blocked by TypeScript error)

---

## Metadata

**Confidence breakdown:**
- Authorization audit: HIGH - Direct code analysis
- Environment variables: HIGH - File inspection
- Input validation: HIGH - grep for Zod, direct code analysis
- Rate limiting: HIGH - No implementation found
- Database functions: LOW - Cannot access Supabase dashboard
- Performance: MEDIUM - Build error prevents full analysis

**Research date:** 2026-01-17
**Valid until:** 30 days (stable security patterns)
