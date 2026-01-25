# Plan 03-02 Summary: Clerk Webhook HTTP Action

## Status: Complete

## Duration
~15 min (including debugging HTTP endpoint URL)

## What Was Built

Clerk webhook HTTP action that syncs user events from Clerk to Convex.

### Deliverables

| Artifact | Description |
|----------|-------------|
| `convex/http.ts` | HTTP router with Clerk webhook at `/webhook/clerk` |
| Clerk Dashboard | Webhook endpoint configured for user.created/updated/deleted |
| `CLERK_WEBHOOK_SECRET` | Environment variable set in Convex |

### Key Implementation Details

**Webhook endpoint:** `https://pleasant-antelope-109.convex.site/webhook/clerk` (dev)

**Events handled:**
- `user.created` → calls `internal.users.createUser`
- `user.updated` → calls `internal.users.updateUser`
- `user.deleted` → calls `internal.users.deleteUser`

**Security:**
- Svix signature verification using Web Crypto API
- All events logged to `webhookAudit` table for debugging

### Commits

| Hash | Description |
|------|-------------|
| 72546a6 | feat(03-02): add Clerk webhook route to webhook.js |
| (orchestrator) | fix: rewrite webhook with Web Crypto API and proper http.ts location |

## Deviations

1. **Node.js crypto → Web Crypto API**: Convex runtime doesn't support `require("crypto")`. Rewrote signature verification using Web Crypto API with manual base64 encode/decode helpers.

2. **HTTP router location**: Convex ignores `_internal/` directory for HTTP routes. Moved all routes to `convex/http.ts` with `export default http`.

3. **URL domain**: Convex HTTP actions use `.convex.site` domain, not `.convex.cloud`. Updated Clerk webhook URL from `intent-otter-212.convex.cloud/api/webhook/clerk` to `pleasant-antelope-109.convex.site/webhook/clerk`.

## Verification

- [x] Clerk webhook endpoint configured
- [x] Test webhook from Clerk Dashboard returns 200
- [x] Signature verification working (rejects invalid signatures)
- [x] CLERK_WEBHOOK_SECRET set with real Clerk signing secret

## Decisions

- **Web Crypto API for signatures**: Use `crypto.subtle` instead of Node.js crypto for Convex compatibility
- **HTTP routes in http.ts**: All HTTP routes must be in `convex/http.ts`, not subdirectories
- **Dev deployment for testing**: Using dev deployment (`pleasant-antelope-109.convex.site`) until production deploy
