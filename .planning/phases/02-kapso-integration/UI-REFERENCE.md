# UI Design & Button Capabilities Reference

Reference document for Phase 2.1 and deployment verification.

## Inbox UI (`/[workspace]/inbox`)

**Layout:** WhatsApp-style two-panel (320px conversation list + message thread)

| Button/Control | What It Does |
|----------------|--------------|
| **Active/All Toggle** | Filters between active conversations (with unread) vs all conversations |
| **Status Filter** | Multi-select dropdown (Baru, Hot, Hangat, Dingin, Terjual, Hilang) |
| **Tags Filter** | Multi-select dropdown, dynamically populated from contacts |
| **Search Bar** | Real-time filtering by contact name/phone |
| **Send Button** | Sends composed message via Kapso API (Enter = send, Shift+Enter = newline) |

**Message Thread Features:**
- WhatsApp-style bubbles (outbound = brand color right, inbound = white left)
- Read receipts (check/double-check icons)
- Media support: images, documents, video, audio
- Auto-scroll with smart detection
- Date separators in Indonesian locale

---

## Database/Contacts UI (`/[workspace]/database`)

**Layout:** Full-width data table with toolbar

| Button/Control | What It Does |
|----------------|--------------|
| **Status Filter** | Single-select dropdown with contact counts per status |
| **Tags Filter** | Multi-select checkboxes (AND logic - must have ALL selected tags) |
| **Assigned To Filter** | Filter by team member or unassigned |
| **Column Visibility** | Toggle which columns show in table |
| **"+ Add Contact"** | Opens add contact form |

---

## Merge Button (Critical Feature)

**Location:** Database toolbar

| State | Button Text | Behavior |
|-------|-------------|----------|
| Inactive | "Merge Duplicates" | Click to enter merge mode |
| Active | "Cancel Merge" | Click to exit merge mode |

**Merge Mode Flow:**
1. Click "Merge Duplicates" → enters selection mode
2. Click 2 contacts in table to select them
3. Shows progress: "0 selected" → "1 selected" → "2 selected"
4. "Merge Selected (2)" button appears when 2 selected
5. Opens **MergeContactsDialog**

**MergeContactsDialog Fields (radio selection for each):**

| Field | Selection | Result |
|-------|-----------|--------|
| Name | Contact 1 or 2 | Keeps selected value |
| Email | Contact 1 or 2 | Keeps selected value |
| Phone | Contact 1 or 2 | Keeps selected value |
| Status | Contact 1 or 2 | Keeps selected value |
| Assigned To | Contact 1 or 2 | Keeps selected value |
| Lead Score | Contact 1 or 2 | Keeps selected value |
| **Tags** | AUTO | Combined from both (union) |
| **Metadata** | AUTO | Deep merged (contact1 precedence) |

**Backend:** POST `/api/contacts/merge` → secondary contact deleted after merge

---

## Contact Detail Sheet (Side Panel)

| Button/Control | What It Does |
|----------------|--------------|
| **"View conversations"** | Links to inbox filtered by this contact |
| **"+ Add note"** | Opens note dialog with optional due date |
| **Inline edit (Name/Phone/Email)** | Click pencil → edit inline → save/cancel |
| **Status Dropdown** | Change lead status (color-coded) |
| **Lead Score Slider** | 0-100 manual score adjustment |
| **Assigned To Dropdown** | Reassign to team member |
| **Tags Checkboxes** | Toggle tags on/off |

---

## Dashboard Quick Actions

| Button | Destination |
|--------|-------------|
| **"+ Add Contact"** | `/{workspace}/database?action=add` |
| **"Inbox"** | `/{workspace}/inbox` |
| **"Database"** | `/{workspace}/database` |

---

## Lead Status Colors

| Status | Indonesian | Color |
|--------|------------|-------|
| All | Semua | Gray |
| New | Baru | Blue |
| Hot | Hot | Red |
| Warm | Hangat | Orange |
| Cold | Dingin | Cyan |
| Sold | Terjual | Green |
| Lost | Hilang | Gray |

---

## Key Implementation Notes

1. **No merge in Inbox** — merge is database-only feature
2. **No bulk actions** — single operations only
3. **Filters persist** — saved to localStorage
4. **Real-time updates** — Convex subscriptions for live data

---

*Created: 2026-01-25*
*Phase: 02-kapso-integration*
