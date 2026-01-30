# Coding Conventions

**Analysis Date:** 2026-01-30

## Naming Patterns

**Files:**
- Component files: `PascalCase.tsx` (e.g., `StatsCards.tsx`, `MessageBubble.tsx`)
- Utility/helper files: `kebab-case.ts` (e.g., `use-contacts.ts`, `workspace-auth.ts`, `verify-signature.ts`)
- Hook files: `use-[feature].ts` (e.g., `use-contacts.ts`, `use-messages.ts`, `use-conversations.ts`)
- API route files: `route.ts` in Next.js app directory structure
- Test files: `[name].test.ts` in `__tests__` directories (e.g., `src/lib/ari/__tests__/scoring.test.ts`)

**Functions:**
- Exported functions: `camelCase` (e.g., `calculateLeadScore`, `getLeadTemperature`, `requireWorkspaceMembership`)
- React components: `PascalCase` for component functions (e.g., `StatsCards`, `StatCard`)
- Private/internal functions: `camelCase` with no export (e.g., `isValidEmail`, `isLongTimeline`, `hasHighIelts`)
- Hook functions: `useXxx` convention (e.g., `useContacts`, `useMessages`, `useConversations`)

**Variables:**
- Constants (immutable): `UPPER_SNAKE_CASE` (e.g., `WEIGHTS`, `REQUIRED_FIELDS`, `PAGE_SIZE`)
- State variables: `camelCase` (e.g., `basicScore`, `qualificationScore`, `documentScore`)
- Readonly objects: `UPPER_SNAKE_CASE` (e.g., `WEIGHTS`, `DEFAULT_LEAD_STATUSES`)
- React state setters: Standard `setXxx` pattern from `useState`

**Types:**
- Interface names: `PascalCase` (e.g., `ScoreBreakdown`, `StatsCardsProps`, `AuthResult`)
- Type names: `PascalCase` (e.g., `WorkspaceRole`, `DocumentStatus`)
- Record types: `Record<Key, Value>` for key-value maps (e.g., `Record<string, string>`)
- Database model types: Imported from `@/types/database` as `PascalCase` (e.g., `Contact`, `Conversation`, `Message`)

## Code Style

**Formatting:**
- Tool: ESLint 9 with Next.js and TypeScript configs
- Config file: `eslint.config.mjs` at project root
- No Prettier config found; ESLint handles linting

**Linting:**
- Runner: `npm run lint` - checks `src/**/*.{ts,tsx}` with max-warnings=0
- Auto-fix: `npm run lint:fix` - applies auto-fixable rule violations
- Pre-commit: `npm run pre-commit` - runs both lint and type-check before commits
- TypeScript strict: `strict: false` in tsconfig.json (not strict mode enforced)

**ESLint Rules:**
- Main config extends: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Custom rule: `@typescript-eslint/no-use-before-define` set to error to prevent "Cannot access before initialization" errors
  - Variables checked before declaration: error
  - Functions allowed to hoist: functions hoisting permitted
  - Classes checked before declaration: error
  - Named exports: not allowed before declaration

## Import Organization

**Order:**
1. External/library imports (react, next, third-party packages)
2. Internal type imports (`import type { Type } from '@/...'`)
3. Internal absolute imports using `@/` alias (e.g., `@/lib/utils`, `@/components/ui/card`)
4. Relative imports (rarely used due to alias preference)

**Path Aliases:**
- `@/*` → `./src/*` - main alias for all src code
- `convex/_generated/*` → direct path for Convex-generated types

**Example import block:**
```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import type { Contact } from '@/types/database'
import { cn } from '@/lib/utils'
import { calculateLeadScore } from '@/lib/ari/scoring'
```

## Error Handling

