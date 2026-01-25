---
status: complete
phase: 22-settings-data-management
source: [22-01-SUMMARY.md, 22-02-SUMMARY.md]
started: 2026-01-17T11:00:00Z
updated: 2026-01-17T11:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Navigate to Settings Data Tab
expected: Go to Settings page. Data tab visible, shows export/import options when clicked.
result: pass

### 2. Export Contacts CSV
expected: Click "Export Contacts" button. CSV file downloads with all contact fields (name, phone, email, status, score, tags, assigned_to).
result: pass

### 3. Export Notes CSV
expected: Click "Export Notes" button. CSV file downloads with note content, due date, contact name, and contact phone.
result: pass

### 4. Download CSV Template
expected: Click "Download Template" button. Template CSV downloads with correct column headers for import.
result: pass

### 5. Import CSV Preview
expected: Upload a CSV file with contact data. Preview shows first 5 rows with validation status. Invalid rows highlighted with error messages.
result: pass

### 6. Import CSV Validation - Phone Format
expected: Upload CSV with phone numbers in various formats (0812xxx, +6281xxx, 6281xxx). Preview shows all normalized to E.164 format (+62...).
result: pass

### 7. Import CSV - Duplicate Detection
expected: Upload CSV with duplicate phone numbers. Preview shows duplicate error on second occurrence of same phone.
result: pass

### 8. Import CSV - Confirm and Upsert
expected: After preview, click confirm. New contacts created, existing contacts (by phone) updated. Success message shown with count.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
