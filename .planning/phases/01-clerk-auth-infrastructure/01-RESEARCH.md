# Phase 1: Clerk Auth Infrastructure - Research

**Researched:** 2026-01-23
**Domain:** Authentication infrastructure (Clerk + Convex JWT integration)
**Confidence:** HIGH

## Summary

Phase 1 establishes Clerk as the authentication provider for the my21staff application, replacing the current Supabase auth. This is infrastructure-only: no UI changes, no user migration, just the foundation that enables later phases.

The core task is configuring Clerk's JWT template system to issue tokens that Convex can validate. Clerk provides a pre-built "Convex" template that auto-configures the required claims (`aud`, `iss`, `sub`). The integration is well-documented, officially supported by both platforms, and follows a simple three-step pattern: create Clerk app → configure JWT template → update Convex auth.config.ts.

**Key insight:** The JWT template MUST be named "convex" (not "Convex" or anything else) because `ConvexProviderWithClerk` hardcodes this name when fetching tokens. This is the #1 mistake developers make.

**Primary recommendation:** Use Clerk's pre-built Convex template in the JWT Templates dashboard, copy the issuer URL exactly, and verify the integration by testing `ctx.auth.getUserIdentity()` returns non-null in a simple mutation before proceeding to Phase 2.

## Standard Stack

The established libraries/tools for Clerk + Convex + Next.js authentication:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@clerk/nextjs` | 6.36.8+ | Clerk integration for Next.js 15 | Official Clerk SDK for Next.js, v6 supports both client/server components |
| `convex` | 1.31.5+ | Convex backend SDK | Already installed, current stable version |
| `@clerk/clerk-react` | Latest | React hooks for auth state | Peer dependency of `@clerk/nextjs` |

**Note:** The project currently has `convex@1.31.5` installed but no Clerk packages yet.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@clerk/localizations` | Latest | Indonesian locale for UI components | Phase 2+ when adding UI components |
| `@clerk/types` | Latest | TypeScript types | Optional, improves DX |

### Environment Variables Required
| Variable | Where to Get It | Used By | Required When |
|----------|----------------|---------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys | Client-side (Next.js) | Always |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys | Server-side (Next.js API routes) | Phase 2+ when using Clerk API |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk Dashboard → JWT Templates (after creating template) | Convex (via dashboard) | Phase 1 (this phase) |

**Key formats:**
- Publishable Key: `pk_test_*` (dev) or `pk_live_*` (prod)
- Secret Key: `sk_test_*` (dev) or `sk_live_*` (prod)
- Issuer Domain: `https://verb-noun-00.clerk.accounts.dev` (dev) or `https://clerk.<your-domain>.com` (prod)

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Clerk | Supabase Auth (current) | Clerk has better org management, working emails, pre-built components |
| Clerk | Auth0 | Clerk cheaper for B2B, better DX for React/Next.js |
| Clerk | NextAuth | Clerk managed service, no self-hosting burden |

**Installation:**
```bash
npm install @clerk/nextjs @clerk/clerk-react
```

## Architecture Patterns

### Recommended Auth Flow (Phase 1 Only)
```
┌─────────────┐
│ Clerk App   │ (Created in Clerk Dashboard)
│ Settings    │ - Email/password enabled
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ JWT Template    │ (Named "convex", not "Convex")
│ "convex"        │ - Pre-configured by Clerk Convex template
└──────┬──────────┘ - Claims: aud="convex", iss=<issuer_url>, sub=<user_id>
       │
       │ Issuer URL copied to...
       ▼
┌─────────────────┐
│ Convex          │ (Environment variable in Convex Dashboard)
│ auth.config.ts  │ - domain: process.env.CLERK_JWT_ISSUER_DOMAIN
└─────────────────┘ - applicationID: "convex"
       │
       │ Validates JWTs from Clerk
       ▼
┌─────────────────┐
│ Test Mutation   │ (Simple query/mutation to verify)
│ Returns user ID │ - ctx.auth.getUserIdentity() returns non-null
└─────────────────┘
```

