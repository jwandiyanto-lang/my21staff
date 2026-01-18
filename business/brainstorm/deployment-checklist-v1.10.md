# Deployment Checklist: v1.5 → v1.10

Summary of changes from Phases 13, 19, and 20 for Vercel deployment verification.

---

## Phase 13: Lead Management Enhancement (v1.5)

| Feature | Description | How to Verify |
|---------|-------------|---------------|
| Contact Update API | PATCH endpoint for status, score, tags | Open lead → change status |
| Status Dropdown | Change lead pipeline stage in UI | Click status badge |
| Lead Score Slider | Manual adjustment of lead scores | Open lead → adjust slider |
| Tag Management | Add/remove tags on contacts | Open lead → add tag |
| Messages Tab | Conversation data in lead detail | Open lead → Messages tab |
| AI Handover Toggle | Pause/resume Kapso AI per conversation | Inbox → toggle AI switch |

---

## Phase 19: Performance & Security (v1.9)

### 19-01: Authorization Fixes

| Change | File | How to Verify |
|--------|------|---------------|
| `requireWorkspaceMembership` helper | `src/lib/auth/workspace-auth.ts` | Try accessing other workspace → should fail |
| Fixed assign route | `/api/conversations/[id]/assign` | Assign conversation → works |
| Fixed settings route | `/api/workspaces/[id]/settings` | Save settings → works |
| DEV_MODE safeguard | Blocked in production | DEV_MODE should have no effect |

### 19-02: Rate Limiting

| Endpoint | Limit | How to Verify |
|----------|-------|---------------|
| `/api/webinars/register` | 10/min per IP | Submit form 11x → should get 429 |
| `/api/messages/send` | 30/min per user | Send 31 messages fast → should get 429 |
| `/api/messages/send-media` | 10/min per user | Send 11 media → should get 429 |

### 19-04: PII Logging Cleanup

| Change | How to Verify |
|--------|---------------|
| Phone masking in webhook logs | Check Vercel logs → no full phone numbers |
| Removed phone from merge logs | Merge contacts → no phone in logs |

### 19-05: Build & Caching

| Change | How to Verify |
|--------|---------------|
| Cache-Control on articles | `curl -I /api/articles/[id]` → check headers |
| 0 vulnerabilities | `npm audit` passes |

### 19-06: Webhook Signature Verification

| Change | How to Verify |
|--------|---------------|
| HMAC-SHA256 verification | Invalid signature → 401 response |
| Requires `KAPSO_WEBHOOK_SECRET` | Set in Vercel env vars |

### 19-07: Security Headers

| Header | Expected Value |
|--------|----------------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

**Verify:** `curl -I https://your-domain.vercel.app` → check response headers

### 19-08: API Key Encryption

| Change | How to Verify |
|--------|---------------|
| AES-256-GCM encryption | Save new API key → stored encrypted in DB |
| Backward compatible | Old plain-text keys still work |
| Requires `ENCRYPTION_KEY` | Set in Vercel env vars |

---

## Phase 20: Dashboard & Notes (v1.10)

| Feature | Description | How to Verify |
|---------|-------------|---------------|
| Dashboard page | Client stats (total, today, week, month) | Go to /dashboard |
| Tag analytics | 1on1 consultation count | Check orange count cards |
| Notes due dates | `due_date` column | Add note with due date |
| Calendar picker | Due date UI with popover | Click calendar icon |
| Task view | Upcoming tasks section | Dashboard → see tasks |

---

## Environment Variables Required

Add these to Vercel if not already set:

```env
# Webhook security (Phase 19-06)
KAPSO_WEBHOOK_SECRET=<from-kapso-dashboard>

# API key encryption (Phase 19-08)
ENCRYPTION_KEY=<generate with: openssl rand -hex 32>
```

---

## Database Migration

Phase 20 added migration 16 for `due_date` column on notes table.

**Check:** Run in Supabase SQL editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'notes' AND column_name = 'due_date';
```

---

## Quick Verification Flow

1. [ ] Site loads without errors
2. [ ] Login works
3. [ ] Dashboard shows stats
4. [ ] Lead detail sheet opens
5. [ ] Can change lead status
6. [ ] Can add/remove tags
7. [ ] Messages tab shows data
8. [ ] Notes have due date picker
9. [ ] Security headers present (curl -I)
10. [ ] Rate limiting works (test with rapid requests)

---

*Created: 2026-01-17*
