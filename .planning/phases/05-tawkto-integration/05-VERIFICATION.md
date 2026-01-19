---
phase: 05-central-support-hub
verified: 2026-01-19T12:00:00Z
status: passed
score: 9/9 must-haves verified
---

# Phase 5: Central Support Hub Verification Report

**Phase Goal:** All client support flows to my21staff workspace for centralized handling
**Verified:** 2026-01-19
**Status:** PASSED
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tickets can have admin_workspace_id for routing | VERIFIED | Migration 28 adds column, types.ts includes field, portal API uses ADMIN_WORKSPACE_ID |
| 2 | Comments can be marked as internal (hidden from clients) | VERIFIED | Migration 28 adds is_internal column, types.ts includes field, admin UI has checkbox, portal API filters internal |
| 3 | Storage bucket exists for ticket attachments | VERIFIED | Migration 29 creates bucket with RLS, storage helper exports upload/delete functions |
| 4 | Client can create tickets that route to admin workspace | VERIFIED | Portal API POST sets admin_workspace_id = ADMIN_WORKSPACE_ID constant |
| 5 | Client can view only their own tickets | VERIFIED | Portal API filters by requester_id = user.id |
| 6 | Admin workspace sees all tickets routed to it | VERIFIED | Support page.tsx fetches both internal (workspace_id) and client (admin_workspace_id) tickets |
| 7 | Admin can add internal notes hidden from clients | VERIFIED | ticket-detail-client.tsx has is_internal checkbox (lines 573-586), API checks role before allowing |
| 8 | Client can access portal at /portal/support | VERIFIED | Portal layout, support/page.tsx, support/new/page.tsx, support/[id]/page.tsx all exist and are substantive |
| 9 | Tawk.to widget available on portal (optional) | VERIFIED | tawk-chat.tsx exists (95 lines), gracefully handles missing config, integrated in portal layout |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Lines | Details |
|----------|----------|--------|-------|---------|
| `supabase/migrations/28_central_support_hub.sql` | admin_workspace_id, is_internal columns, RLS | VERIFIED | 90 | Columns and 8 RLS policies created |
| `supabase/migrations/29_ticket_attachments_storage.sql` | Storage bucket with RLS | VERIFIED | 47 | ticket-attachments bucket, 3 RLS policies |
| `src/lib/config/support.ts` | ADMIN_WORKSPACE_ID, isAdminWorkspace, isClientTicket | VERIFIED | 26 | All exports present |
| `src/lib/tickets/types.ts` | admin_workspace_id, is_internal fields | VERIFIED | 50 | Ticket and TicketComment interfaces updated |
| `src/lib/storage/ticket-attachments.ts` | uploadTicketAttachment, deleteTicketAttachment | VERIFIED | 66 | Full upload/delete implementation |
| `src/app/api/tickets/[id]/attachments/route.ts` | POST endpoint | VERIFIED | 89 | Full implementation with validation |
| `src/app/api/portal/tickets/route.ts` | GET, POST | VERIFIED | 123 | Lists user tickets, creates with ADMIN_WORKSPACE_ID |
| `src/app/api/portal/tickets/[id]/route.ts` | GET | VERIFIED | 45 | Returns ticket detail (own only) |
| `src/app/api/portal/tickets/[id]/comments/route.ts` | GET, POST | VERIFIED | 122 | Filters internal, creates public only |
| `src/app/(dashboard)/[workspace]/support/page.tsx` | Admin ticket list | VERIFIED | 82 | Fetches both internal and client tickets |
| `src/app/(dashboard)/[workspace]/support/support-client.tsx` | Source filter, client badge | VERIFIED | 294 | sourceFilters tabs, isClientTicket badge |
| `src/app/(dashboard)/[workspace]/support/[id]/page.tsx` | Admin ticket detail | VERIFIED | 123 | Access check for both workspace and admin_workspace |
| `src/app/(dashboard)/[workspace]/support/[id]/ticket-detail-client.tsx` | Internal comment toggle | VERIFIED | 712 | is_internal checkbox, amber styling for internal notes |
| `src/app/portal/layout.tsx` | Portal layout with TawkChat | VERIFIED | 41 | Auth check, PortalHeader, TawkChat components |
| `src/app/portal/support/page.tsx` | Client ticket list | VERIFIED | 63 | Queries user's tickets, renders TicketCard |
| `src/app/portal/support/new/page.tsx` | Ticket creation form | VERIFIED | 150 | Form with title, description, category, priority |
| `src/app/portal/support/[id]/page.tsx` | Client ticket detail | VERIFIED | 51 | Fetches ticket and public comments |
| `src/app/portal/support/[id]/portal-ticket-detail.tsx` | Detail with image upload | VERIFIED | 240 | ImageUpload component, comment form |
| `src/components/portal/portal-header.tsx` | Portal header | VERIFIED | 63 | Logo, user dropdown, logout |
| `src/components/portal/ticket-card.tsx` | Ticket card | VERIFIED | 46 | Stage/priority badges, link to detail |
| `src/components/portal/image-upload.tsx` | Image upload | VERIFIED | 114 | File input, upload to API, display images |
| `src/components/tawk-chat.tsx` | Tawk.to wrapper | VERIFIED | 95 | Script injection, graceful fallback, TypeScript types |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/app/api/portal/tickets/route.ts` | `ADMIN_WORKSPACE_ID` | import from config/support | WIRED | Line 3: import, Line 94: admin_workspace_id assignment |
| `src/app/(dashboard)/[workspace]/support/page.tsx` | tickets table | Supabase query | WIRED | Lines 45-66: two queries for internal and client tickets |
| `src/app/(dashboard)/[workspace]/support/[id]/ticket-detail-client.tsx` | API comments | fetch with is_internal | WIRED | Line 168: sends is_internal in JSON body |
| `src/app/portal/support/new/page.tsx` | `/api/portal/tickets` | fetch POST | WIRED | Line 41: POST to /api/portal/tickets |
| `src/app/portal/support/[id]/page.tsx` | comments filter | Supabase query | WIRED | Line 41: .or('is_internal.is.null,is_internal.eq.false') |
| `src/app/portal/layout.tsx` | TawkChat | import and render | WIRED | Line 4: import, Line 35: <TawkChat ... /> |
| `src/components/portal/image-upload.tsx` | attachments API | fetch POST | WIRED | Line 32: fetch to /api/tickets/${ticketId}/attachments |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | No blockers or warnings found |

### Human Verification Required

#### 1. Portal Ticket Creation Flow
**Test:** As a client user, navigate to /portal/support/new, create a ticket
**Expected:** Ticket created with admin_workspace_id set, visible in my21staff admin support page
**Why human:** Full end-to-end flow including database state

#### 2. Internal Comment Visibility
**Test:** As admin, add internal note on client ticket. As client, view same ticket in portal
**Expected:** Client does NOT see internal note, admin sees it with amber styling
**Why human:** Cross-user visibility verification

#### 3. Image Upload on Portal
**Test:** In portal ticket detail, click Add Image, upload an image, submit comment
**Expected:** Image uploaded to Supabase storage, markdown embedded in comment, image displays
**Why human:** File upload behavior, visual display

#### 4. Source Filter in Admin
**Test:** In admin support page, click Internal/Client/All tabs
**Expected:** Correct filtering, client tickets show source workspace name
**Why human:** UI interaction and visual verification

#### 5. Tawk.to Widget (if configured)
**Test:** Set NEXT_PUBLIC_TAWK_PROPERTY_ID and NEXT_PUBLIC_TAWK_WIDGET_ID, visit /portal/support
**Expected:** Tawk.to chat widget appears in bottom-right corner
**Why human:** External service integration

### Summary

Phase 5 (Central Support Hub) is **VERIFIED**. All 9 observable truths pass verification:

1. **Database Schema:** Migration 28 adds admin_workspace_id and is_internal columns with comprehensive RLS policies for cross-workspace access
2. **Storage:** Migration 29 creates ticket-attachments bucket with proper file type and size limits
3. **TypeScript:** Types and config updated with new fields and ADMIN_WORKSPACE_ID constant
4. **Portal API:** Three routes handle client ticket creation, listing, and comments with proper filtering
5. **Admin UI:** Support page fetches both internal and client tickets, shows source filter and badges
6. **Client Portal:** Full UI with layout, header, ticket list, creation form, and detail with image upload
7. **Tawk.to:** Optional live chat widget with graceful fallback when not configured

The implementation correctly routes client tickets to the admin workspace, hides internal comments from clients, and provides separate UIs for clients (simplified) and admins (full control).

---

*Verified: 2026-01-19*
*Verifier: Claude (gsd-verifier)*
