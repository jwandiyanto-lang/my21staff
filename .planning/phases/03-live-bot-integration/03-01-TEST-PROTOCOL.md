# Phase 03-01 Test Protocol

## Test Environment
- Production URL: https://www.my21staff.com
- Workspace: eagle-overseas
- Date: 2026-01-29

## Test 1: Your Intern UI Verification

### Persona Tab
1. Navigate to: https://www.my21staff.com/eagle-overseas/your-intern
2. Verify Persona tab loads without errors
3. Check bot name field displays current value
4. Change bot name to "ARI-Test"
5. Update tone description field
6. Click Save
7. Expected: Toast notification shows "Configuration saved"
8. Reload page
9. Expected: Changes persist (bot name still "ARI-Test")

### Flow Tab
1. Click Flow tab
2. Verify flow stages list loads
3. Try adding a new flow stage
4. Expected: Stage appears in list
5. Try editing stage name
6. Expected: Changes save successfully

### Database Tab
1. Click Database tab
2. Verify knowledge base entries load
3. Try adding a new knowledge entry
4. Expected: Entry appears in list
5. Try editing entry content
6. Expected: Changes save successfully

### Scoring Tab
1. Click Scoring tab
2. Verify scoring config loads
3. Try adjusting hot threshold slider
4. Expected: Value updates
5. Try adjusting weight percentages
6. Expected: Changes save successfully

### Slots Tab
1. Click Slots tab
2. Verify consultant slots load
3. Try adding a new time slot
4. Expected: Slot appears in calendar view
5. Try toggling slot active/inactive
6. Expected: Changes save successfully

### Global AI Toggle
1. Click AI toggle switch at top of page
2. Expected: Toggle switches off, toast shows "AI disabled"
3. Reload page
4. Expected: Toggle remains off (state persisted)
5. Click toggle again
6. Expected: Toggle switches on, toast shows "AI enabled"

## Test 2: API Endpoint Verification

### Prerequisites
```bash
# Get Clerk session token (logged in browser)
# Copy from DevTools > Application > Cookies > __session

export CLERK_TOKEN="<your-session-token>"
```

### GET /api/workspaces/eagle-overseas/ari-config
```bash
curl -v \
  -H "Cookie: __session=${CLERK_TOKEN}" \
  https://www.my21staff.com/api/workspaces/eagle-overseas/ari-config

# Expected response:
# HTTP/1.1 200 OK
# {
#   "config": {
#     "workspace_id": "...",
#     "enabled": true,
#     "bot_name": "ARI",
#     "greeting_style": "professional",
#     "language": "id",
#     "tone": { ... },
#     "community_link": null
#   }
# }
```

### PUT /api/workspaces/eagle-overseas/ari-config
```bash
curl -v -X PUT \
  -H "Cookie: __session=${CLERK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_name": "ARI-API-Test",
    "tone_description": "Professional and helpful",
    "greeting_template": "Hello! How can I assist you today?"
  }' \
  https://www.my21staff.com/api/workspaces/eagle-overseas/ari-config

# Expected response:
# HTTP/1.1 200 OK
# {
#   "config": {
#     "workspace_id": "...",
#     "bot_name": "ARI-API-Test",
#     "tone": {
#       "description": "Professional and helpful",
#       "greeting_template": "Hello! How can I assist you today?"
#     },
#     ...
#   }
# }
```

### PATCH /api/workspaces/eagle-overseas/ari-config
```bash
curl -v -X PATCH \
  -H "Cookie: __session=${CLERK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}' \
  https://www.my21staff.com/api/workspaces/eagle-overseas/ari-config

# Expected response:
# HTTP/1.1 200 OK
# {
#   "config": {
#     "enabled": false,
#     ...
#   }
# }
```

### GET again to verify PATCH
```bash
curl -v \
  -H "Cookie: __session=${CLERK_TOKEN}" \
  https://www.my21staff.com/api/workspaces/eagle-overseas/ari-config

# Expected: enabled should be false
```

## Test 3: Convex Dashboard Verification

1. Visit: https://dashboard.convex.dev
2. Select project: my21staff
3. Navigate to Tables > ariConfig
4. Find entry where workspace_id matches Eagle Overseas workspace
5. Verify fields:
   - `workspace_id`: Should be Convex ID string (starts with "j5...")
   - `bot_name`: Should match latest saved value
   - `enabled`: Should match toggle state
   - `tone`: Should be JSON object with description/greeting_template
   - `updated_at`: Should reflect recent changes
6. Check that changes from UI/API tests appear in database

## Test 4: Error Scenarios

### Auth Failure Test
```bash
# No auth token - should return 401
curl -v https://www.my21staff.com/api/workspaces/eagle-overseas/ari-config

# Expected: HTTP/1.1 401 Unauthorized
```

### Invalid Workspace Test
```bash
curl -v \
  -H "Cookie: __session=${CLERK_TOKEN}" \
  https://www.my21staff.com/api/workspaces/nonexistent/ari-config

# Expected: HTTP/1.1 404 Not Found
# { "error": "Workspace not found" }
```

### Invalid Data Test
```bash
curl -v -X PUT \
  -H "Cookie: __session=${CLERK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"bot_name": ""}' \
  https://www.my21staff.com/api/workspaces/eagle-overseas/ari-config

# Expected: HTTP/1.1 400 Bad Request
# { "error": "bot_name is required and must be non-empty" }
```

## Success Criteria

All tests must pass:
- [ ] All 5 Your Intern tabs load without console errors
- [ ] Configuration changes save successfully (toast notifications)
- [ ] Changes persist across page reloads
- [ ] GET /api/workspaces/eagle-overseas/ari-config returns 200
- [ ] PUT /api/workspaces/eagle-overseas/ari-config returns 200
- [ ] PATCH /api/workspaces/eagle-overseas/ari-config returns 200
- [ ] Changes appear in Convex dashboard
- [ ] Auth failures return 401
- [ ] Invalid workspace returns 404
- [ ] Invalid data returns 400

## Issues #1, #2, #7 Verification

From Phase 2.1 verification report:

**Issue #1**: Your Intern interface broken - shows "Failed to load workspace" error
- **Test**: Visit /eagle-overseas/your-intern
- **Expected**: Page loads successfully, no error message
- **Status**: [ ] Pass / [ ] Fail

**Issue #2**: Your Intern Persona tab shows error
- **Test**: Click Persona tab, verify no "Failed to load persona settings" error
- **Expected**: Bot name and settings load correctly
- **Status**: [ ] Pass / [ ] Fail

**Issue #7**: Your Intern save button non-functional
- **Test**: Change bot name, click Save
- **Expected**: Toast shows "Configuration saved", changes persist
- **Status**: [ ] Pass / [ ] Fail

## Notes

- All tests should be run in production environment
- Console should show no 500 errors from ari-config API
- Network tab should show 200 responses for all API calls
- Changes made during testing can be reverted afterwards
