# Dev Mode Patterns

**Critical: How to properly handle dev mode in React hooks**

## The Problem

On 2026-01-27, production AND localhost both crashed with:
```
Error: @clerk/clerk-react: useAuth can only be used within the <ClerkProvider /> component
```

**Root causes:**
1. Violated React's Rules of Hooks by conditionally calling hooks inside a function
2. Providers.tsx was skipping ClerkProvider entirely in dev mode, breaking hooks that call useAuth/useUser

**Bad pattern:**
```tsx
// ❌ WRONG - Violates Rules of Hooks
function useClerkAuth() {
  if (isDevMode) {
    return { userId: 'mock', user: null }
  }
  // Conditionally calling hooks breaks React
  const { useAuth, useUser } = require('@clerk/nextjs')
  const { userId } = useAuth() // ❌ Hook called conditionally
  const { user } = useUser()   // ❌ Hook called conditionally
  return { userId, user }
}
```

## The Solution

**✅ ALWAYS call hooks unconditionally, then use the results conditionally**

```tsx
// ✅ CORRECT - Hooks called unconditionally
import { useAuth, useUser } from '@clerk/nextjs'

export function useWorkspaceSettings(workspaceId: string | null) {
  // 1. Call ALL hooks unconditionally at top level
  const clerkAuth = useAuth()
  const clerkUser = useUser()

  // 2. Conditionally USE the results
  const userId = isDevMode ? 'dev-user-001' : clerkAuth.userId
  const user = isDevMode ? mockUser : clerkUser.user

  // 3. Skip queries in dev mode
  const data = useQuery(
    api.something,
    isDevMode ? 'skip' : { id: workspaceId }
  )

  // 4. Return mock data early if needed
  if (isDevMode) {
    return { data: MOCK_DATA, isLoading: false }
  }

  // 5. Use real data in production
  return { data, isLoading: data === undefined }
}
```

## Rules of Hooks Reminder

React hooks MUST be called:
1. **At the top level** (not inside conditions, loops, or nested functions)
2. **In the same order every render** (React tracks by call order)
3. **Only in React components or custom hooks**

**Never do this:**
```tsx
❌ if (condition) { useHook() }
❌ hooks.forEach(h => h())
❌ function helper() { useHook() }
❌ const hook = condition ? useHookA : useHookB; hook()
```

## Dev Mode Pattern Checklist

When adding new hooks that need dev mode support:

- [ ] Import hooks at top (not dynamic require)
- [ ] Call hooks unconditionally at top of component/hook
- [ ] Use `isDevMode` to conditionally USE results, not CALL hooks
- [ ] Skip Convex/API queries with `'skip'` in dev mode
- [ ] Return mock data early if `isDevMode === true`
- [ ] Test both `/demo` (dev) and production workspace routes

## Files Using This Pattern

- `src/lib/queries/use-workspace-settings.ts` ✅ Fixed 2026-01-27
- `src/lib/queries/use-contacts.ts` - Check this one
- Any future hooks that need dev mode support

## Quick Reference

```tsx
// Template for dev-mode-aware hooks
import { useExternalHook } from 'external-package'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export function useMyHook(id: string) {
  // 1. ALWAYS call hooks (unconditional)
  const external = useExternalHook()

  // 2. Conditionally USE results
  const value = isDevMode ? 'mock-value' : external.value

  // 3. Skip queries in dev mode
  const query = useQuery(api.foo, isDevMode ? 'skip' : { id })

  // 4. Early return for dev mode
  if (isDevMode) return { data: MOCK, isLoading: false }

  // 5. Production logic
  return { data: query, isLoading: query === undefined }
}
```

## Critical: Providers Must Always Include ClerkProvider

**The other half of the fix:**

Even if hooks are called correctly, they'll fail if ClerkProvider is missing.

**❌ WRONG - Skipping ClerkProvider in dev mode:**
```tsx
// providers.tsx
if (isDevMode) {
  return (
    <ConvexProvider> {/* No ClerkProvider! */}
      {children}
    </ConvexProvider>
  )
}
```

**✅ CORRECT - Always include ClerkProvider:**
```tsx
// providers.tsx
return (
  <ClerkProvider> {/* ALWAYS present */}
    {isDevMode ? (
      <ConvexProvider>{children}</ConvexProvider>
    ) : (
      <ConvexProviderWithClerk useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    )}
  </ClerkProvider>
)
```

**Why this matters:**
- Hooks like `useAuth()` need ClerkProvider to exist, even if you ignore the results
- Dev mode can use plain Convex (no auth) but still needs Clerk context
- This allows hooks to safely call Clerk hooks and conditionally use results

---

**Remember:**
1. Call hooks unconditionally (React Rules of Hooks)
2. Always wrap with ClerkProvider (even in dev mode)
3. Conditionally USE results based on isDevMode
4. Breaking either rule causes crashes in production OR localhost
