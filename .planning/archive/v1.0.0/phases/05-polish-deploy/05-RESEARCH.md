# Phase 5: Polish + Deploy - Research

**Researched:** 2026-01-25
**Domain:** Local webhook testing with ngrok, production deployment verification
**Confidence:** HIGH

## Summary

Phase 5 focuses on final verification and production deployment readiness for the v3.2 CRM rebuild. The core technical challenge is testing the rebuilt inbox with live Kapso webhooks before deploying to production. Since the app runs on localhost:3000 and Kapso webhooks need a public URL, ngrok provides the standard solution for exposing localhost during testing.

The research reveals two viable ngrok npm packages, with the wrapper package (ngrok) being simpler for temporary testing needs. Testing WhatsApp webhooks locally requires a permanent ngrok URL (available free since 2023), webhook URL configuration in Kapso dashboard, and verification of the complete round-trip: receive WhatsApp message → view in inbox → reply → verify delivery.

Production deployment verification follows a layered approach: smoke testing critical paths (under 5 minutes), environment variable validation, and post-deployment monitoring. Since Vercel deployment is currently blocked due to billing freeze, the phase will focus on localhost verification only, with deployment decisions deferred.

**Primary recommendation:** Use ngrok npm wrapper for temporary localhost tunneling, test full webhook round-trip with permanent dev domain, verify critical paths via smoke testing, and document deployment readiness without actually deploying.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ngrok (npm) | Latest | Localhost tunneling | Simple wrapper, no binary download needed at runtime, suitable for dev/test |
| @ngrok/ngrok | Latest | Official SDK | No binaries, programmatic control, better for production use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js built-in env | 15.x | Environment variables | Already in stack, handles NEXT_PUBLIC_ prefix |
| Convex CLI | 1.31.6+ | Deployment environment management | Already in stack for Convex deployments |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ngrok | localtunnel | Free, open-source, but less stable and no permanent URLs |
| ngrok | Visual Studio dev tunnel | Free for VS Code users, but requires VS 2022 |
| ngrok | InstaTunnel | No 2-hour limit on free tier, but less ecosystem support |

**Installation:**
```bash
# For simple temporary testing (recommended for Phase 5)
npm install --save-dev ngrok

# For programmatic control (if needed)
npm install --save-dev @ngrok/ngrok
```

## Architecture Patterns

### Recommended Testing Flow
```
1. Local Setup
   ├── Start Next.js dev server (localhost:3000)
   ├── Start ngrok tunnel pointing to 3000
   └── Get permanent ngrok URL

2. Kapso Configuration
   ├── Update webhook URL to ngrok URL + /api/webhook/kapso
   ├── Set verification token if required
   └── Subscribe to messages field

3. Round-Trip Testing
   ├── Send WhatsApp message → Kapso → ngrok → localhost webhook
   ├── Verify message appears in inbox UI
   ├── Send reply from inbox → Kapso → WhatsApp
   └── Verify delivery confirmation

4. Cleanup
   ├── Stop ngrok tunnel
   ├── Revert Kapso webhook URL
   └── Document results
```

### Pattern 1: Simple ngrok Tunnel (Recommended)
**What:** Use ngrok CLI command to expose localhost temporarily
**When to use:** One-time testing, manual verification, development

**Example:**
```bash
# Install ngrok globally or as dev dependency
npm install --save-dev ngrok

# Start tunnel (using free permanent dev domain)
npx ngrok http 3000

# Output will show URLs like:
# Forwarding: https://abc123.ngrok-free.dev -> http://localhost:3000
```

### Pattern 2: Programmatic ngrok (If Automation Needed)
**What:** Control ngrok from Node.js code
**When to use:** Automated testing, CI/CD integration, scripted workflows

**Example:**
```javascript
// scripts/test-webhooks.js
const ngrok = require('ngrok');

(async function() {
  // Connect to ngrok
  const url = await ngrok.connect({
    addr: 3000, // Port number
    authtoken: process.env.NGROK_AUTHTOKEN, // From ngrok.com dashboard
  });

  console.log(`Tunnel created: ${url}`);
  console.log(`Update Kapso webhook to: ${url}/api/webhook/kapso`);

  // Keep tunnel open until Ctrl+C
  process.on('SIGINT', async () => {
    await ngrok.disconnect();
    await ngrok.kill();
    process.exit();
  });
})();
```

