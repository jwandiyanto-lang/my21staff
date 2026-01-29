# Development Rules

## ⚠️ CRITICAL: User Initialization Required

**ALWAYS ensure users exist before running Convex queries.**

### The Problem

Convex queries that use `requireWorkspaceMembership` will fail if the user document doesn't exist in the database. This happens when:
- Clerk webhooks aren't set up
- User signs in for the first time
- Webhook processing is delayed

### The Solution

**Use the `useEnsureUser` hook in ALL client components that use Convex queries:**

```tsx
import { useEnsureUser } from '@/hooks/use-ensure-user'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export function MyComponent() {
  // STEP 1: Ensure user exists BEFORE running queries
  const userInitialized = useEnsureUser()

  // STEP 2: Skip queries until user is initialized
  const data = useQuery(
    api.something.get,
    !userInitialized ? 'skip' : { workspace_id }
  )

  // Rest of component...
}
```

### Why This Works

1. `useEnsureUser()` calls `api.users.ensureCurrentUser` mutation
2. Mutation auto-creates user if they don't exist
3. Returns `true` when user is guaranteed to exist
4. Queries skip until `userInitialized` is `true`
5. No more race conditions!

### Files That Already Use This Pattern

- ✅ `src/app/(dashboard)/[workspace]/settings/settings-client.tsx`
- ✅ `src/app/(dashboard)/[workspace]/dashboard-client.tsx`
- ✅ `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`

### When Adding New Pages

If your page uses `useQuery` with workspace-scoped data:
1. Import `useEnsureUser` hook
2. Call it at the top of your component
3. Skip queries until `userInitialized` is `true`

**Failure to do this will cause "Server Error" on production!**

---

## ⚠️ CRITICAL: Database as Single Source of Truth

**THE DATABASE IS THE SOURCE OF EVERYTHING.**

All data displayed in the application MUST originate from the Database page/API. No other page should create or store its own data.

### Architecture Rule

```
Database (Contact List)
    ↓
    ├── Dashboard (reads from Database, displays stats/summaries)
    ├── Inbox (reads from Database, shows conversations)
    └── Any future feature (reads from Database)
```

### Implementation Requirements

1. **Dashboard Page**
   - ✅ MUST read contacts from Database API
   - ❌ MUST NOT have its own contact storage
   - ✅ MUST calculate stats from Database data
   - Example: Total contacts, status breakdown, recent activity

2. **Inbox Page**
   - ✅ MUST read conversations linked to Database contacts
   - ❌ MUST NOT create standalone conversations
   - ✅ MUST sync conversation data with Database contact records
   - Example: Message history tied to contact.id

3. **Future Features**
   - ✅ MUST query Database API for contact data
   - ❌ MUST NOT duplicate contact information
   - ✅ MUST update Database when contact data changes
   - Example: Reports, analytics, exports all source from Database

### Why This Matters

- **Single source of truth** - No data inconsistencies
- **Easier maintenance** - Update data in one place
- **Better UX** - Changes instantly reflect everywhere
- **Simpler debugging** - One place to check data issues

### Before Adding New Features

Ask yourself:
1. "Does this feature need contact data?" → Use Database API
2. "Should this data appear in Database?" → Yes, store it there
3. "Can users manage this in Database?" → Make it editable in Database

**NEVER create parallel data stores.** If Dashboard or Inbox needs new data, add it to the Database schema first.

---

## Code Quality Checks

### Before Committing Code

Always run these checks before committing:

```bash
npm run lint          # Check for linting errors
npm run type-check    # Check for TypeScript errors
npm run pre-commit    # Run both checks at once
```

### Automatic Error Prevention

ESLint is configured to catch common errors automatically:

1. **Variable Use Before Definition** - The error you just experienced
   - ❌ BAD: Using a variable before it's declared
   - ✅ GOOD: Declare variables before using them

```typescript
// ❌ BAD - Will cause runtime error
const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE)

const filteredContacts = useMemo(() => {
  return contacts.filter(...)
}, [contacts])

// ✅ GOOD - Declare first, use later
const filteredContacts = useMemo(() => {
  return contacts.filter(...)
}, [contacts])

const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE)
```

2. **Hydration Mismatches** - Server/client HTML differences
   - ❌ BAD: Reading localStorage directly in state initializer
   - ✅ GOOD: Use `typeof window !== 'undefined'` check

```typescript
// ❌ BAD - Causes hydration mismatch
const [value, setValue] = useState(() => loadFromStorage())

// ✅ GOOD - Server and client render same initial state
const [value, setValue] = useState(() =>
  typeof window !== 'undefined' ? loadFromStorage() : defaultValue
)
```

## ESLint Rules Enforced

Current ESLint configuration enforces:

- `@typescript-eslint/no-use-before-define` - Catch variable ordering issues
- `@typescript-eslint/no-explicit-any` - Avoid unsafe `any` types
- `react-hooks/rules-of-hooks` - Enforce React hooks rules
- `react-hooks/exhaustive-deps` - Catch missing dependencies

## Git Workflow

### Recommended Pre-Commit Flow

```bash
# 1. Test your changes locally
npm run dev
# Visit http://localhost:3000/demo and test all pages

# 2. Run linting and type checks
npm run pre-commit

# 3. Fix any errors before committing
npm run lint:fix  # Auto-fix some issues
```

### Before Pushing to Production

**IMPORTANT:** Test on localhost first!

```bash
# 1. Ensure dev mode is enabled
cat .env.local | grep DEV_MODE
# Must show: NEXT_PUBLIC_DEV_MODE=true

# 2. Test ALL pages work without errors:
http://localhost:3000/demo           # Dashboard
http://localhost:3000/demo/inbox     # Inbox
http://localhost:3000/demo/database  # Database
http://localhost:3000/demo/settings  # Settings
```

## Common Errors and Solutions

### "Cannot access before initialization"

**Cause:** Using a variable before it's declared.

**Solution:** Move the variable declaration above where it's used.

### "Hydration mismatch"

**Cause:** Server-rendered HTML doesn't match client-rendered HTML.

**Solutions:**
- Use `typeof window !== 'undefined'` for browser-only code
- Don't use `Date.now()` or `Math.random()` in render
- Don't read from localStorage during initial render without SSR check

### "Clerk: Production Keys are only allowed for domain X"

**Cause:** Using production Clerk keys on localhost.

**Solution:** Comment out Clerk keys in `.env.local` when `NEXT_PUBLIC_DEV_MODE=true`

```bash
# Dev mode: Comment out keys so Clerk won't initialize
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
# CLERK_SECRET_KEY="sk_live_..."
```

## VSCode Integration (Recommended)

Install the ESLint extension for real-time error detection:

1. Install "ESLint" extension by Microsoft
2. Errors will show inline in your editor
3. Auto-fix on save (optional)

Add to `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

**Last Updated:** 2026-01-28
**Reason:** Added rules after "Cannot access filteredContacts before initialization" bug
