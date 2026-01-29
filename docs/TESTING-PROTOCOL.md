# Testing Protocol - MANDATORY

## ⚠️ CRITICAL RULE: Always Test Against Real Database

**Before making ANY bug fix or feature:**

1. **Disable Dev Mode**
   ```bash
   # In .env.local, set:
   NEXT_PUBLIC_DEV_MODE=false
   ```

2. **Restart Dev Server**
   ```bash
   npm run dev
   ```

3. **Test on Localhost** (http://localhost:3000/eagle-overseas/*)
   - Database page - CRUD operations
   - Inbox page - Filters, activities
   - Settings page - All tabs

4. **Verify Fix Works** on localhost with REAL database

5. **ONLY THEN Deploy** to production

---

## Why This Matters

| Mode | Data Source | Database Operations |
|------|-------------|---------------------|
| `DEV_MODE=true` | Mock data (fake) | No real mutations |
| `DEV_MODE=false` | Real Convex | Real mutations |
| Production | Real Convex | Real mutations |

**If you test with `DEV_MODE=true`, you're testing fake data that doesn't touch the real database!**

---

## When to Use Dev Mode

**ONLY use `DEV_MODE=true` for:**
- ✅ Testing UI components visually
- ✅ Working on layouts/styling
- ✅ Offline development (no internet)

**NEVER use `DEV_MODE=true` for:**
- ❌ Testing database operations
- ❌ Testing mutations (create, update, delete)
- ❌ Testing real workflows
- ❌ Bug fixes
- ❌ Verifying production issues

---

## Deployment Checklist

Before pushing to GitHub:

- [ ] `NEXT_PUBLIC_DEV_MODE=false` in .env.local
- [ ] Tested on localhost with REAL database
- [ ] All fixes verified working
- [ ] No console errors
- [ ] Database operations work (status toggle, tags, filters)
- [ ] `npm run build` passes locally
- [ ] Convex functions deployed (`npm run deploy`)

**If ANY checkbox is unchecked, DO NOT DEPLOY!**

---

## Sync Verification

After deployment, verify sync:

```bash
# 1. Check commits match
git log -1 --oneline  # Local
git log origin/master -1 --oneline  # Remote (what Vercel deploys)

# 2. Check Convex deployment
# Both should show same functions
```

If commits don't match → Push to GitHub
If Convex functions don't match → Run `npm run deploy`

---

*Last updated: 2026-01-29*