### Pattern 3: Environment Variable Validation
**What:** Verify all required environment variables before deployment
**When to use:** Pre-deployment checklist, CI/CD pipelines

**Example:**
```typescript
// scripts/verify-env.ts
const REQUIRED_ENV = [
  'NEXT_PUBLIC_CONVEX_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'RESEND_API_KEY',
];

const OPTIONAL_ENV = [
  'KAPSO_WEBHOOK_SECRET', // Should be set in production
];

function verifyEnvironment() {
  const missing = REQUIRED_ENV.filter(key => !process.env[key]);
  const optionalMissing = OPTIONAL_ENV.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }

  if (optionalMissing.length > 0) {
    console.warn('Missing optional environment variables:', optionalMissing);
  }

  console.log('✓ Environment variables validated');
}

verifyEnvironment();
```

### Anti-Patterns to Avoid
- **Using random ngrok URLs:** Free tier now provides permanent dev domains (abc123.ngrok-free.dev) - use these instead of random URLs
- **Skipping signature verification:** Always verify webhook signatures in production to prevent spoofing attacks
- **Hardcoding ngrok URLs:** ngrok URLs should never be committed to code or config files
- **Testing without cleanup:** Always document and revert temporary webhook URL changes
- **Deploying without smoke testing:** Never deploy to production without verifying critical paths work

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Localhost tunneling | Custom reverse proxy | ngrok | SSL/TLS built-in, stable, widely supported, webhook inspection UI |
| Webhook signature verification | Custom crypto implementation | crypto.timingSafeEqual | Prevents timing attacks, built into Node.js |
| Environment variable validation | Manual checking | Schema validation library | Catches errors early, provides clear error messages |
| Production smoke tests | Manual testing checklist | Automated test suite | Consistent, fast (under 5 min), repeatable |
| Deployment rollback | Manual revert | Platform-native rollback | Instant, atomic, preserves state |

**Key insight:** Webhook testing and production deployment have well-established patterns with mature tooling. Custom solutions introduce security risks (signature verification), reliability issues (tunneling), and human error (manual checklists). Use standard tools.

## Common Pitfalls

### Pitfall 1: ngrok Free Tier Interstitial Page
**What goes wrong:** Free tier ngrok shows a browser warning page before reaching your app, breaking webhook delivery
**Why it happens:** ngrok added interstitial pages to free tier in 2023 to prevent abuse
**How to avoid:** This only affects browser traffic, not webhooks. API requests (like Kapso webhooks) bypass the interstitial and work fine on free tier
**Warning signs:** If testing in browser shows warning page, don't panic - webhooks still work

### Pitfall 2: Forgetting to Update Kapso Webhook URL Back
**What goes wrong:** Kapso keeps sending webhooks to ngrok URL after tunnel closes, breaking production
**Why it happens:** Manual configuration change without cleanup tracking
**How to avoid:** Document original webhook URL before changing, use a checklist, set calendar reminder to revert
**Warning signs:** Production webhooks stop working after local testing session

### Pitfall 3: Missing KAPSO_WEBHOOK_SECRET in Production
**What goes wrong:** Webhook signature verification is skipped, allowing spoofed requests
**Why it happens:** Secret is optional in code (for local dev), but should be required in production
**How to avoid:** Add KAPSO_WEBHOOK_SECRET to required environment variables list, verify it's set before deployment
**Warning signs:** Logs show "Warning: KAPSO_WEBHOOK_SECRET not set - skipping signature verification"

### Pitfall 4: Testing Only One Direction
**What goes wrong:** Webhook receives messages but sending replies fails (or vice versa)
**Why it happens:** Assuming if one direction works, both work
**How to avoid:** Always test complete round-trip: receive message → view in inbox → send reply → verify delivery
**Warning signs:** Inbox shows received messages but sent messages don't appear in WhatsApp

### Pitfall 5: Environment Variable Case Sensitivity
**What goes wrong:** Convex environment variables work locally but fail in production deployment
**Why it happens:** Convex env vars are case-sensitive, local dev may have different casing than production
**How to avoid:** Use consistent UPPERCASE naming, verify with `npx convex env list` before deployment
**Warning signs:** Functions fail with "undefined" when accessing process.env.KEY