### Pattern 1: Convex auth.config.ts Format
**What:** Configuration file that tells Convex how to validate Clerk JWTs
**When to use:** Phase 1 (required for any Clerk + Convex integration)

**Example:**
```typescript
// convex/auth.config.ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

**Source:** [Convex & Clerk | Convex Developer Hub](https://docs.convex.dev/auth/clerk)

**Critical details:**
- `domain` MUST exactly match the `iss` claim in Clerk JWT
- `applicationID` MUST exactly match the `aud` claim in Clerk JWT (which is "convex")
- `CLERK_JWT_ISSUER_DOMAIN` is set in Convex Dashboard → Settings → Environment Variables, NOT in `.env.local`

### Pattern 2: Testing Auth Integration
**What:** Verify Clerk → Convex JWT validation works end-to-end
**When to use:** After configuring JWT template and auth.config.ts, before Phase 2

**Example:**
```typescript
// convex/testAuth.ts
import { query } from "./_generated/server";

export const testAuthentication = query({
  handler: async (ctx) => {
    // Log identity to Convex dashboard logs
    console.log("server identity", await ctx.auth.getUserIdentity());

    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    return {
      userId: identity.subject,
      issuer: identity.issuer,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});
```

**How to test:**
1. Deploy this mutation to Convex
2. Create a test user in Clerk Dashboard
3. Use Clerk's test mode or Dashboard to generate a JWT
4. Call the mutation (will fail with "Unauthenticated" if not configured correctly)
5. Check Convex Dashboard → Logs for console output
6. If successful, returns user identity data

**Source:** [Debugging Authentication | Convex Developer Hub](https://docs.convex.dev/auth/debug)

### Pattern 3: JWT Validation Flow
**What:** How Convex verifies Clerk JWTs are legitimate
**When to use:** Understanding/debugging (automatic once configured)

```
Client sends JWT → Convex receives JWT → Convex checks:
1. Signature valid? (Uses Clerk's public key from JWKS endpoint)
2. iss matches domain? (From auth.config.ts)
3. aud matches applicationID? (From auth.config.ts)
4. exp not expired? (Token lifetime, default 60s)
5. iat present? (For token refresh)

✓ All checks pass → ctx.auth.getUserIdentity() returns user data
✗ Any check fails → ctx.auth.getUserIdentity() returns null
```

**Source:** [Custom JWT Provider | Convex Developer Hub](https://docs.convex.dev/auth/advanced/custom-jwt)

### Anti-Patterns to Avoid

- **Don't rename the JWT template:** Must be exactly "convex" (lowercase). `ConvexProviderWithClerk` hardcodes this name.
- **Don't put issuer URL in .env.local:** It goes in Convex Dashboard environment variables, not your Next.js `.env.local`
- **Don't skip the audience check:** Always set `applicationID: "convex"` to prevent JWT reuse attacks
- **Don't test with old tokens:** JWT tokens expire in 60 seconds by default. Always use fresh tokens.
- **Don't assume auth works without logging:** Always add `console.log(await ctx.auth.getUserIdentity())` to verify

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing/validation | Custom crypto code | Clerk JWT template + Convex validation | Timing attacks, key rotation, JWKS complexity |
| User session management | Custom cookies/tokens | Clerk session management | Cross-device sync, token refresh, secure defaults |
| Email verification | Custom SMTP + token generation | Clerk (built-in for email/password) | Deliverability, template management, rate limiting |
| Password hashing | bcrypt/scrypt implementation | Clerk (handles hashing) | NIST compliance, breach detection, salting |

**Key insight:** Clerk + Convex integration is designed to be zero custom auth code. If you're writing crypto primitives or session logic, you're doing it wrong.

## Common Pitfalls

### Pitfall 1: JWT Template Named Incorrectly
**What goes wrong:** Developer names JWT template "Convex" or "my-app-convex" instead of exactly "convex"
**Why it happens:** Clerk allows custom naming, but `ConvexProviderWithClerk` hardcodes `getToken({ template: "convex" })`
**How to avoid:** In Clerk Dashboard → JWT Templates, verify template name is exactly "convex" (lowercase)
**Warning signs:**
- `ctx.auth.getUserIdentity()` returns `null` in Convex logs
- Browser console shows `useConvexAuth()` hook returns `isAuthenticated: false`
- No error messages (silently fails)

**Source:** [Integrate Convex with Clerk](https://clerk.com/docs/guides/development/integrations/databases/convex)

### Pitfall 2: Issuer URL Mismatch
**What goes wrong:** `CLERK_JWT_ISSUER_DOMAIN` doesn't match the `iss` claim in JWT
**Why it happens:**
- Copied wrong URL (e.g., Dashboard URL instead of issuer URL)
- Using production URL in dev environment or vice versa
- Typo when pasting into Convex Dashboard
**How to avoid:**
1. Copy issuer URL from Clerk Dashboard → JWT Templates → [your template] → "Issuer"
2. Paste into Convex Dashboard → Settings → Environment Variables (NOT .env.local)
3. Verify format: `https://verb-noun-00.clerk.accounts.dev` (dev) or `https://clerk.<domain>.com` (prod)
**Warning signs:**
- Convex logs show "No configured authentication providers" or "Invalid issuer"
- `ctx.auth.getUserIdentity()` returns `null`
**Debug step:** Decode JWT at https://jwt.io/, check `iss` claim matches environment variable exactly

**Source:** [Debugging Authentication | Convex Developer Hub](https://docs.convex.dev/auth/debug)

### Pitfall 3: Environment Variable Not Set in Convex
**What goes wrong:** `CLERK_JWT_ISSUER_DOMAIN` set in `.env.local` but not in Convex Dashboard
**Why it happens:** Convex runs on separate infrastructure, doesn't read Next.js `.env.local` files
**How to avoid:**
1. Add `CLERK_JWT_ISSUER_DOMAIN` in Convex Dashboard → Settings → Environment Variables
2. Value should be the issuer URL from Clerk (e.g., `https://verb-noun-00.clerk.accounts.dev`)
3. Deploy Convex functions AFTER setting environment variable
**Warning signs:**
- `auth.config.ts` references undefined environment variable
- Convex logs show "undefined" for domain
**Verification:** In Convex Dashboard → Logs, deploy a function that logs `process.env.CLERK_JWT_ISSUER_DOMAIN`

**Source:** [Convex & Clerk | Convex Developer Hub](https://docs.convex.dev/auth/clerk)

### Pitfall 4: Email/Password Not Enabled in Clerk
**What goes wrong:** JWT template configured correctly, but users can't sign in
**Why it happens:** Clerk applications start with no authentication methods enabled
**How to avoid:**
1. In Clerk Dashboard → User & Authentication → Email, Phone, Username
2. Enable "Email address"
3. Enable "Password"
4. Verify "Require a password at sign-up" is checked
5. Verify "Email verification code" is enabled (default)
**Warning signs:**
- Clerk sign-in UI shows no authentication options
- API calls to Clerk return "Strategy not enabled"

**Source:** [Sign-up and sign-in options](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options)

### Pitfall 5: Testing with Expired Tokens
**What goes wrong:** JWT works initially, then fails 60 seconds later
**Why it happens:** Default token lifetime is 60 seconds. Developers copy token for testing, then reuse it minutes later.
**How to avoid:**
- Always generate fresh tokens for testing
- Use `useAuth().getToken({ template: "convex" })` to get current token, don't hardcode
- If testing manually, regenerate token if more than 30 seconds old
**Warning signs:**
- Authentication works, then suddenly stops working
- Decoding JWT at jwt.io shows `exp` timestamp in the past
- Convex logs show no error (expired tokens are silently rejected)

**Source:** [Session management: JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates)

### Pitfall 6: Multi-Layer Auth Confusion (Phase 1 Doesn't Apply, But Document for Later)
**What goes wrong:** Developer assumes securing Next.js middleware secures Convex functions
**Why it happens:** Convex is a separate backend (public API), not behind Next.js server
**How to avoid:**
- Phase 1: Only testing `ctx.auth.getUserIdentity()` - no middleware yet
- Phase 2+: Always check auth in BOTH Next.js middleware AND Convex functions independently
**Warning signs:** (Phase 2+)
- Middleware blocks unauthenticated users, but Convex queries still return data
- Direct API calls to Convex bypass Next.js protections

**Source:** [Authentication Best Practices: Convex, Clerk and Next.js](https://stack.convex.dev/authentication-best-practices-convex-clerk-and-nextjs)

## Code Examples

Verified patterns from official sources:

### Creating Clerk Application (Dashboard Steps)
```
Step-by-step process (no code):

1. Go to https://dashboard.clerk.com/
2. Click "Add application"
3. Application name: "my21staff" (or your preference)
4. Select authentication methods:
   ☑ Email address
   ☑ Password
   ☐ Social logins (NOT needed for Phase 1, Phase 2+ can add)
5. Click "Create application"
6. Copy NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (save for Phase 2)
7. Copy CLERK_SECRET_KEY (save for Phase 2)
```

**Source:** [Sign-up and sign-in options](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options)

### Creating JWT Template in Clerk Dashboard
```
Step-by-step process (no code):

1. In Clerk Dashboard → JWT Templates (left sidebar)
2. Click "New template"
3. Select "Convex" from template list (pre-configures claims)
4. Template name: MUST be "convex" (lowercase, no spaces)
   - This is auto-filled by the Convex template, don't change it!
5. Token lifetime: 60 seconds (default, can increase for production)
6. Allowed clock skew: 5 seconds (default)
7. Claims (auto-configured by Convex template):
   - aud: "convex" (CRITICAL - must match)
   - iss: <auto-generated from your Clerk instance>
   - sub: {{user.id}} (Clerk user ID)
8. Click "Apply changes"
9. COPY THE ISSUER URL (shown at top of page)
   - Format: https://verb-noun-00.clerk.accounts.dev (dev)
   - You'll paste this into Convex environment variables
```

**Source:** [Session management: JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates)

### Configuring Convex Environment Variable
```
Step-by-step process (no code):

1. Go to https://dashboard.convex.dev/
2. Select your deployment (e.g., "my21staff-dev")
3. Click "Settings" (left sidebar)
4. Click "Environment Variables" tab
5. Click "Add Environment Variable"
6. Name: CLERK_JWT_ISSUER_DOMAIN
7. Value: <paste issuer URL from Clerk JWT template>
   - Example: https://verb-noun-00.clerk.accounts.dev
8. Click "Save"
9. Re-deploy functions (environment variables apply on next deploy)
```

**Source:** [Convex & Clerk | Convex Developer Hub](https://docs.convex.dev/auth/clerk)

### Updating auth.config.ts for Clerk
```typescript
// convex/auth.config.ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

**Replace existing Supabase configuration:**
```typescript
// OLD (Supabase) - DELETE THIS
export default {
  providers: [
    {
      type: "customJwt",
      applicationID:
        process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] ||
        "",
      issuer: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      jwks: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/.well-known/jwks.json`,
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;
```

**Key differences:**
- Clerk uses simpler format (no `jwks`, `algorithm` - auto-detected)
- `domain` instead of `issuer` (same thing, cleaner API)
- `applicationID` must be "convex" (matches JWT `aud` claim)

**Source:** [Convex & Clerk | Convex Developer Hub](https://docs.convex.dev/auth/clerk)

### Testing JWT Validation (Simple Mutation)
```typescript
// convex/testAuth.ts
import { mutation } from "./_generated/server";

export const testClerkAuth = mutation({
  handler: async (ctx) => {
    // This logs to Convex Dashboard → Logs
    console.log("Testing Clerk authentication...");
    console.log("Identity:", await ctx.auth.getUserIdentity());

    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated - JWT validation failed");
    }

    return {
      success: true,
      message: "Clerk → Convex authentication working!",
      userId: identity.subject,
      issuer: identity.issuer,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});
```

**How to test (Phase 1 - manual testing via Clerk Dashboard):**
```
1. Create test user in Clerk Dashboard → Users → "Add user"
   - Email: test@my21staff.com
   - Password: (set a test password)

2. Get JWT token manually:
   - In Clerk Dashboard → Sessions (find your test user's session)
   - Copy JWT token

3. Test via curl (from terminal):
   curl -X POST https://<your-deployment>.convex.site/api/testClerkAuth \
     -H "Authorization: Bearer <paste-jwt-token>"

4. Check Convex Dashboard → Logs for console output
   - Should see "Identity: { subject: '...', issuer: '...', ... }"
   - If null, check pitfalls above

Alternative: Phase 2 will add proper UI testing with ConvexProviderWithClerk
```

**Source:** [Debugging Authentication | Convex Developer Hub](https://docs.convex.dev/auth/debug)

### Verifying JWT Structure (Debugging)
```typescript
// Use this in browser console or Node.js script to decode JWT
// DO NOT commit this code to repo (for debugging only)

const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."; // Your JWT
const payload = JSON.parse(atob(token.split('.')[1]));

console.log("JWT Payload:", payload);
// Should contain:
// {
//   "aud": "convex",  // MUST match applicationID in auth.config.ts
//   "iss": "https://verb-noun-00.clerk.accounts.dev",  // MUST match domain
//   "sub": "user_2...",  // Clerk user ID
//   "exp": 1706012345,  // Expiration timestamp
//   "iat": 1706012285,  // Issued at timestamp
// }

// Verify expiration
const now = Math.floor(Date.now() / 1000);
const expired = payload.exp < now;
console.log("Token expired?", expired);
```

**Or use jwt.io:**
1. Go to https://jwt.io/
2. Paste JWT token
3. Check "aud" = "convex"
4. Check "iss" matches your Clerk issuer URL
5. Check "exp" is in the future

**Source:** [Debugging Authentication | Convex Developer Hub](https://docs.convex.dev/auth/debug)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom JWT validation | Clerk JWT templates | Clerk launch (2021) | Pre-built templates eliminate 100+ lines of crypto code |
| Manual JWKS endpoint | Auto-discovered JWKS | Convex v1.0 (2023) | No need to specify JWKS URL, Convex fetches automatically |
| `@clerk/nextjs` v4 (Pages Router) | `@clerk/nextjs` v6 (App Router) | Oct 2024 | Single provider works for both client/server components |
| Supabase Auth + RLS | Clerk + Convex functions | Current migration | Explicit auth checks replace implicit RLS (more debuggable) |

**Deprecated/outdated:**
- **`@clerk/nextjs` v4:** Only supports Pages Router. v6 required for Next.js 15 App Router.
- **Manual JWKS configuration:** Convex now auto-discovers JWKS endpoints from issuer domain.
- **Separate `<ClerkProvider>` + `<ConvexProvider>`:** Use `<ConvexProviderWithClerk>` instead (Phase 2).

**What's current (January 2026):**
- Clerk JWT templates with pre-built integration templates (Convex, Supabase, Hasura, etc.)
- Convex simplified auth.config.ts format (just `domain` and `applicationID`)
- `@clerk/nextjs` v6 with unified client/server context

## Open Questions

Things that couldn't be fully resolved:

1. **Indonesian Email Localization**
   - What we know: Clerk supports Indonesian locale (`idID`) for UI components via `@clerk/localizations`
   - What's unclear: Whether auth emails (password reset, verification) can be localized to Bahasa Indonesia
   - Recommendation: Use Clerk default English emails for Phase 1, investigate custom email templates in Phase 3+. Indonesian users in UAE/Dubai likely understand English emails.

2. **Production Issuer Domain Format**
   - What we know: Dev format is `https://verb-noun-00.clerk.accounts.dev`
   - What's unclear: When migrating to production, does issuer URL change? If yes, requires Convex environment variable update + re-deploy.
   - Recommendation: Document production deployment steps in Phase 6. Test with staging environment first.

3. **Token Lifetime for Production**
   - What we know: Default 60 seconds works for active users, Clerk handles refresh automatically
   - What's unclear: Whether 60s is optimal for Indonesian market (slower networks?)
   - Recommendation: Start with default 60s, monitor token refresh errors in Phase 4+ analytics. Can increase to 120-300s if needed.

4. **Convex Environment Variable Updates**
   - What we know: Environment variables require re-deploy to take effect
   - What's unclear: Does Convex auto-deploy on env var change, or manual deploy needed?
   - Recommendation: Assume manual deploy needed. Document in Phase 1 success criteria.

5. **Multiple Clerk Applications**
   - What we know: Phase 1 creates one Clerk application
   - What's unclear: If we need separate dev/staging/prod Clerk apps, or use single app with multiple origins
   - Recommendation: Start with single Clerk app (supports multiple origins). Separate apps later if compliance requires data isolation.

## Sources

### Primary (HIGH confidence)
- [Convex & Clerk | Convex Developer Hub](https://docs.convex.dev/auth/clerk) - Official Convex documentation for Clerk integration
- [Integrate Convex with Clerk - Databases | Clerk Docs](https://clerk.com/docs/guides/development/integrations/databases/convex) - Official Clerk documentation for Convex integration
- [Custom JWT Provider | Convex Developer Hub](https://docs.convex.dev/auth/advanced/custom-jwt) - JWT validation requirements
- [Debugging Authentication | Convex Developer Hub](https://docs.convex.dev/auth/debug) - Testing and verification steps
- [Session management: JWT templates](https://clerk.com/docs/guides/sessions/jwt-templates) - JWT template creation and configuration
- [Sign-up and sign-in options - Authentication strategies | Clerk Docs](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options) - Enabling email/password authentication

### Secondary (MEDIUM confidence)
- [Authentication Best Practices: Convex, Clerk and Next.js](https://stack.convex.dev/authentication-best-practices-convex-clerk-and-nextjs) - Stack Overflow article by Convex team (Jan 2026)
- [Clerk environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables) - Environment variable formats and usage
- [Localization prop (experimental) - Customizing Clerk | Clerk Docs](https://clerk.com/docs/guides/customizing-clerk/localization) - Indonesian locale support

### Tertiary (LOW confidence)
- [GitHub - get-convex/template-nextjs-clerk](https://github.com/get-convex/template-nextjs-clerk) - Official starter template (code not fully reviewed)
- [Expo App Authentication with Clerk and Convex](https://stack.convex.dev/user-authentication-with-clerk-and-convex) - Mobile patterns (may differ from Next.js)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official packages, current versions, well-documented
- Architecture: HIGH - Official Convex + Clerk integration docs, verified code examples
- Pitfalls: MEDIUM-HIGH - Combination of official debugging docs + community reports (Stack Overflow)
- Testing: MEDIUM - Debug patterns documented, but Phase 1 manual testing is interim solution

**Research date:** 2026-01-23
**Valid until:** 2026-03-23 (60 days - stable domain, unlikely to change rapidly)

**Key assumptions:**
- Clerk + Convex integration remains stable (both platforms committed to partnership)
- JWT standard doesn't change (RFC 7519 is stable)
- `@clerk/nextjs` v6 remains current for Next.js 15 (v7 unlikely before Q2 2026)

**What could invalidate this research:**
- Clerk releases new JWT template format
- Convex changes auth.config.ts structure (breaking change, unlikely)
- Next.js 16 requires `@clerk/nextjs` v7 (would need package updates, not architecture changes)
