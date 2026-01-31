# Onboarding Flow

Automatic organization and workspace creation for new users.

---

## Overview

Every user gets their own isolated workspace automatically upon signup. No manual setup required.

**Flow:**
1. User signs up or signs in via Clerk
2. Clerk redirects to `/dashboard` (configured in `.env.local`)
3. `/dashboard` checks if user has organizations
4. If no org → redirect to `/onboarding`
5. `/onboarding` auto-creates organization + workspace
6. Redirect to `/[workspace]` dashboard

---

## Files Created

### 1. `/src/app/onboarding/page.tsx`

Auto-creates organization and workspace for new users.

**Logic:**
- Check if user has organizations via Clerk `useOrganizationList` hook
- If yes: Redirect to first org's workspace
- If no: Create organization via API
- Generate org name from user's full name or email
- Generate unique slug: `{name}-{userIdSuffix}`
- Set new org as active
- Redirect to workspace

**Dev mode:** Redirects to `/demo` workspace (bypasses Clerk)

### 2. `/src/app/dashboard/page.tsx`

Post-login redirect handler.

**Logic:**
- Check if user has organizations
- No org → `/onboarding`
- Has org → Find workspace → `/{workspace.slug}`

**Dev mode:** Redirects to `/demo` workspace

**Config:** Set as `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` in `.env.local`

### 3. `/src/app/api/organizations/create/route.ts`

API endpoint for creating organization + workspace atomically.

**Endpoint:** `POST /api/organizations/create`

**Request:**
```json
{
  "name": "User's Workspace",
  "slug": "users-workspace-a1b2c3"
}
```

**Response:**
```json
{
  "success": true,
  "organizationId": "org_xxx",
  "workspaceId": "jx123xxx",
  "workspaceSlug": "users-workspace-a1b2c3"
}
```

**Process:**
1. Create organization in Clerk
2. Create workspace in Convex
3. Link org → workspace via `publicMetadata.convexWorkspaceId`
4. Add user as workspace owner
5. Return IDs for redirect

---

## Convex Mutations Added

### `workspaceMembers.create()`

Creates workspace membership for a user.

**Args:**
- `workspace_id` - Workspace to add member to
- `user_id` - Clerk user ID
- `role` - 'owner' | 'admin' | 'member'

**Idempotent:** Returns existing member ID if already exists.

### `workspaces.getByOrgId()`

Finds workspace linked to a Clerk organization.

**Args:**
- `clerk_org_id` - Clerk organization ID

**Returns:** Workspace document or null

**Logic:**
1. Find organization by `clerk_org_id`
2. Get workspace from `org.workspace_id`

---

## Testing

### Local Development (Dev Mode)

Dev mode bypasses Clerk auth and uses mock data:

```bash
# Ensure dev mode is enabled
cat .env.local | grep NEXT_PUBLIC_DEV_MODE
# Should show: NEXT_PUBLIC_DEV_MODE=true

# Start dev server
npm run dev

# Test routes
http://localhost:3000/         # Landing page
http://localhost:3000/dashboard # Redirects to /demo
http://localhost:3000/onboarding # Redirects to /demo
http://localhost:3000/demo      # Dashboard (offline mode)
```

**Expected behavior:**
- `/dashboard` and `/onboarding` redirect to `/demo`
- Footer shows "Offline Mode" (orange dot)
- No Clerk authentication required

### Production Testing (Clerk Auth Enabled)

Uncomment Clerk keys in `.env.local`:

```bash
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
```

**Test flow:**
1. Clear cookies/incognito window
2. Go to `http://localhost:3000`
3. Click "Sign Up"
4. Create new account
5. **Should auto-redirect:** Sign Up → `/dashboard` → `/onboarding` → create org → `/{workspace}`
6. **Should see:** Dashboard with empty contacts/inbox
7. Check Clerk dashboard: User should be in new organization
8. Check Convex dashboard: Workspace should exist with user as owner

**Test existing user:**
1. Sign out
2. Sign in with same account
3. **Should auto-redirect:** Sign In → `/dashboard` → `/{workspace}`
4. **Should skip:** `/onboarding` (user already has org)

---

## Configuration

### Environment Variables

```bash
# After sign-in redirect (already configured)
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

### Middleware

`/dashboard` and `/onboarding` are **protected routes** (require auth).

See `src/middleware.ts` - these routes are NOT in `isPublicRoute` matcher.

---

## Future Enhancements

### Invitations

Organizations are private by default. To add team members:

1. **Clerk invitations:** Use Clerk's built-in invitation system
2. **Email invite:** Owner sends invite via Clerk dashboard
3. **Acceptance:** Invitee clicks link → joins organization
4. **Webhook:** `organizationMembership.created` creates workspace member

**Already implemented:** Webhook handlers in `convex/organizations.ts`

### Multiple Workspaces

Currently: 1 org = 1 workspace

**Future:** Allow multiple workspaces per organization
- Add workspace switcher to sidebar
- Update `getByOrgId` to return array
- Add workspace creation UI

---

## Troubleshooting

### "Organization exists but workspace not found"

**Cause:** Organization created but workspace creation failed

**Fix:**
1. Check Convex logs for workspace creation error
2. Manually create workspace via Convex dashboard
3. Link org to workspace: Update `org.publicMetadata.convexWorkspaceId`

### Redirect loop between `/dashboard` and `/onboarding`

**Cause:** Org creation API failed but returned success

**Fix:**
1. Check API logs: `src/app/api/organizations/create/route.ts`
2. Check Clerk dashboard: Was organization created?
3. Check Convex: Was workspace created?
4. Delete incomplete org/workspace and retry

### Dev mode shows Clerk sign-in

**Cause:** Clerk keys are uncommented in `.env.local`

**Fix:**
```bash
# Comment out Clerk keys
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
# CLERK_SECRET_KEY="..."
```

---

## Architecture Notes

### Why separate `/dashboard` and `/onboarding`?

**Design decision:** Keep concerns separated

- `/dashboard`: Routing logic (where should user go?)
- `/onboarding`: Creation logic (create org + workspace)

**Alternative considered:** Single page handling both
**Rejected because:** Violates single responsibility, harder to test

### Why API route instead of client-side Clerk hooks?

**Design decision:** Atomic org + workspace creation

**API route ensures:**
1. Organization created
2. Workspace created
3. Link established
4. Member added

**All or nothing** - no partial state.

**Client-side alternative:**
```tsx
const { createOrganization } = useOrganization()
const org = await createOrganization(...)
await convex.mutation(...)
```

**Rejected because:** Race conditions, error handling complexity

---

## Related Files

- `convex/organizations.ts` - Webhook handlers for org sync
- `convex/schema.ts` - Organization and workspace schemas
- `src/middleware.ts` - Route protection
- `.env.local` - Clerk redirect config