### Pitfall 6: Deploying Without Smoke Testing Critical Paths
**What goes wrong:** Authentication, inbox, or sending breaks in production
**Why it happens:** Assuming localhost behavior matches production behavior
**How to avoid:** Run smoke tests (login, view inbox, send message, receive message) before declaring ready
**Warning signs:** Users report basic features broken immediately after deployment

## Code Examples

Verified patterns from official sources and codebase analysis:

### Start ngrok Tunnel (CLI)
```bash
# Simple command - uses permanent free dev domain
npx ngrok http 3000

# Output shows:
# Forwarding: https://abc123.ngrok-free.dev -> http://localhost:3000
# Web Interface: http://127.0.0.1:4040
```

### Verify Webhook Signature (Already Implemented)
```typescript
// Source: /src/lib/kapso/verify-signature.ts
import crypto from 'crypto'

export function verifyKapsoSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}
```

### Webhook Testing Checklist Script
```bash
#!/bin/bash
# scripts/test-webhook-flow.sh

echo "=== Webhook Testing Checklist ==="
echo ""

echo "1. Start Next.js dev server"
read -p "   Is localhost:3000 running? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

echo "2. Start ngrok tunnel"
echo "   Run: npx ngrok http 3000"
read -p "   Copy ngrok URL from output (y when ready) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

echo "3. Update Kapso webhook URL"
echo "   Current URL: $(grep KAPSO_WEBHOOK_URL .env.local 2>/dev/null || echo 'Not documented')"
read -p "   Enter ngrok URL: " NGROK_URL
echo "   → Go to Kapso dashboard"
echo "   → Set webhook URL to: ${NGROK_URL}/api/webhook/kapso"
read -p "   Webhook URL updated in Kapso? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

echo "4. Test receiving messages"
read -p "   Send test WhatsApp message. Does it appear in inbox? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

echo "5. Test sending messages"
read -p "   Send reply from inbox. Does it deliver to WhatsApp? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

echo "6. Cleanup"
echo "   → Stop ngrok tunnel"
echo "   → Revert Kapso webhook URL to production"
read -p "   Cleanup complete? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

echo ""
echo "✓ Webhook testing complete!"
```

### Convex Environment Variables Check
```bash
# List all environment variables in current deployment
npx convex env list

# Set production environment variable
npx convex env set KAPSO_WEBHOOK_SECRET your-secret-here --prod

# Verify environment variable is set
npx convex env get KAPSO_WEBHOOK_SECRET --prod
```

