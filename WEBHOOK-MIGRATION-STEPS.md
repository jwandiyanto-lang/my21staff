# Kapso Webhook Migration - Complete Steps

## What Was Fixed

**File:** `convex/_internal/webhook.js`

Previously: Only GET handler (for webhook verification) was present.
Now: Both GET and POST handlers are implemented.

### POST Handler Features

1. **HMAC-SHA256 Signature Verification**
   - Reads `x-kapso-signature` header
   - Uses `process.env.KAPSO_WEBHOOK_SECRET` to verify
   - Returns 401 if invalid

2. **Immediate 200 Response**
   - Returns `{ received: true }` immediately
   - Prevents Kapso from retrying

3. **Async Processing via Scheduler**
   - Uses `scheduler.runAfter(0, api.kapso.processWebhook, ...)`
   - Calls the `processWebhook` mutation that already exists in `convex/kapso.ts`
   - Payload includes full Meta webhook data and received timestamp

4. **Privacy-Logging**
   - Masks phone numbers in logs (10-15 digit numbers → "***")
   - Only logs first 500 chars of payload

## Deployment Steps (Manual Required)

Since `CONVEX_DEPLOY_KEY` is in Vercel and not accessible locally, deployment must be done in Vercel environment:

### Option A: Deploy from Vercel Build

1. Push this change to GitHub
2. Vercel will auto-deploy (git push triggers deployment)
3. In Vercel project settings, ensure Convex code is deployed as part of build

### Option B: Deploy via Vercel CLI with Convex Integration

```bash
# Get deploy key from Vercel
vercel env pull .env.local

# Source and deploy
source .env.local
npx convex deploy --yes
```

### Option C: Deploy via Vercel UI Convex Integration

1. Go to Vercel Dashboard → my21staff → Settings → Integrations
2. Add Convex integration (if available)
3. Configure webhook deployment

## After Deployment: Update Kapso Dashboard

**New Webhook URL:** `https://intent-otter-212.convex.cloud/api/webhook/kapso`

### Update Steps

1. Log in to Kapso Dashboard (https://dashboard.kapso.ai)
2. Navigate to Webhooks section
3. Find webhook pointing to old URL (Next.js `/api/webhook/kapso`)
4. Update to: `https://intent-otter-212.convex.cloud/api/webhook/kapso`
5. Save

### Verification Steps

1. Send a test WhatsApp message to Kapso-connected number
2. Check Convex dashboard → Data → messages table
3. Should see new `inbound` message created
4. Check if ARI (bot) responds if enabled for workspace

## What to Clean Up After Migration Confirmed

1. **Delete old Next.js webhook route:**
   ```bash
   rm src/app/api/webhook/kapso/route.ts
   ```

2. **Remove test route if main contacts route confirmed:**
   ```bash
   rm src/app/api/contacts/by-phone-convex/route.ts
   ```

3. **Update audit status:**
   - Mark IMPL-04 as fully complete
   - Update v3.0-MILESTONE-AUDIT.md: tech_debt → passed
   - Proceed with milestone completion

---

## Summary

| Item | Status |
|------|--------|
| POST handler code | ✅ Done in `convex/_internal/webhook.js` |
| Deployment | ⏳ Manual (requires Vercel environment) |
| Kapso URL update | ⏳ Manual |
| E2E verification | ⏳ After deployment |
| Legacy route cleanup | ⏳ After verification |
