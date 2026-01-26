# Quick Task 002 Summary

## Task
Rename "Lead Management" to "Database" and fix pagination showing only 50 of 246 contacts.

## Changes Made

### 1. Renamed UI labels
- **sidebar.tsx:40** - Changed nav title from "Lead Management" to "Database"
- **database-client.tsx:312** - Changed page header from "Lead Management" to "Database"

### 2. Fixed pagination bug
- **api/contacts/route.ts:55-57** - Added `limit: 10000` to `listByWorkspaceInternal` call

**Root Cause:** The Convex query `listByWorkspaceInternal` has a default limit of 50. The API was not overriding this, so only 50 contacts were ever fetched. The API's pagination logic (lines 60-62) then paginated over these 50 contacts, giving the illusion of working pagination but never showing more than 50 total.

**Fix:** Pass a high limit (10000) to fetch all contacts from Convex, letting the API handle pagination over the complete dataset.

## Commit
```
e8b5603 fix(database): rename Lead Management to Database and fix pagination
```

## Verification
- Sidebar now shows "Database" instead of "Lead Management"
- Page header now shows "Database"
- All 246 contacts should now be accessible via pagination