### Smoke Test Script (Critical Paths)
```typescript
// scripts/smoke-test.ts
// Run after deployment to verify critical paths

const CRITICAL_PATHS = [
  {
    name: 'Authentication',
    test: async () => {
      // Test Clerk auth flow
      const response = await fetch('https://your-domain.com/api/auth/session');
      return response.ok;
    }
  },
  {
    name: 'Inbox Load',
    test: async () => {
      // Test Convex connection and inbox query
      const response = await fetch('https://your-domain.com/api/conversations');
      return response.ok && response.headers.get('content-type')?.includes('json');
    }
  },
  {
    name: 'Send Message',
    test: async () => {
      // Test Kapso send endpoint
      const response = await fetch('https://your-domain.com/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'test', message: 'test' })
      });
      return response.status === 401; // Should fail auth, but endpoint should exist
    }
  }
];

async function runSmokeTests() {
  console.log('Running smoke tests...\n');

  const results = await Promise.all(
    CRITICAL_PATHS.map(async ({ name, test }) => {
      try {
        const passed = await test();
        return { name, passed, error: null };
      } catch (error) {
        return { name, passed: false, error };
      }
    })
  );

  results.forEach(({ name, passed, error }) => {
    const status = passed ? '✓' : '✗';
    console.log(`${status} ${name}`);
    if (error) console.log(`  Error: ${error}`);
  });

  const allPassed = results.every(r => r.passed);
  console.log(`\n${allPassed ? '✓ All tests passed' : '✗ Some tests failed'}`);
  process.exit(allPassed ? 0 : 1);
}

runSmokeTests();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Random ngrok URLs | Permanent dev domains (free) | August 2023 | Stable URLs for testing, no need to update webhooks constantly |
| ngrok paid for custom domains | Free tier includes permanent .ngrok-free.dev | August 2023 | Webhook testing free for all developers |
| Manual environment variable checking | Schema validation libraries | 2024+ | Catches errors early in CI/CD pipelines |
| Manual post-deployment testing | Automated smoke tests | 2024+ | Under 5 minute verification, consistent coverage |
| Separate dev/prod deployments | Convex dev + prod in single project | Current | Environment parity with different env vars |

**Deprecated/outdated:**
- ngrok authtoken via CLI only: Now supports environment variable `NGROK_AUTHTOKEN` for better CI/CD integration
- ngrok 2-hour session limit: Free tier sessions are now unlimited (but not permanent URLs - confusion in community)
- Hardcoded webhook secrets: Now should be in environment variables with schema validation

## Open Questions

Things that couldn't be fully resolved:

1. **Actual Production Deployment Strategy**
   - What we know: Vercel deployment is currently blocked (billing freeze per CLAUDE.md)
   - What's unclear: Whether to create fresh Vercel project or fix billing on existing project
   - Recommendation: Document deployment readiness but defer actual deployment decision to user. Focus Phase 5 on localhost verification only.

2. **Kapso Webhook URL Persistence**
   - What we know: Webhooks currently point to intent-otter-212.convex.site (from PROJECT.md)
   - What's unclear: Whether this is the correct production URL or needs updating
   - Recommendation: Verify current webhook URL in Kapso dashboard before testing, document both test and production URLs in a WEBHOOK-CONFIG.md file

3. **Environment Variable Cleanup Scope**
   - What we know: Phase success criteria mentions "environment variables cleaned up"
   - What's unclear: Which variables need cleanup? Old Supabase vars? Duplicate keys?
   - Recommendation: Audit .env.local for unused variables (Supabase-related, old API keys), create cleanup checklist

4. **Post-Deployment Monitoring**
   - What we know: Convex has built-in monitoring, Next.js has Speed Insights
   - What's unclear: What specific metrics indicate "deployment successful"?
   - Recommendation: Define success metrics (webhook receive rate, response times, error rates) before deployment

## Sources

### Primary (HIGH confidence)
- [ngrok Documentation - WhatsApp Webhooks](https://ngrok.com/docs/integrations/webhooks/whatsapp-webhooks) - Official ngrok integration guide
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables) - Official Convex docs
- [Convex Production Deployment](https://docs.convex.dev/production) - Official Convex deployment guide
- Codebase analysis:
  - `/src/app/api/webhook/kapso/route.ts` - Current webhook implementation
  - `/src/lib/kapso/verify-signature.ts` - HMAC-SHA256 signature verification
  - `/src/lib/kapso/client.ts` - Kapso API client

### Secondary (MEDIUM confidence)
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) - Official Next.js guidance (verified 2026)
- [Webhook Security Best Practices - Twilio](https://www.twilio.com/docs/usage/webhooks/webhooks-security) - Industry standard practices
- [ngrok Free Tier Static Domains](https://ngrok.com/blog/free-static-domains-ngrok-users) - August 2023 announcement (verified current)
- [Smoke Testing in 2026 Guide](https://blog.qasource.com/a-complete-guide-to-smoke-testing-in-software-qa) - Current year best practices

### Tertiary (LOW confidence)
- Multiple Medium articles on ngrok usage - General patterns confirmed by official docs
- Community discussions on deployment checklists - Validated against official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - ngrok is industry standard, npm packages well-documented, Convex official docs authoritative
- Architecture: HIGH - Patterns verified against codebase and official documentation, webhook flow is standard WhatsApp integration
- Pitfalls: MEDIUM - Based on common patterns and documentation warnings, not all tested in this specific codebase
- Code examples: HIGH - Signature verification from actual codebase, ngrok patterns from official docs, smoke test pattern is standard

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain with established patterns)

**Research notes:**
- CONTEXT.md clearly indicates ngrok approach for localhost webhook testing - research focused on this requirement
- Vercel deployment blocked means Phase 5 should focus on verification readiness, not actual deployment
- Codebase already has robust webhook signature verification implemented - no changes needed
- Convex deployment URL (intent-otter-212.convex.site) is already in production, separate from Next.js deployment concerns
