# Local Development Guide

## Quick Start

```bash
# Start dev server
npm run dev

# Access dashboard (fully offline)
http://localhost:3000/demo
```

## Dev Mode

Dev mode bypasses Clerk authentication. The `/demo` workspace is **fully offline** - no network calls to Convex required.

### Two Modes

| Route | Behavior |
|-------|----------|
| `/demo` | **Offline Mode** - Uses mock data, no Convex calls |
| `/eagle-overseas` | **Dev Mode** - Uses real Convex data (requires internet) |

### How Offline Mode Works

1. **Environment variable**: `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`
2. **Mock data**: `MOCK_CONVEX_WORKSPACE` in `src/lib/mock-data.ts`
3. **No network**: Server components return mock data without calling Convex
4. **Status indicator**: Footer shows "Offline Mode" (orange dot)

### Files That Handle Dev Mode

| File | What It Does |
|------|--------------|
| `src/app/providers.tsx` | Skips ClerkProvider when dev mode is on |
| `src/app/(dashboard)/[workspace]/layout.tsx` | Uses mock data for `/demo`, skips Convex |
| `src/app/(dashboard)/[workspace]/page.tsx` | Returns mock workspace for `/demo` |
| `src/app/(dashboard)/[workspace]/*/page.tsx` | All pages check `shouldUseMockData()` |
| `src/components/workspace/sidebar.tsx` | Shows DevAvatar instead of UserButton |
| `src/lib/mock-data.ts` | Contains all mock data and helper functions |
| `src/middleware.ts` | Skips auth.protect() on localhost |

### Routes Available

| Route | Mode | Description |
|-------|------|-------------|
| `/demo` | Offline | Dashboard with mock data |
| `/demo/inbox` | Offline | WhatsApp Inbox (empty) |
| `/demo/database` | Offline | Contact Database (empty) |
| `/demo/settings` | Offline | Settings (mock quick replies, tags) |

## Testing Workflow

### 1. Test UI Offline

For testing UI/layout changes without internet:

```bash
npm run dev
# Visit http://localhost:3000/demo
# Footer shows "Offline Mode" with orange dot
```

### 2. Test with Real Data

For testing with production Convex data (requires internet):

```bash
npm run dev
# Visit http://localhost:3000/eagle-overseas
# Footer shows "Dev Mode" with green dot
```

### 3. Deploy When Ready

After local testing is complete:
1. Commit changes locally (do NOT push to GitHub)
2. When ready for production, create fresh Vercel deployment
3. Production uses Clerk auth + real Convex data

## Troubleshooting

### "UserButton can only be used within ClerkProvider"

The sidebar or another component is using Clerk's UserButton without checking dev mode. Fix by wrapping with `isDevMode` check:

```tsx
import { UserButton } from '@clerk/nextjs'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// In render:
{isDevMode ? <DevAvatar /> : <UserButton />}
```

### "Production Keys are only allowed for domain..."

Clerk's production keys only work on `my21staff.com`. Dev mode should skip Clerk entirely. Check:
1. `NEXT_PUBLIC_DEV_MODE=true` is set
2. Restart dev server after changing env vars
3. Clear browser cache / hard refresh

### 404 on /demo/dashboard

The dashboard route is `/demo` not `/demo/dashboard`. Routes:
- `/demo` = Dashboard
- `/demo/inbox` = Inbox
- etc.

## Adding New Features

When adding features that use Clerk components:

1. Import the Clerk component normally
2. Add dev mode check at component level
3. Create a fallback component for dev mode

```tsx
// Example pattern
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

function MyComponent() {
  if (isDevMode) {
    return <DevFallback />
  }
  return <ClerkComponent />
}
```

---

*Last updated: 2026-01-26*
