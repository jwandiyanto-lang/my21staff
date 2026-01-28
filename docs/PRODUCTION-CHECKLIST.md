# Production Deployment Checklist

**CRITICAL:** Ensure all offline (dev mode) features have production connections before deploying.

---

## Architecture Overview

```
Frontend (Next.js) → API Routes → Convex (Database)
       ↑                              ↓
    Clerk Auth ←→ ConvexProviderWithClerk
```

- **Authentication:** Clerk handles auth on frontend, Convex uses `ConvexProviderWithClerk`
- **Database:** Convex is the single source of truth
- **Dev Mode:** `NEXT_PUBLIC_DEV_MODE=true` uses mock data for offline testing

---

## Feature Status Matrix

### Inbox Features

| Feature | Dev Mode | Production | Convex Function | API Route | Status |
|---------|----------|------------|-----------------|-----------|--------|
| Load Conversations | MOCK_INBOX_DATA | Convex query | `api.conversations.listWithFilters` | Via Convex | ✅ |
| Filter by Status | Client-side | Convex query | `api.conversations.listWithFilters` | Via Convex | ✅ |
| Filter by Tags | Client-side | Convex query | `api.conversations.listWithFilters` | Via Convex | ✅ |
| Filter by Assignment | Client-side | Convex query | `api.conversations.listWithFilters` | Via Convex | ✅ |
| Mark as Read | Skipped | Convex mutation | `api.conversations.markAsRead` | `/api/conversations/[id]/read` | ✅ |
| Toggle AI/Human | Mock status | Convex mutation | `api.conversations.updateConversationStatus` | `/api/conversations/[id]/handover` | ✅ |
| Send Message | Mock | Kapso API | - | `/api/messages/send` | ✅ |

### Contact Sidebar Features

| Feature | Dev Mode | Production | Convex Function | API Route | Status |
|---------|----------|------------|-----------------|-----------|--------|
| Load Activities | Dummy data for Budi | API fetch | `api.contactNotes.getByContact` | `/api/contacts/[id]/notes` | ✅ |
| Load Messages | Skipped | API fetch | `api.messages.listByConversation` | `/api/contacts/[id]/messages` | ✅ |
| Add Note | Uses API | Uses API | `api.contactNotes.create` | `/api/contacts/[id]/notes` (POST) | ✅ |
| Edit Contact | Mock success | Uses API | `api.mutations.updateContactInternal` | `/api/contacts/[id]` (PATCH) | ✅ |
| Change Status | Uses API | Uses API | `api.mutations.updateContactInternal` | `/api/contacts/[id]` (PATCH) | ✅ |
| Lead Score (Form) | Calculated | Calculated | - | - | ✅ |
| Lead Score (Chat) | Hardcoded 47 | Should be calculated | - | - | ⚠️ TODO |

### Merge Features

| Feature | Dev Mode | Production | Convex Function | API Route | Status |
|---------|----------|------------|-----------------|-----------|--------|
| Search Contacts | MOCK_CONTACTS | API search | `api.contacts.listByWorkspaceInternal` | `/api/contacts?search=` | ✅ |
| Merge Contacts | Uses API | Uses API | `api.contacts.mergeContacts` | `/api/contacts/merge` | ✅ |

### Database Features

| Feature | Dev Mode | Production | Convex Function | API Route | Status |
|---------|----------|------------|-----------------|-----------|--------|
| List Contacts | MOCK_CONTACTS | API fetch | `api.contacts.listByWorkspaceInternal` | `/api/contacts` | ✅ |
| Create Contact | Mock success | Uses API | `api.contacts.create` | `/api/contacts` (POST) | ✅ |
| Update Contact | Mock success | Uses API | `api.mutations.updateContactInternal` | `/api/contacts/[id]` (PATCH) | ✅ |
| Delete Contact | Mock success | Uses API | `api.mutations.deleteContactCascade` | `/api/contacts/[id]` (DELETE) | ✅ |

---

## Dev Mode Checks in Code

### Files with `NEXT_PUBLIC_DEV_MODE` checks:

1. **`src/components/contact/info-sidebar.tsx`**
   - Line ~152: Activities loading (skips API calls in dev)
   - Production: Fetches from `/api/contacts/[id]/notes` and `/api/contacts/[id]/messages`

2. **`src/components/contact/merge-contact-flow.tsx`**
   - Line ~80: Contact search (uses MOCK_CONTACTS in dev)
   - Production: Searches via `/api/contacts?search=`

3. **`src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`**
   - Line ~148: Conversation loading (uses MOCK_INBOX_DATA in dev)
   - Line ~300: Mark as read (skipped in dev)
   - Production: Uses Convex query `api.conversations.listWithFilters`

4. **`src/app/api/contacts/route.ts`**
   - Dev mode returns MOCK_CONTACTS
   - Production: Uses Convex query

5. **`src/app/providers.tsx`**
   - Dev mode skips ClerkProvider
   - Production: Uses ConvexProviderWithClerk

