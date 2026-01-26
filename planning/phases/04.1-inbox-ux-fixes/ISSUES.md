# Phase 4.1: Inbox UX Fixes

Issues identified from UAT testing on 2026-01-26.

---

## Critical (Major)

### 1. Message Sending Not Working
**Test:** 8
**Location:** Compose area in inbox
**Issue:** UI works (enter/shift+enter/auto-expand) but messages don't actually send
**Expected:** Messages should send via Kapso API and appear in thread

---

## UI/UX Improvements (Minor)

### 2. Profile Sidebar Collapsible
**Test:** 1, 11
**Location:** Right sidebar in inbox
**Issue:** Profile sidebar always visible, takes space from chat area
**Expected:** Toggle button to show/hide sidebar so chat can be highlighted

### 3. Conversation List Text Overflow
**Test:** 1
**Location:** Left panel conversation list
**Issue:** Message preview text runs too close to border
**Expected:** Proper truncation with padding before hitting border

### 4. Read Receipt Indicators Missing
**Test:** 7
**Location:** Outbound message bubbles
**Issue:** No status indicators on sent messages
**Expected:** Single gray check (sent), double gray (delivered), double blue (read)

### 5. Empty State Shows Previous Content
**Test:** 10
**Location:** Message area when no conversation selected
**Issue:** Shows previous typed content instead of clean empty state
**Expected:** Empty state message when no conversation is selected

### 6. Profile Sidebar Enhancements
**Test:** 11
**Location:** Right sidebar
**Issues:**
- Should show form data user filled (qualification context)
- Remove "View conversations" button (already in conversation)
- Notes should be inline (not popup modal)
- Show 3 recent activity/notes in sidebar

### 7. Merge Contacts Selection
**Test:** 13
**Location:** Merge contacts dialog
**Issue:** Second contact is auto-picked
**Expected:** User should be able to pick second contact from a searchable list

---

## Feature Requests (Noted)

### 8. Reply to Specific Message
**Test:** 5 (noted)
**Location:** Message thread
**Request:** Add reply button on chat bubbles for WhatsApp-style quote reply

---

## Summary

| Priority | Count |
|----------|-------|
| Critical (Major) | 1 |
| Minor | 6 |
| Feature Request | 1 |

**Total:** 8 items

---

## Suggested Fix Order

1. **Message Sending** - Critical, blocks core functionality
2. **Profile Sidebar Collapsible** - Quick win, improves UX
3. **Conversation List Overflow** - Quick CSS fix
4. **Empty State** - State management fix
5. **Read Receipts** - Requires Kapso webhook data
6. **Profile Sidebar Enhancements** - Multiple small changes
7. **Merge Contacts Selection** - UI enhancement
8. **Reply to Message** - New feature (future phase)