**Patterns:**
- API route errors: Return `NextResponse.json({ error: 'message' }, { status: code })`
  - 400: Invalid input (validation failures)
  - 401: Unauthorized (missing/invalid auth)
  - 403: Forbidden (insufficient permissions)
  - 404: Not found (resource doesn't exist)
  - 500: Internal server error (unexpected failures)

- Mutation errors: Throw new Error with descriptive message (e.g., `throw new Error('Failed to load contacts')`)

- Function errors: Throw Error instances and let callers handle via try/catch blocks

- Zod validation: Catch `ZodError` specifically, map to detailed field errors

**Example error handling:**
```typescript
try {
  const body = await request.json()
  return schema.parse(body)
} catch (error) {
  if (error instanceof ZodError) {
    const errors = error.issues.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }))
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    )
  }
  // Handle other error types
}
```

## Logging

**Framework:** `console` object (no dedicated logger library)

**Patterns:**
- Prefix logs with context in brackets: `[Context]` (e.g., `[Cron]`, `[ARI]`)
- Use `console.log` for informational messages
- Use `console.error` for error messages
- Prefix error logs: `[Cron] Error: ...` or `[Service] Failed to...`

**Example logging:**
```typescript
console.log(`[Cron] Found ${appointments?.length || 0} appointments needing reminders`)
console.error('[Cron] Error:', error)
console.error(`[Cron] Failed to send reminder for ${apt._id}:`, err)
```

## Comments

**When to Comment:**
- Complex scoring logic: Document score breakdowns and calculation explanations
- Business rules: Explain why a specific threshold or rule exists
- Workarounds: Comment why a non-standard approach is used
- Non-obvious regex patterns: Explain what pattern matches

**JSDoc/TSDoc:**
- Used for exported functions with detailed purpose, parameters, and return types
- Example from `scoring.ts`:
```typescript
/**
 * Calculate lead score based on form data, documents, and engagement
 *
 * @param formAnswers - Record of form field answers
 * @param documents - Document readiness status
 * @param engagementScore - Optional engagement score (0-10), default 5
 * @returns Score (0-100), breakdown, and reasons array
 *
 * @example
 * ```ts
 * const result = calculateLeadScore(...)
 * ```
 */
```

**Section Headers:**
- Major sections use comment blocks with `=` borders for visual clarity:
```typescript
// ===========================================
// Score Breakdown Type
// ===========================================
```

## Function Design

**Size:**
- Functions typically 20-50 lines for business logic
- Longer functions (100+ lines) break into helpers (e.g., `calculateLeadScore` delegates to `isValidEmail`, `isLongTimeline`, `hasHighIelts`)

**Parameters:**
- Keep function parameters focused (1-3 main params typical)
- Use objects for multiple related parameters instead of positional args
- Provide default values where sensible (e.g., `decimals = 2` in `formatBytes`)

**Return Values:**
- Return objects for multiple related values (e.g., `{ score, breakdown, reasons }`)
- Single responsibility functions return single types
- Array methods return consistent types

**Example from codebase:**
```typescript
export function calculateLeadScore(
  formAnswers: Record<string, string>,
  documents: DocumentStatus | undefined,
  engagementScore?: number
): { score: number; breakdown: ScoreBreakdown; reasons: string[] } {
  // Implementation
}
```

## Module Design

**Exports:**
- Prefer named exports over default exports (e.g., `export function useContacts()` not `export default useContacts`)
- Export types separately: `export interface TypeName { ... }`
- Re-export commonly used items in barrel files (`export * from './utils/timezone'`)

**Barrel Files:**
- `src/lib/utils.ts` - re-exports timezone utilities and provides common utils (`cn`, `formatBytes`, `capitalize`)
- `src/lib/validations/index.ts` - re-exports Zod schemas and patterns
- `src/lib/ari/index.ts` - exports main ARI module functions

**File Organization:**
- Keep related functions in same file (e.g., `calculateLeadScore` and `getLeadTemperature` in `scoring.ts`)
- Separate concerns: scoring logic in separate file from qualification logic
- Private helpers stay in same file, not exported

## React Component Patterns

**Component Definition:**
- Use named functions not arrow functions for component definitions
- Define props interfaces before component function
- Props interface names follow `ComponentNameProps` pattern

**Example:**
```typescript
interface StatsCardsProps {
  stats: {...}
  timeFilter: 'week' | 'month' | 'all'
  onTimeFilterChange: (filter: 'week' | 'month' | 'all') => void
}

export function StatsCards({ stats, timeFilter, onTimeFilterChange }: StatsCardsProps) {
  // Implementation
}
```

**Client Components:**
- Mark interactive components with `'use client'` directive at top

**Styling:**
- Use Tailwind CSS classes in `className` attributes
- Combine classes with `cn()` utility for conditional styling
- Use class-variance-authority (cva) for component variant systems (e.g., Button variants)

## Type Safety

**TypeScript Settings:**
- Target: ES2017
- Lib: dom, dom.iterable, esnext
- Strict mode: disabled (`"strict": false`)
- JSX: react-jsx
- Module: esnext with bundler resolution

**Casting:**
- Avoid `any` types; use proper types from database or define interfaces
- Use `as` casting sparingly; prefer type narrowing
- Example of proper narrowing: `const finalEngagementScore = engagementScore !== undefined ? ... : default`

## Development Mode Patterns

**Dev Mode Check:**
```typescript
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Conditional components
{isDevMode ? <DevFallback /> : <ClerkComponent />}

// Conditional Convex queries
if (isDevMode) return MOCK_DATA
```

---

*Convention analysis: 2026-01-30*