---

## API Routes Summary

All API routes are production-ready with Convex integration:

### Contacts
- `GET /api/contacts` → `api.contacts.listByWorkspaceInternal` (supports `?search=` param)
- `POST /api/contacts` → `api.contacts.create`
- `PATCH /api/contacts/[id]` → `api.mutations.updateContactInternal`
- `DELETE /api/contacts/[id]` → `api.mutations.deleteContactCascade`
- `POST /api/contacts/merge` → `api.contacts.mergeContacts`

### Contact Notes
- `GET /api/contacts/[id]/notes` → `api.contactNotes.getByContact`
- `POST /api/contacts/[id]/notes` → `api.contactNotes.create`

### Contact Messages
- `GET /api/contacts/[id]/messages` → `api.messages.listByConversation`

### Conversations
- `GET /api/conversations` → `api.conversations.listWithFiltersInternal`
- `POST /api/conversations/[id]/handover` → `api.conversations.updateConversationStatus`
- `POST /api/conversations/[id]/read` → `api.conversations.markAsRead`
- `POST /api/conversations/[id]/assign` → `api.conversations.assignConversation`

### Messages
- `POST /api/messages/send` → Kapso API → Convex

---

## Pre-Deployment Checklist

### Environment Variables Required

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Kapso (WhatsApp)
KAPSO_API_KEY=...
KAPSO_API_URL=...

# IMPORTANT: Remove or set to false
NEXT_PUBLIC_DEV_MODE=false
```

### Verification Steps

1. [ ] **Remove dev mode** - Set `NEXT_PUBLIC_DEV_MODE=false` or remove from production
2. [ ] **Verify Convex** - Ensure Convex is deployed and accessible
3. [ ] **Verify Clerk** - Ensure Clerk keys are for production environment
4. [ ] **Verify Clerk JWT template** - **CRITICAL:** Ensure org_id claim is included (see below)
5. [ ] **Test auth flow** - Login should work end-to-end
6. [ ] **Test inbox** - Conversations should load from database
7. [ ] **Test contact sidebar** - Activities should load via API
8. [ ] **Test add note** - Notes should save to database
9. [ ] **Test merge** - Merge should update database correctly
10. [ ] **Test status change** - AI/Human toggle should persist

---

## Clerk JWT Template Configuration (CRITICAL)

**IMPORTANT:** Before deploying to production, you MUST verify the Clerk JWT template includes the `org_id` claim.

### Why This Matters

Convex uses `ConvexProviderWithClerk` which requires JWT tokens to include organization ID for workspace-scoped queries.

**Without the org_id claim:**
- User can authenticate successfully ✅
- Dashboard loads but shows NO data ❌
- Convex queries return empty results ❌
- No error messages (silent failure) ❌

### How to Verify

1. Visit **Clerk Dashboard** → **Configure** → **Sessions** → **JWT Templates**
2. Find or create a template named **"convex"**
3. Verify the claims section includes:
   ```json
   {
     "org_id": "{{org.id}}"
   }
   ```
4. Save the template

### Cannot Be Automated

This verification requires manual access to the Clerk dashboard. It cannot be checked programmatically during build or deployment.

---

## Known Limitations

1. **Chat Score** - Currently hardcoded to 47. Real implementation requires ARI conversation scoring.
2. **Real-time updates** - Convex provides real-time, but some features use polling/refetch.

---

## Offline → Online Feature Mapping

| Offline (Dev Mode) | Online (Production) |
|--------------------|---------------------|
| `MOCK_CONTACTS` | `/api/contacts` → Convex |
| `MOCK_INBOX_DATA` | `useQuery(api.conversations.listWithFilters)` |
| `MOCK_MESSAGES` | `/api/contacts/[id]/messages` → Convex |
| Dummy activities for Budi | `/api/contacts/[id]/notes` → Convex |
| Skip markAsRead | `api.conversations.markAsRead` mutation |
| Skip handover API | `/api/conversations/[id]/handover` → Convex |

---

---

## Production Readiness: ✅ READY

All features implemented during Phase 1 have been verified to have complete Convex integration:

| Feature | Dev Mode | Production | Status |
|---------|----------|------------|--------|
| Inbox conversations | Mock data | Convex query | ✅ |
| Mark as read | Skipped | Convex mutation | ✅ |
| Toggle AI/Human | Mock status | API → Convex | ✅ |
| Load activities | Dummy for Budi | API → Convex | ✅ |
| Add notes | API call | API → Convex | ✅ |
| Edit contact | Mock success | API → Convex | ✅ |
| Change status | API call | API → Convex | ✅ |
| Merge contacts | Mock search | API → Convex | ✅ |
| Search contacts | Mock filter | API → Convex | ✅ |

**Key:** When `NEXT_PUBLIC_DEV_MODE=false`, all features use real Convex database.

---

**Last Updated:** Phase 1 v3.5 - Localhost Polish (Completed)
