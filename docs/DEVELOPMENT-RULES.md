# Development Rules

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
