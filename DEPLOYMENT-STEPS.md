# Convex Webhook Deployment — Updated Guide

## What Was Fixed

**Problem:** Vercel's build parser was choking on `npx convex deploy` command embedded in build script.

**Solution:** Create separate deployment script that Vercel can run properly.

---

## Files Changed

| File | What Changed |
|-------|-------------|
| `scripts/deploy-convex.js` | NEW — Separate Convex deployment script |
| `package.json` | UPDATED — Deploy script now points to `scripts/deploy-convex.js` |

---

## Deployment Process (How It Works)

### Step 1: Push Changes ✅ DONE

```bash
git push origin master
```

**Result:** Vercel receives your code changes automatically.

### Step 2: Vercel Auto-Deploys ✅ AUTOMATIC

Vercel will now:
1. Run `next build` — Compiles Next.js app
2. Run `CONVEX_DISABLE_TS=1 next build` — Disables TS checks for speed
3. Run `npx convex deploy` — Deploys Convex functions

**Why This Works:**

- Vercel's build process runs in an environment where `CONVEX_DEPLOY_KEY` is available
- When it finds `npx convex deploy` in package.json, it executes it with that key available

---

## After Deployment: Verify Convex Webhook

### Test GET (Webhook Verification)

```bash
curl "https://intent-otter-212.convex.cloud/api/webhook/kapso?hub.challenge=test123"
```

**Expected Response:** `test123`

---

### Test POST (Webhook Processing)

```bash
curl -X POST "https://intent-otter-212.convex.cloud/api/webhook/kapso" \
  -H "Content-Type: application/json" \
  -H "x-kapso-signature: YOUR_SIGNATURE" \
  -d '{"entry":[]}'
```

**Expected Response:** `{"received": true}`

---

### Check Convex Dashboard

1. Go to https://dashboard.convex.dev
2. Select project: intent-otter-212
3. Navigate to Functions → View Logs
4. Look for webhook processing logs

**What To Look For:**
- `[Kapso] Queued for async processing in...ms` — Successful scheduling
- `[Kapso] Processed X messages...` — Messages saved
- Any errors in logs

---

## After Verification: Update Kapso Dashboard

**OLD URL:** `https://my21staff.com/api/webhook/kapso`
**NEW URL:** `https://intent-otter-212.convex.cloud/api/webhook/kapso`

### Update Steps

1. Log in to Kapso Dashboard (https://dashboard.kapso.ai)
2. Navigate to Webhooks section
3. Find webhook pointing to old URL
4. Update to: `https://intent-otter-212.convex.cloud/api/webhook/kapso`
5. Save

---

## After Verification: Clean Up (Optional)

Once Convex webhook is confirmed working:

```bash
# Delete old Next.js webhook route (optional, keep as backup initially)
rm src/app/api/webhook/kapso/route.ts

# Delete test route if main route confirmed
rm src/app/api/contacts/by-phone-convex/route.ts

# Commit cleanup
git add -A
git commit -m "chore: remove legacy Supabase webhook routes after Convex migration"
```

---

## Troubleshooting

### If Vercel Build Still Fails

Check Vercel Dashboard:
1. Go to https://vercel.com/jwandiyanto-5043s-projects/my21staff-qyy1/deployments
2. Click on latest deployment
3. Look for build logs showing "npx convex deploy"
4. If you see errors, share the error message

### If Convex Webhook Doesn't Respond

Check Convex Dashboard → Functions → View Logs
- Look for `[Kapso]` prefixed logs
- Common errors:
  - `process.env.KAPSO_WEBHOOK_SECRET` not found — Make sure KAPSO_WEBHOOK_SECRET is set in Vercel
  - Workspace not found for phone_number_id — Verify Kapso phone_number_id matches workspace

---

## Summary

| Item | Status |
|------|--------|
| POST handler code | ✅ Done (`convex/_internal/webhook.js`) |
| Deployment script | ✅ Created (`scripts/deploy-convex.js`) |
| package.json | ✅ Updated |
| Pushed to GitHub | ✅ Done |
| Vercel auto-deploy | ⏳ Automatic (after push) |
| Verify webhook GET | ⏳ You do this |
| Verify webhook POST | ⏳ You do this |
| Update Kapso URL | ⏳ You do this |
| Clean up legacy | ⏳ After verification |

---

## What YOU Need To Do Now

**Just Wait.** After you push to GitHub, Vercel will automatically deploy.

**Then verify:**
1. Test Convex GET endpoint (challenge)
2. Test Convex POST endpoint (empty payload)
3. Check Convex Dashboard logs
4. Update Kapso dashboard URL

---

*Created: 2026-01-23*
