# Consolidated Verification Checklist (Phases 1-4)

**Instructions:** After deployment, verify the following features work end-to-end.

**URL:** https://my21staff.vercel.app (after push)

---

## Phase 1: Contact Database

### 1.1 Contact List
- [ ] Navigate to `/eagle-overseas/database`
- [ ] Page loads with contact list
- [ ] Status filter dropdown works (All, New, Hot, Warm, Cold, Converted, Lost)
- [ ] Tag filter shows available tags
- [ ] Assignee filter works

### 1.2 Contact Detail Modal
- [ ] Click a contact row → detail modal opens
- [ ] 4 tabs visible: Profile, Documents, Conversations, Notes
- [ ] **Profile tab**: Edit name, email, phone, status fields
- [ ] **Notes tab**: Add a new note with due date
- [ ] Close modal → changes persist on refresh

### 1.3 Contact Merge
- [ ] Select 2 contacts using checkboxes
- [ ] "Merge" button appears
- [ ] Click Merge → field selection dialog opens
- [ ] Select values for each field (name, email, phone, status)
- [ ] Confirm merge → secondary contact deleted, primary updated

---

## Phase 1.2: n8n Sync

- [ ] Contact Database count matches Google Sheets leads (~same number)
- [ ] (Already verified: webhook endpoint creates contacts)

---

## Phase 2: Inbox (WhatsApp)

### 2.1 Conversation List
- [ ] Navigate to `/eagle-overseas/inbox`
- [ ] Conversation list loads on left panel
- [ ] Status filter chips work (All, New, Hot, Warm, Cold, Converted, Lost)
- [ ] Tag filter chips appear if tags exist

### 2.2 Message Thread
- [ ] Click a conversation → message thread displays on right panel
- [ ] Messages show with correct sender alignment (inbound left, outbound right)
- [ ] Date separators visible (Today, Yesterday, or date)
- [ ] Message timestamps visible

### 2.3 Send Message
- [ ] Type a message in compose input
- [ ] Press Enter → message sends
- [ ] Message appears in thread
- [ ] Shift+Enter adds new line (doesn't send)

---

## Phase 3: Dashboard

### 3.1 Stats Cards
- [ ] Navigate to `/eagle-overseas` (dashboard)
- [ ] Stats cards show: Total Contacts, Conversations, Hot Leads, Cold Leads
- [ ] Time filter works: 7 Days, 30 Days, All

### 3.2 Quick Actions
- [ ] "Add Contact" button → navigates to `/database?action=add`
- [ ] "Inbox" button → navigates to `/inbox`
- [ ] "Database" button → navigates to `/database`

### 3.3 Activity Feed
- [ ] Activity feed shows recent contact notes
- [ ] Click activity item → navigates to `/database?contact={id}`
- [ ] Relative timestamps display (e.g., "2 hours ago")

### 3.4 Onboarding Checklist
- [ ] If not all steps complete, checklist appears
- [ ] Steps show: Connect WhatsApp, Add Contacts, Start Conversation
- [ ] Completed steps show green checkmark
- [ ] Auto-hides when all complete

---

## Phase 4: Settings

### 4.1 Settings Page
- [ ] Navigate to `/eagle-overseas/settings`
- [ ] Page loads with 4 tabs visible

### 4.2 Integrations Tab
- [ ] WhatsApp Business connection status visible
- [ ] Phone ID and API Key fields editable
- [ ] Save button works (shows confirmation)

### 4.3 Quick Replies Tab
- [ ] Quick replies list visible
- [ ] Add new quick reply (label + message)
- [ ] Edit existing quick reply
- [ ] Delete quick reply

### 4.4 Tags Tab
- [ ] Tags list visible
- [ ] Add new tag
- [ ] Delete tag

### 4.5 Data Tab
- [ ] "Download Contacts" → CSV file downloads
- [ ] "Download Notes" → CSV file downloads

### 4.6 Team Management Link
- [ ] "Manage Team" button visible in header
- [ ] Click → navigates to `/eagle-overseas/team`
- [ ] Team page shows organization members (Clerk OrganizationProfile)

---

## Verification Complete

After testing, report results:
- **All passed**: Type "verified"
- **Issues found**: Describe each issue for gap closure planning

---

*Generated: 2026-01-24*
