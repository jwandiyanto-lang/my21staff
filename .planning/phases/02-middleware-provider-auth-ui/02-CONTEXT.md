# Phase 2: Middleware + Provider + Auth UI - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can sign in/out using Clerk components with route protection working. This phase covers the user-facing authentication experience: sign-in, sign-up, password reset, user menu, and middleware-based route protection.

</domain>

<decisions>
## Implementation Decisions

### Sign-in/Sign-up flow
- Separate pages at /sign-in and /sign-up (not modals)
- After successful sign-in, redirect to dashboard (/app)
- Email verification required before app access
- Password reset uses Clerk's built-in flow (replaces broken Supabase reset)

### Auth UI styling
- Match my21staff brand guidelines (black/white theme, brand colors)
- Show my21staff logo on auth pages
- Error messages in English (Clerk defaults)

### Route protection
- Unauthenticated users redirect to /sign-in with "Please sign in to continue" message
- Keep current public routes (match existing Supabase auth configuration)
- All /api/* routes protected by Clerk middleware

### User menu
- UserButton in current position (same as existing Supabase profile menu)
- Standard Clerk dropdown actions (Manage account, Sign out)
- Sign-out redirects to landing page (/)
- Avatar fallback shows user initials when no photo

### Claude's Discretion
- Auth page layout (centered card vs split screen)
- Loading state while auth resolves
- Exact styling implementation details
- Toast notification implementation for auth messages

</decisions>

<specifics>
## Specific Ideas

- Auth pages should feel consistent with the existing my21staff app design
- Clerk's built-in password reset fixes the broken Supabase flow — major UX improvement

</specifics>

<deferred>
## Deferred Ideas

- Workspace invitations from team settings → Phase 4 (Organizations)
- Role-based access control → Phase 4 (handled via Clerk organization roles)

</deferred>

---

*Phase: 02-middleware-provider-auth-ui*
*Context gathered: 2026-01-23*
